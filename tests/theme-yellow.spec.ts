import { test, expect } from '@playwright/test';

test('yellow theme: verify accent colors applied', async ({ page }) => {
	await page.goto('http://localhost:5174/login');

	// Wait for page to load
	await page.waitForLoadState('networkidle');

	// Check login page accent colors (icon)
	const accentElement = page.locator('div.flex.h-9.w-9.items-center.justify-center.rounded-\\[11px\\]');
	await expect(accentElement).toBeVisible();

	const bgStyle = await accentElement.evaluate((el) => {
		return window.getComputedStyle(el).backgroundImage;
	});

	console.log('Login icon background:', bgStyle);
	expect(bgStyle).toContain('245, 158, 11'); // #f59e0b
	expect(bgStyle).toContain('180, 83, 9'); // #b45309

	// Check button gradient
	const loginBtn = page.locator('button[type="submit"]');
	await expect(loginBtn).toBeVisible();

	const btnBgStyle = await loginBtn.evaluate((el) => {
		return window.getComputedStyle(el).backgroundImage;
	});

	console.log('Login button background:', btnBgStyle);
	expect(btnBgStyle).toContain('217, 119, 6'); // #d97706
	expect(btnBgStyle).toContain('180, 83, 9'); // #b45309

	// Check badge border (should use --c-login-accent-soft-rgb)
	const badge = page.locator('span.inline-flex.w-max.items-center.gap-2.rounded-full.border').first();
	await expect(badge).toBeVisible();

	const badgeBorder = await badge.evaluate((el) => {
		return window.getComputedStyle(el).borderColor;
	});

	console.log('Badge border color:', badgeBorder);
	expect(badgeBorder).toContain('253, 230, 138'); // #fde68a (--c-login-accent-soft-rgb)
});