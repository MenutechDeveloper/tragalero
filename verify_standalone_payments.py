import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:8000/test_payment_preview.html')
        await page.wait_for_timeout(500)
        await page.screenshot(path='/home/jules/verification/payments_ui_aligned.png', full_page=True)
        await browser.close()

asyncio.run(main())
