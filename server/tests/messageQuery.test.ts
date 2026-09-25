import assert from 'node:assert/strict';
import test from 'node:test';
import {
	applyCheckboxDefaults,
	applyDateDefaults,
	applyLimitDefault,
	calcSkeletonCount,
	normalizeMessageBody,
	popStackCursor,
	pushStackCursor,
	rebuildStack,
	saveCursorStack,
	shouldFetch,
	stackStorageValue,
	statusOptionsFor
} from '../src/lib/messageQuery.ts';

test('applyDateDefaults: scope today + keduanya kosong -> set hari ini', () => {
	const p = applyDateDefaults(new URLSearchParams(), 'today');
	assert.equal(p.has('startDate'), true);
	assert.equal(p.has('endDate'), true);
	assert.match(p.get('startDate') as string, /^\d{4}-\d{2}-\d{2}$/);
});

test('applyDateDefaults: tidak menimpa tanggal yang sudah ada', () => {
	const p = applyDateDefaults(
		new URLSearchParams('startDate=2026-01-05&endDate=2026-01-31'),
		'today'
	);
	assert.equal(p.get('startDate'), '2026-01-05');
	assert.equal(p.get('endDate'), '2026-01-31');
});

test('applyDateDefaults: hanya ada salah satu -> tidak menambah apa pun', () => {
	const onlyEnd = applyDateDefaults(new URLSearchParams('endDate=2026-01-31'), 'today');
	assert.equal(onlyEnd.has('startDate'), false);
	assert.equal(onlyEnd.get('endDate'), '2026-01-31');
	const onlyStart = applyDateDefaults(new URLSearchParams('startDate=2026-01-05'), 'today');
	assert.equal(onlyStart.has('endDate'), false);
	assert.equal(onlyStart.get('startDate'), '2026-01-05');
});

test('applyDateDefaults: scope all -> tidak pernah menambah tanggal', () => {
	const p = applyDateDefaults(new URLSearchParams(), 'all');
	assert.equal(p.has('startDate'), false);
	assert.equal(p.has('endDate'), false);
	assert.equal(p.toString(), '');
});

test('applyDateDefaults: param lain dipertahankan', () => {
	const p = applyDateDefaults(new URLSearchParams('pageSize=25&b=x'), 'today');
	assert.equal(p.get('pageSize'), '25');
	assert.equal(p.get('b'), 'x');
	assert.equal(p.get('startDate'), p.get('endDate'));
});

test('applyLimitDefault: tanpa param limit -> 20', () => {
	const p = applyLimitDefault(new URLSearchParams());
	assert.equal(p.get('limit'), '20');
});

test('applyLimitDefault: limit sudah ada -> dipertahankan', () => {
	const p = applyLimitDefault(new URLSearchParams('limit=50'));
	assert.equal(p.get('limit'), '50');
	const p2 = applyLimitDefault(new URLSearchParams('limit='));
	assert.equal(p2.get('limit'), '');
});

test('applyCheckboxDefaults: defaultChecked diterapkan hanya saat param hilang', () => {
	const fs = [
		{ param: 'req', label: 'R', type: 'checkbox' as const, defaultChecked: true },
		{ param: 'jawab', label: 'J', type: 'checkbox' as const }
	];
	const p = applyCheckboxDefaults(new URLSearchParams(), fs);
	assert.equal(p.get('req'), 'true');
	assert.equal(p.has('jawab'), false);
	const p2 = applyCheckboxDefaults(new URLSearchParams('req=false'), fs);
	assert.equal(p2.get('req'), 'false');
});

test('calcSkeletonCount: nilai normal & fallback', () => {
	assert.equal(calcSkeletonCount(25, 10), 10);
	assert.equal(calcSkeletonCount(0, 0), 10);
	assert.equal(calcSkeletonCount(0, 25), 15);
	assert.equal(calcSkeletonCount(15, 0), 15);
	assert.equal(calcSkeletonCount(100, 100), 15);
	assert.equal(calcSkeletonCount(5, 3), 3);
});

test('pushStackCursor: tambah di belakang', () => {
	assert.deepEqual(pushStackCursor([null], 50), [null, 50]);
	assert.deepEqual(pushStackCursor([null, 50], 100), [null, 50, 100]);
	const asli = [null];
	pushStackCursor(asli, 50);
	assert.deepEqual(asli, [null], 'tidak memutasi input');
});

test('popStackCursor: kembalikan stack baru + prev', () => {
	const r = popStackCursor([null, 50, 100]);
	assert.deepEqual(r.stack, [null, 50]);
	assert.equal(r.prev, 50);
	const r2 = popStackCursor([null, 50]);
	assert.deepEqual(r2.stack, [null]);
	assert.equal(r2.prev, null);
	const r3 = popStackCursor([null]);
	assert.deepEqual(r3.stack, []);
	assert.equal(r3.prev, null);
});

test('rebuildStack: potong sesuai cursor atau mulai baru', () => {
	assert.deepEqual(rebuildStack([null, 50, 100, 150], 100), [null, 50, 100]);
	assert.deepEqual(rebuildStack([null, 50], 50), [null, 50]);
	assert.deepEqual(rebuildStack([null, 50, 100], 42), [42]);
	assert.deepEqual(rebuildStack([null, 50], null), [null]);
});

test('stackStorageValue: null payload -> null, selainnya JSON', () => {
	assert.equal(stackStorageValue([null]), null);
	assert.equal(stackStorageValue([]), '[]');
	assert.equal(stackStorageValue([null, 25]), '[null,25]');
	assert.equal(stackStorageValue([25]), '[25]');
});

test('saveCursorStack: null -> hapus, lain -> simpan', () => {
	const store: Record<string, string> = {};
	let removedKey: string | null = null;
	(globalThis as Record<string, unknown>).sessionStorage = {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => (store[k] = v),
		removeItem: (k: string) => {
			delete store[k];
			removedKey = k;
		}
	};
	saveCursorStack('k', [null, 5]);
	assert.equal(store['k'], '[null,5]');
	saveCursorStack('k', [null]);
	assert.equal(removedKey, 'k');
	assert.equal(store['k'], undefined);
});

test('shouldFetch: beda key/retry -> fetch, sama -> skip', () => {
	assert.equal(shouldFetch('a', 0, 'a', 0), false);
	assert.equal(shouldFetch('a', 0, 'a', 1), true);
	assert.equal(shouldFetch('a', 0, 'b', 0), true);
	assert.equal(shouldFetch('', 0, 'a', 0), true);
});

test('normalizeMessageBody: sukses -> data', () => {
	const r = normalizeMessageBody({
		status: 'sukses',
		data: {
			items: [{ kode: 'x' } as never],
			meta: { has_next_page: false, has_prev_page: false } as never
		}
	});
	assert.ok(r.data);
	assert.equal(r.data.items.length, 1);
	assert.equal(r.error, null);
	assert.equal(r.cause, null);
});

test('normalizeMessageBody: gagal -> error + cause + default', () => {
	const r = normalizeMessageBody({ status: 'gagal', message: 'M', detail: 'D' });
	assert.equal(r.data, null);
	assert.equal(r.error, 'M');
	assert.equal(r.cause, 'D');
	const r2 = normalizeMessageBody({ status: 'gagal' });
	assert.equal(r2.error, 'Gagal memuat data.');
	assert.equal(r2.cause, null);
	const r3 = normalizeMessageBody({ status: 'sukses' });
	assert.equal(r3.data, null);
	assert.equal(r3.error, 'Gagal memuat data.');
});

test('statusOptionsFor: inbox vs outbox', () => {
	const inbox = statusOptionsFor('/inbox');
	assert.ok(inbox.some(([k]) => k === '69'));
	assert.ok(inbox.every(([k, v]) => k === v));
	const outbox = statusOptionsFor('/outbox');
	assert.deepEqual(
		outbox.map(([k]) => k),
		['20', '40', '50']
	);
});
