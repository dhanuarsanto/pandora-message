import assert from 'node:assert/strict';
import test from 'node:test';
import { buildQuery, cn, initFilterFromUrl, sortedParamsString } from '../src/lib/utils.ts';
import type { FilterField } from '../src/lib/message/types.ts';

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
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('a=false'))['a'], 'false');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('a=true'))['a'], 'true');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('a=lain'))['a'], '');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('b=false'))['b'], '');
	assert.equal(initFilterFromUrl(fs, new URLSearchParams('b=true'))['b'], 'true');
});

test('initFilterFromUrl + buildQuery: status false bertahan saat filter lain berubah', () => {
	const fs: FilterField[] = [
		{ param: 'a', label: 'A', type: 'checkbox', defaultChecked: true },
		{ param: 'pesan', label: 'Pesan', type: 'text' }
	];
	const parsed = initFilterFromUrl(fs, new URLSearchParams('a=false'));
	assert.equal(parsed['a'], 'false');
	const next = buildQuery({ ...parsed, pesan: 'halo' }).toString();
	assert.equal(next.includes('a=false'), true);
	assert.equal(initFilterFromUrl(fs, new URLSearchParams(next))['a'], 'false');
});

test('buildQuery: buang nilai kosong', () => {
	const q = { a: '', b: 'x', c: '' };
	assert.equal(buildQuery(q).toString(), 'b=x');
});

test('buildQuery: cursor/pageSize di URL lama tidak diteruskan', () => {
	const fs: FilterField[] = [{ param: 'pesan', label: 'Pesan', type: 'text' }];
	const parsed = initFilterFromUrl(fs, new URLSearchParams('cursor=7&pageSize=25&pesan=x'));
	assert.equal(buildQuery(parsed).toString(), 'pesan=x');
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
