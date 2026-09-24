import assert from 'node:assert/strict';
import test from 'node:test';
import { paramsEqual } from '../src/lib/params.ts';

test('paramsEqual: urutan param berbeda tapi nilai sama', () => {
	const a = new URLSearchParams('status=x&startDate=2026-09-24&endDate=2026-09-24');
	const b = new URLSearchParams('endDate=2026-09-24&startDate=2026-09-24&status=x');
	assert.equal(paramsEqual(a, b), true);
});

test('paramsEqual: nilai berbeda -> false', () => {
	const a = new URLSearchParams('status=x');
	const b = new URLSearchParams('status=y');
	assert.equal(paramsEqual(a, b), false);
});

test('paramsEqual: key berbeda -> false', () => {
	const a = new URLSearchParams('status=x');
	const b = new URLSearchParams('tipe=x');
	assert.equal(paramsEqual(a, b), false);
});

test('paramsEqual: jumlah param berbeda -> false', () => {
	const a = new URLSearchParams('status=x');
	const b = new URLSearchParams('status=x&limit=10');
	assert.equal(paramsEqual(a, b), false);
});

test('paramsEqual: keduanya kosong', () => {
	assert.equal(paramsEqual(new URLSearchParams(''), new URLSearchParams('')), true);
});

test('paramsEqual: duplikat key nilai sama -> true, beda -> false', () => {
	const a = new URLSearchParams('k=1&k=2');
	const b = new URLSearchParams('k=1&k=2');
	const c = new URLSearchParams('k=1&k=3');
	assert.equal(paramsEqual(a, b), true);
	assert.equal(paramsEqual(a, c), false);
});