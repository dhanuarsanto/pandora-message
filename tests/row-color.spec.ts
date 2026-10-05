import { test, expect } from '@playwright/test';

test('login works', async ({ page }) => {
	await page.goto('http://localhost:5173/login');
	await page.fill('input[name="username"]', 'andre');
	await page.fill('input[name="password"]', 'andreGaming');
	await page.click('button[type="submit"]');
	await page.waitForURL('**/inbox', { timeout: 15000 });
	await page.waitForSelector('table tbody tr', { timeout: 10000 });
	const count = await page.locator('table tbody tr').count();
	console.log('Row count:', count);
	expect(count).toBeGreaterThan(0);
});