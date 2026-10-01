import assert from 'node:assert/strict';
import test from 'node:test';
import {
	buildQuery,
	cn,
	initFilterFromUrl,
	initStack,
	sortedParamsString
} from '../src/lib/utils.ts';
import type { FilterField } from '../src/lib/message/types.ts';

function stubSession(store: Record<string, string>) {
	(globalThis as Record<string, unknown>).sessionStorage = {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => (store[k] = v),
		removeItem: (k: string) => delete store[k]
	};
}

test('initStack: kosong/korup -> halaman pertama', () => {
	stubSession({});
	assert.deepEqual(initStack('k'), [null]);
	stubSession({ k: 'not-json' });
	assert.deepEqual(initStack('k'), [null]);
	stubSession({ k: '{"a":1}' });
	assert.deepEqual(initStack('k'), [null]);
	stubSession({ k: '[null,"x"]' });
	assert.deepEqual(initStack('k'), [null]);
});

test('initStack: valid -> dikembalikan', () => {
	stubSession({ k: '[null,25,50]' });
	assert.deepEqual(initStack('k'), [null, 25, 50]);
	stubSession({ k: '[]' });
	assert.deepEqual(initStack('k'), []);
});

test('initFilterFromUrl: semua kolom terisi default kosong', () => {
	const fs: FilterField[] = [
		{ param: 'startDate', label: 'Dari', type: 'date' },
		{ param: 'pesan', label: 'Pesan', type: 'text' },
		{ param: 'check', label: 'Cek', type: 'checkbox' }
	];
	const out = initFilterFromUrl(fs, new URLSearchParams('pesan=halo'));
	assert.deepEqual(out, { startDate: '', pesan: 'halo', check: '' });
});

test('initFilterFromUrl: checkbox hanya true', () => {
	const fs: FilterField[] = [{ param: 'c', label: 'C', type: 'checkbox' }];
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('c=false'))['c'], '');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('c=true'))['c'], 'true');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams())['c'], '');
});

test('initFilterFromUrl: defaultChecked terisi true saat tanpa param', () => {
	const fs: FilterField[] = [
		{ param: 'a', label: 'A', type: 'checkbox', defaultChecked: true },
		{ param: 'b', label: 'B', type: 'checkbox' }
	];
	assert.equal(initFilterFromUrl(fs, new URLSearchParams())['a'], 'true');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams())['b'], '');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('a=false'))['a'], '');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('b=true'))['b'], 'true');
});

test('buildQuery: buang nilai kosong', () => {
	const q = { a: '', b: 'x', c: '' };
	assert.equal(buildQuery(q, '', null).toString(), 'b=x');
});

test('buildQuery: pageSize hanya bila angka positif', () => {
	expectPageSize('', '');
	expectPageSize('abc', '');
	expectPageSize('0', '');
	expectPageSize('-5', '');
	expectPageSize('25', '25');

	function expectPageSize(input: string, expected: string) {
		const out = buildQuery({}, input, null).toString();
		assert.equal(out, expected ? `pageSize=${expected}` : '', `pageSize='${input}'`);
	}
});

test('buildQuery: cursor disimpan', () => {
	assert.equal(buildQuery({}, '', 7).toString(), 'cursor=7');
	assert.equal(buildQuery({ a: '1' }, '', 3).toString(), 'a=1&cursor=3');
});

test('sortedParamsString: urutkan deterministik & pertahankan nilai', () => {
	const input = new URLSearchParams(
		'limit=20&startDate=2026-09-25&requestFromReseller=true&endDate=2026-09-25'
	);
	assert.equal(
		sortedParamsString(input),
		'endDate=2026-09-25&limit=20&requestFromReseller=true&startDate=2026-09-25'
	);
	assert.equal(sortedParamsString(new URLSearchParams('b=2&a=1')), 'a=1&b=2');
});

test('cn: gabung & merge konflik tailwind', () => {
	const falsy: string | false = false;
	assert.equal(cn('a', 'b'), 'a b');
	assert.equal(cn('px-2', falsy && 'x', null, undefined, 'px-4'), 'px-4');
	assert.equal(cn('bg-red-500', 'bg-blue-500'), 'bg-blue-500');
	assert.equal(cn('', 'x'), 'x');
});
