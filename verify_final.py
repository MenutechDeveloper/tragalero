import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Mock Supabase responses
        await page.route("**/auth/v1/session", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"user":{"id":"123","email":"admin@test.com"}}'
        ))

        await page.route("**/rest/v1/usuarios*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"id":"123","name":"Admin User","role":"Admin","domain":"test.com"}]'
        ))

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

        # Test adminCustomer
        print("Testing adminCustomer.html...")
        await page.goto(f"file://{os.getcwd()}/docs/adminCustomer.html")
        await page.wait_for_selector("#app:not(.hidden)", timeout=5000)
        await page.screenshot(path="verify_adminCustomer.png")
        print("adminCustomer.html rendered successfully.")

        # Test adminWeb
        print("Testing adminWeb.html...")
        await page.goto(f"file://{os.getcwd()}/docs/adminWeb.html")
        await page.wait_for_selector("#main-app:not(.hidden)", timeout=5000)

        # Check if gallery element is present and has attributes
        gallery = await page.query_selector("tragalero-gallery")
        if gallery:
            images = await gallery.get_attribute("images-list")
            print(f"Gallery found with images: {images}")

        await page.screenshot(path="verify_adminWeb.png")
        print("adminWeb.html rendered successfully.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
