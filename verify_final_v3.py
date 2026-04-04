import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Mocking auth properly
        await page.route("**/auth/v1/user*", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body='{"id": "123", "email": "admin@test.com"}'
        ))
        await page.route("**/auth/v1/session*", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body='{"session": {"access_token": "fake", "user": {"id": "123", "email": "admin@test.com"}}}'
        ))

        # Mock public.usuarios
        # Both adminCustomer and adminWeb call this.
        await page.route("**/rest/v1/usuarios*", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body='[{"id":"123","name":"Admin User","role":"Admin","domain":"test.com"}]'
        ))

        # Mock galeria
        await page.route("**/rest/v1/galeria*", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body='[{"image_url":"https://res.cloudinary.com/demo/image/upload/sample.jpg"}]'
        ))

        await page.route("**/rest/v1/promos*", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body='[]'
        ))

        print("Testing adminCustomer.html...")
        await page.goto(f"file://{os.getcwd()}/docs/adminCustomer.html")

        # Log console for debugging
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        try:
            await page.wait_for_selector("#app:not(.hidden)", timeout=5000)
            print("adminCustomer.html: #app is visible.")
            await page.screenshot(path="final_adminCustomer.png")
        except Exception as e:
            print(f"adminCustomer.html failed to show #app. Current URL: {page.url}")
            await page.screenshot(path="failed_adminCustomer.png")

        print("Testing adminWeb.html...")
        await page.goto(f"file://{os.getcwd()}/docs/adminWeb.html")
        try:
            await page.wait_for_selector("#main-app:not(.hidden)", timeout=5000)
            print("adminWeb.html: #main-app is visible.")
            await page.screenshot(path="final_adminWeb.png")

            # Re-verify gallery attribute
            gallery_attr = await page.evaluate("document.querySelector('tragalero-gallery').getAttribute('images-list')")
            print(f"Gallery images-list: {gallery_attr}")
        except Exception as e:
            print(f"adminWeb.html failed to show #main-app. Current URL: {page.url}")
            await page.screenshot(path="failed_adminWeb.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
