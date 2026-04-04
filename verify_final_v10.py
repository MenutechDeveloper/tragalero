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

        # Mock public.usuarios
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

        print("--- Testing adminCustomer.html ---")
        await page.goto(f"file://{os.getcwd()}/docs/adminCustomer.html")
        await asyncio.sleep(2)

        app_hidden = await page.evaluate("document.getElementById('app').classList.contains('hidden')")
        print(f"adminCustomer #app hidden: {app_hidden}")
        await page.screenshot(path="final_check_adminCustomer.png")

        print("--- Testing adminWeb.html ---")
        await page.add_init_script("""
            sessionStorage.setItem('mt_edit_owner_id', '123');
        """)
        await page.goto(f"file://{os.getcwd()}/docs/adminWeb.html")
        await asyncio.sleep(2)

        main_app_hidden = await page.evaluate("document.getElementById('main-app').classList.contains('hidden')")
        print(f"adminWeb #main-app hidden: {main_app_hidden}")

        gallery_html = await page.evaluate("document.getElementById('gallery-container').innerHTML")
        print(f"Gallery Container Content Length: {len(gallery_html)}")

        await page.screenshot(path="final_check_adminWeb.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
