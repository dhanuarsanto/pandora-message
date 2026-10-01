import assert from 'node:assert/strict';
import test from 'node:test';
import {
	addDaysISO,
	firstOfMonthISO,
	HARI,
	monthCells,
	parseISODate,
	toISODate,
	todayISO,
	BULAN,
	BULAN_PENDEK
} from '../src/lib/date.ts';

test('HARI/BULAN: konstanta lengkap', () => {
	assert.equal(HARI.length, 7);
	assert.equal(BULAN.length, 12);
	assert.equal(BULAN_PENDEK.length, 12);
	assert.equal(BULAN_PENDEK[0], 'Jan');
	assert.equal(BULAN[0], 'Januari');
});

test('toISODate: format yyyy-mm-dd dengan padding', () => {
	assert.equal(toISODate(new Date(2026, 0, 5)), '2026-01-05');
	assert.equal(toISODate(new Date(2026, 8, 24)), '2026-09-24');
	assert.equal(toISODate(new Date(2026, 11, 31)), '2026-12-31');
});

test('parseISODate: valid -> Date lokal', () => {
	const d = parseISODate('2026-09-24');
	assert.ok(d);
	assert.equal(d.getFullYear(), 2026);
	assert.equal(d.getMonth(), 8);
	assert.equal(d.getDate(), 24);
});

test('parseISODate: invalid/corrupt -> null', () => {
	assert.equal(parseISODate(undefined), null);
	assert.equal(parseISODate(''), null);
	assert.equal(parseISODate('abc'), null);
	assert.equal(parseISODate('2026-9-24'), null);
	assert.equal(parseISODate('2026/09/24'), null);
	assert.equal(parseISODate('2026-09-24T10:00'), null);
});

test('todayISO: format valid & = hari ini', () => {
	const iso = todayISO();
	assert.match(iso, /^\d{4}-\d{2}-\d{2}$/);
	assert.equal(iso, toISODate(new Date()));
});

test('addDaysISO: geser hari (bulan lintas)', () => {
	const from = new Date(2026, 1, 27); // 27 Feb 2026
	const plus = new Date(from);
	plus.setDate(plus.getDate() - 2);
	assert.equal(toISODate(plus), '2026-02-25');
	assert.match(addDaysISO(-2), /^\d{4}-\d{2}-\d{2}$/);
	assert.equal(addDaysISO(0), todayISO());
});

test('firstOfMonthISO: awal bulan', () => {
	const t = new Date();
	const expected = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`;
	assert.equal(firstOfMonthISO(0), expected);
	assert.equal(firstOfMonthISO(-2).endsWith('-01'), true);
});

test('monthCells: September 2026 (mulai Selasa, 30 hari)', () => {
	const cells = monthCells(2026, 8);
	const hariPertama = new Date(2026, 8, 1).getDay(); // 0=Min
	const offset = hariPertama === 0 ? 6 : hariPertama - 1;
	assert.equal(cells.length, offset + 30);
	assert.equal(cells[0].d, null);
	assert.equal(cells[offset].d, 1);
	assert.equal(cells[offset].iso, '2026-09-01');
	assert.equal(cells[cells.length - 1].iso, '2026-09-30');
});

test('monthCells: Februari 2024 kabisat (29 hari)', () => {
	const cells = monthCells(2024, 1);
	const hariPertama = new Date(2024, 1, 1).getDay();
	const offset = hariPertama === 0 ? 6 : hariPertama - 1;
	assert.equal(cells.length, offset + 29);
	const hari = cells.filter((c) => c.d !== null);
	assert.equal(hari.length, 29);
	assert.equal(hari[28].iso, '2024-02-29');
});
