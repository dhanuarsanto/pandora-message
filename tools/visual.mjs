import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'http://localhost:3000';
const OUT = 'test-results/shots';
const USER = process.env.APP_USER;
const PASS = process.env.APP_PASS;

if (!USER || !PASS) {
	console.error('APP_USER dan APP_PASS harus diisi lewat lingkungan.');
	process.exit(1);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const hasil = {};

async function cek(scheme, viewport, nama) {
	const context = await browser.newContext({ viewport, colorScheme: scheme, locale: 'id-ID' });
	const page = await context.newPage();
	const galat = [];
	page.on('console', (m) => {
		if (m.type() === 'error') galat.push(m.text());
	});
	page.on('pageerror', (e) => galat.push(String(e)));

	await page.goto(BASE + '/login');
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(1200);
	await page.fill('#username', USER);
	await page.fill('#password', PASS);
	await page.click('button[type=submit]');
	await page.waitForURL('**/inbox', { timeout: 60000 });
	await page.waitForSelector('table', { timeout: 60000 });

	await page.goto(BASE + '/inbox?startDate=2019-01-01&endDate=2026-12-31');
	await page.waitForSelector('tbody td.tabular-nums', { timeout: 60000 });
	await page.waitForTimeout(2500);

	hasil[nama] = await page.evaluate(() => {
		const sel = document.querySelector('tbody tr');
		const td = sel?.querySelector('td');
		const gl = getComputedStyle(document.documentElement);
		const mono = [...document.querySelectorAll('tbody td')].find((e) =>
			e.className.includes('font-mono')
		);
		const angka = document.querySelector('tbody td.tabular-nums');
		const isi = document.querySelector('tbody td > span.block');
		return {
			tokenGaris: gl.getPropertyValue('--c-table-line').trim(),
			'sel biasa': {
				ukuran: td ? getComputedStyle(td).fontSize : null,
				garisBawah: td ? getComputedStyle(td).borderBottomColor : null,
				tebal: td ? getComputedStyle(td).fontWeight : null
			},
			'sel mono': mono ? { ukuran: getComputedStyle(mono).fontSize } : null,
			kolomTanggal: angka
				? {
						ukuran: getComputedStyle(angka).fontSize,
						bentukAngka: getComputedStyle(angka).fontVariantNumeric
					}
				: null,
			selIsiPesan: isi
				? {
						ukuran: getComputedStyle(isi).fontSize,
						jarakBaris: getComputedStyle(isi).lineHeight,
						tinggi: isi.getBoundingClientRect().height.toFixed(1)
					}
				: null,
			jumlahBaris: document.querySelectorAll('tbody tr').length,
			kepala: (() => {
				const th = document.querySelector('thead th');
				return th ? getComputedStyle(th).fontSize : null;
			})()
		};
	});
	hasil[nama].galat = galat;

	await page.screenshot({ path: `${OUT}/${nama}.png` });
	await context.close();
}

await cek('light', { width: 1440, height: 900 }, 'tabel-terang');
await cek('dark', { width: 1440, height: 900 }, 'tabel-gelap');
await cek('light', { width: 390, height: 844 }, 'tabel-mobile');

await writeFile(`${OUT}/tabel-ukur.json`, JSON.stringify(hasil, null, 2));
console.log('SELESAI');

await browser.close();
