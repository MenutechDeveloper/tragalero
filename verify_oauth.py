import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})

        file_path = f"file://{os.path.abspath('docs/onlinePayment.html')}"
        await page.goto(file_path)
        await page.wait_for_timeout(1000)

        os.makedirs("/home/jules/verification", exist_ok=True)
        screenshot_path = "/home/jules/verification/oauth_verification.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
        await browser.close()

asyncio.run(main())
