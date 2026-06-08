import { chromium } from '@playwright/test';
(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('PAGEERROR', err.message));
    console.log('goto signup');
    await page.goto('http://127.0.0.1:3001/auth/signup');
    console.log('signup url', page.url());
    console.log('signup title', await page.title());
    console.log('input count', await page.locator('input').count());
    await page.getByPlaceholder(/full name/i).fill('Test User');
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('Test1234!');
    await page.getByRole('button', { name: /create account/i }).click({ trial: true });
    console.log('trial click done');
    await browser.close();
  } catch (err) {
    console.error('DEBUG ERROR', err);
    process.exit(1);
  }
})();
