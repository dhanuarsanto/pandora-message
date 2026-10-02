import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'http://localhost:3000';
const OUT = 'test-results/shots';
const USER = process.env.APP_USER;
const PASS = process.env.APP_PASS;
const WIDTHS = [1440, 1280, 1100, 1024, 900, 768, 640, 480, 390];

if (!USER || !PASS) {
	console.error('APP_USER dan APP_PASS harus diisi lewat lingkungan.');
	process.exit(1);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
	viewport: { width: 1440, height: 900 },
	colorScheme: 'light',
	locale: 'id-ID'
});
const page = await context.newPage();
const errors = [];
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE + '/login');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1200);
await page.fill('#username', USER);
await page.fill('#password', PASS);
await page.click('button[type=submit]');
try {
	await page.waitForURL('**/inbox', { timeout: 15000 });
} catch {
	const teks = await page.locator('form').innerText().catch(() => '');
	throw new Error(`Masuk gagal. URL: ${page.url()}\n${teks.slice(0, 200)}`);
}
await page.waitForSelector('table', { timeout: 20000 });
await page.waitForTimeout(1500);

const SWITCH = page.locator('label', { hasText: 'Perbarui otomatis' });
if (!(await SWITCH.locator('input').isChecked())) await SWITCH.click();

function ukur() {
	return page.evaluate(() => {
		const tombol = document.querySelector('button[aria-label="Selang penyegaran otomatis"]');
		const panel = document.querySelector('[role=listbox]');
		const tag = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return {
				w: Math.round(r.width),
				l: Math.round(r.left),
				teks: el.textContent.trim(),
				potong: el.scrollWidth > el.clientWidth + 1,
				scrollW: el.scrollWidth,
				clientW: el.clientWidth
			};
		};
		const row = tombol?.parentElement?.parentElement;
		const pembungkus = tombol?.parentElement;
		return {
			tombol: tag(tombol),
			labelTombol: tag(tombol?.querySelector('span')),
			row: row && {
				w: Math.round(row.getBoundingClientRect().width),
				gaya: getComputedStyle(row).flexWrap
			},
			pembungkus: pembungkus && {
				w: Math.round(pembungkus.getBoundingClientRect().width),
				gaya: getComputedStyle(pembungkus).display
			},
			panel: panel && { w: Math.round(panel.getBoundingClientRect().width) },
			item: panel
				? [...panel.querySelectorAll('[role=option]')].map((o) => tag(o.querySelector('span') ?? o))
				: []
		};
	});
}

const hasil = {};
for (const w of WIDTHS) {
	await page.setViewportSize({ width: w, height: 900 });
	await page.waitForTimeout(400);
	if (await page.locator('[role=listbox]').count()) {
		await page.keyboard.press('Escape');
		await page.waitForTimeout(200);
	}
	const buka = page.locator('button', { hasText: 'Tampilkan Filter' });
	if (await buka.count()) {
		await buka.first().click();
		await page.waitForTimeout(400);
	}
	if (await SWITCH.count()) {
		const sw = SWITCH.locator('input');
		if (await sw.count() && !(await sw.isChecked())) await SWITCH.click();
		await page.waitForTimeout(200);
	}
	await page.click('button[aria-label="Selang penyegaran otomatis"]');
	await page.waitForTimeout(250);
	hasil[w] = await ukur();
	await page.screenshot({ path: `${OUT}/lebar-${w}.png` });
	await page.keyboard.press('Escape');
	await page.waitForTimeout(150);
}

const ringkas = {};
for (const [w, h] of Object.entries(hasil)) {
	ringkas[w] = {
		tombolW: h.tombol.w,
		labelPotong: h.labelTombol.potong,
		panelW: h.panel?.w,
		terpotong: h.item.filter((i) => i.potong).map((i) => i.teks),
		lebarItem: h.item.map((i) => `${i.teks}=${i.w}`)
	};
}
const laporan = { ringkas, galat: errors };
await writeFile(`${OUT}/laporan.json`, JSON.stringify(laporan, null, 2));
console.log('SELESAI');

await browser.close();
