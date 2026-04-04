import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Inject session into localStorage
        await page.add_init_script("""
            window.localStorage.setItem('sb-jqmmzufomzcsyzdskxze-auth-token', JSON.stringify({
                "access_token": "fake",
                "refresh_token": "fake",
                "user": {"id": "123", "email": "admin@test.com"},
                "expires_at": 9999999999
            }));
        """)

        # Mocking auth properly
        await page.route("**/auth/v1/user*", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body='{"id": "123", "email": "admin@test.com"}'
        ))
        await page.route("**/auth/v1/session*", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body='{"session": {"access_token": "fake", "user": {"id": "123", "email": "admin@test.com"}}}'
        ))

        # Mock public.usuarios - Using "Admin" with capital A
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

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))

        print("Testing adminCustomer.html...")
        await page.goto(f"file://{os.getcwd()}/docs/adminCustomer.html")

        try:
            await page.wait_for_selector("#app:not(.hidden)", timeout=5000)
            print("adminCustomer.html: #app is visible.")
            await page.screenshot(path="final_adminCustomer_v7.png")
        except Exception as e:
            print(f"adminCustomer.html failed to show #app. Current URL: {page.url}")
            await page.screenshot(path="failed_adminCustomer_v7.png")

        print("Testing adminWeb.html...")
        await page.add_init_script("""
            sessionStorage.setItem('mt_edit_owner_id', '123');
        """)
        await page.goto(f"file://{os.getcwd()}/docs/adminWeb.html")
        try:
            await page.wait_for_selector("#main-app:not(.hidden)", timeout=5000)
            print("adminWeb.html: #main-app is visible.")
            await page.screenshot(path="final_adminWeb_v7.png")

            gallery_attr = await page.evaluate("document.querySelector('tragalero-gallery').getAttribute('images-list')")
            print(f"Gallery images-list: {gallery_attr}")
        except Exception as e:
            print(f"adminWeb.html failed to show #main-app. Current URL: {page.url}")
            await page.screenshot(path="failed_adminWeb_v7.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
