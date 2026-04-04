import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Mock Supabase responses
        # Mocking auth session properly
        async def mock_auth(route):
            await route.fulfill(
                status=200,
                content_type="application/json",
                body='{"session": {"access_token": "fake", "user": {"id": "123", "email": "admin@test.com"}}}'
            )

        await page.route("**/auth/v1/session*", mock_auth)

        # Mock public.usuarios
        await page.route("**/rest/v1/usuarios*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"id":"123","name":"Admin User","role":"Admin","domain":"test.com"}]'
        ))

        # Mock galeria
        await page.route("**/rest/v1/galeria*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"image_url":"https://res.cloudinary.com/demo/image/upload/sample.jpg"}]'
        ))

        await page.route("**/rest/v1/promos*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        print("Testing adminCustomer.html...")
        # Use a real file path and handle navigation manually if redirect occurs
        await page.goto(f"file://{os.getcwd()}/docs/adminCustomer.html")

        # We need to wait for JS execution. If it redirects, something is wrong in the auth mock.
        try:
            await page.wait_for_selector("#app:not(.hidden)", timeout=5000)
            print("adminCustomer.html: #app is visible.")
        except Exception as e:
            print(f"adminCustomer.html failed to show #app. Current URL: {page.url}")
            await page.screenshot(path="failed_adminCustomer.png")

        print("Testing adminWeb.html...")
        await page.goto(f"file://{os.getcwd()}/docs/adminWeb.html")
        try:
            await page.wait_for_selector("#main-app:not(.hidden)", timeout=5000)
            print("adminWeb.html: #main-app is visible.")

            # Re-verify gallery attribute
            gallery_attr = await page.evaluate("document.querySelector('tragalero-gallery').getAttribute('images-list')")
            print(f"Gallery images-list: {gallery_attr}")
        except Exception as e:
            print(f"adminWeb.html failed to show #main-app. Current URL: {page.url}")
            await page.screenshot(path="failed_adminWeb.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
