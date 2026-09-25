import assert from 'node:assert/strict';
import test from 'node:test';
import { createResellerCache } from '../src/lib/server/resellerCache.ts';

function makeGetter() {
	let n = 0;
	let fail = false;
	const getter = async (token: string) => {
		n++;
		if (fail) throw new Error('gagal');
		const d = { token } as never;
		return d;
	};
	return { getter, called: () => n, setFail: (v: boolean) => (fail = v) };
}

test('getResellers: panggilan kedua dari cache (getter sekali)', async () => {
	const g = makeGetter();
	const c = createResellerCache(g.getter);
	const a = await c.getResellers('t1');
	const b = await c.getResellers('t1');
	assert.equal(g.called(), 1);
	assert.equal(a, b);
});

test('getResellers: token berbeda -> fetcher dipanggil lagi', async () => {
	const g = makeGetter();
	const c = createResellerCache(g.getter);
	await c.getResellers('t1');
	await c.getResellers('t2');
	assert.equal(g.called(), 2);
});

test('getResellers: request kembar (inflight) hanya satu fetch', async () => {
	const g = makeGetter();
	const c = createResellerCache(g.getter);
	const [a, b] = await Promise.all([c.getResellers('t1'), c.getResellers('t1')]);
	assert.equal(g.called(), 1);
	assert.equal(a, b);
});

test('getResellers: gagal -> tidak di-cache, fetch berikutnya jalan', async () => {
	const g = makeGetter();
	g.setFail(true);
	const c = createResellerCache(g.getter);
	await assert.rejects(() => c.getResellers('t1'));
	g.setFail(false);
	const data = await c.getResellers('t1');
	assert.ok(data);
	assert.equal(g.called(), 2);
});

test('getResellers: TTL kedaluwarsa -> ambil ulang', async () => {
	const g = makeGetter();
	const c = createResellerCache(g.getter);
	await c.getResellers('t1');
	c.prune(Date.now() + 6 * 60 * 1000);
	await c.getResellers('t1');
	assert.equal(g.called(), 2);
});

test('prune: buang entri basi, sisakan yang baru', async () => {
	const g = makeGetter();
	const c = createResellerCache(g.getter);
	await Promise.all([c.getResellers('a'), c.getResellers('b')]);
	c.prune(Date.now() + 6 * 60 * 1000);
	await c.getResellers('a');
	await c.getResellers('b');
	assert.equal(g.called(), 4);
});
