import assert from 'node:assert/strict';
import test from 'node:test';
import {
	AUTO_REFRESH_OPTIONS,
	autoRefreshMs,
	applyCheckboxDefaults,
	applyDateDefaults,
	applyLimitDefault,
	calcSkeletonCount,
	canAutoRefresh,
	DEFAULT_AUTO_REFRESH,
	normalizeMessageBody,
	planFetch,
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
	const p = applyDateDefaults(new URLSearchParams('limit=25&b=x'), 'today');
	assert.equal(p.get('limit'), '25');
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
	assert.equal(calcSkeletonCount(25), 15);
	assert.equal(calcSkeletonCount(0), 10);
	assert.equal(calcSkeletonCount(15), 15);
	assert.equal(calcSkeletonCount(100), 15);
	assert.equal(calcSkeletonCount(5), 5);
});

test('planFetch: tidak ada yang berubah -> jangan jalankan', () => {
	const t = { key: 'a', retry: 0, refresh: 0 };
	assert.deepEqual(planFetch(t, { ...t }), { run: false, silent: false });
});

test('planFetch: key berubah -> jalankan, bukan senyap', () => {
	const r = planFetch({ key: 'a', retry: 0, refresh: 0 }, { key: 'b', retry: 0, refresh: 0 });
	assert.deepEqual(r, { run: true, silent: false });
});

test('planFetch: retry berubah -> jalankan, bukan senyap', () => {
	const r = planFetch({ key: 'a', retry: 0, refresh: 0 }, { key: 'a', retry: 1, refresh: 0 });
	assert.deepEqual(r, { run: true, silent: false });
});

test('planFetch: hanya refresh berubah -> jalankan senyap', () => {
	const r = planFetch({ key: 'a', retry: 0, refresh: 0 }, { key: 'a', retry: 0, refresh: 1 });
	assert.deepEqual(r, { run: true, silent: true });
});

test('planFetch: refresh dan key berubah bersamaan -> bukan senyap', () => {
	const r = planFetch({ key: 'a', retry: 0, refresh: 0 }, { key: 'b', retry: 0, refresh: 1 });
	assert.deepEqual(r, { run: true, silent: false });
});

test('planFetch: retry dan refresh berubah bersamaan -> bukan senyap', () => {
	const r = planFetch({ key: 'a', retry: 0, refresh: 0 }, { key: 'a', retry: 1, refresh: 1 });
	assert.deepEqual(r, { run: true, silent: false });
});

test('autoRefreshMs: detik valid, tidak valid, dan bawaan', () => {
	assert.equal(autoRefreshMs('30'), 30000);
	assert.equal(autoRefreshMs('120'), 120000);
	assert.equal(autoRefreshMs(''), 30000);
	assert.equal(autoRefreshMs('abc'), 30000);
	assert.equal(autoRefreshMs('0'), 30000);
	assert.equal(autoRefreshMs('-5'), 30000);
});

test('canAutoRefresh: hanya aktif saat menyala, tab terlihat, dan tidak sedang memuat', () => {
	assert.equal(canAutoRefresh(true, false, false), true);
	assert.equal(canAutoRefresh(false, false, false), false);
	assert.equal(canAutoRefresh(true, true, false), false);
	assert.equal(canAutoRefresh(true, false, true), false);
});

test('pilihan penyegaran otomatis: 30/60/120 dengan bawaan 30', () => {
	assert.deepEqual(
		AUTO_REFRESH_OPTIONS.map((o) => o.value),
		['30', '60', '120']
	);
	assert.ok(AUTO_REFRESH_OPTIONS.some((o) => o.value === DEFAULT_AUTO_REFRESH));
	assert.equal(DEFAULT_AUTO_REFRESH, '30');
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
