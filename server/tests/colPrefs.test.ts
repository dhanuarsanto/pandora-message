import assert from 'node:assert/strict';
import test from 'node:test';
import {
	clearColPrefs,
	loadColPrefs,
	reorderKeys,
	saveColPrefs,
	visibleOf
} from '../src/lib/client/colPrefs.ts';

type C = { key: string };
const COLS: C[] = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
const U = 'admin';
const V = 'budi';

function stubWindow(store: Record<string, string>) {
	(globalThis as Record<string, unknown>).window = {
		localStorage: {
			getItem: (k: string) => store[k] ?? null,
			setItem: (k: string, v: string) => (store[k] = v),
			removeItem: (k: string) => delete store[k]
		}
	};
}

function read(username: string, route: string) {
	const w = globalThis as unknown as {
		window: { localStorage: { getItem: (k: string) => string } };
	};
	const store = JSON.parse(w.window.localStorage.getItem('pandora-cols'));
	assert.equal(store.username, username);
	return store[route];
}

test('reorderKeys: pindah sebelum/sesudah', () => {
	assert.deepEqual(reorderKeys(['a', 'b', 'c'], 'a', 'c', 'after'), ['b', 'c', 'a']);
	assert.deepEqual(reorderKeys(['a', 'b', 'c'], 'c', 'a', 'before'), ['c', 'a', 'b']);
});

test('reorderKeys: target tidak ditemukan atau sama', () => {
	assert.deepEqual(reorderKeys(['a', 'b', 'c'], 'x', 'b', 'before'), ['a', 'b', 'c']);
	assert.deepEqual(reorderKeys(['a', 'b', 'c'], 'a', 'a', 'before'), ['a', 'b', 'c']);
});

test('visibleOf menyaring yang tersembunyi', () => {
	assert.deepEqual(visibleOf(COLS, ['b']), [{ key: 'a' }, { key: 'c' }]);
	assert.deepEqual(visibleOf(COLS, []), COLS);
});

test('loadColPrefs tanpa localStorage (server)', () => {
	delete (globalThis as Record<string, unknown>).window;
	assert.deepEqual(loadColPrefs(U, 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('loadColPrefs tanpa username -> default', () => {
	stubWindow({});
	assert.deepEqual(loadColPrefs('', 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('loadColPrefs key kosong -> default', () => {
	stubWindow({});
	assert.deepEqual(loadColPrefs(U, 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('loadColPrefs valid, menambah kolom baru, membuang key asing', () => {
	stubWindow({
		'pandora-cols': JSON.stringify({
			username: U,
			inbox: { order: ['c', 'a'], hidden: ['a'] },
			outbox: { order: ['a', 'b', 'c'], hidden: [] }
		})
	});
	const prefs = loadColPrefs(U, 'inbox', COLS);
	assert.deepEqual(prefs.order, ['c', 'a', 'b']);
	assert.deepEqual(prefs.hidden, ['a']);
});

test('loadColPrefs JSON korup -> default', () => {
	stubWindow({ 'pandora-cols': '{rusak' });
	assert.deepEqual(loadColPrefs(U, 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('loadColPrefs tidak bisa hidden semua kolom', () => {
	stubWindow({
		'pandora-cols': JSON.stringify({
			username: U,
			inbox: { order: ['a', 'b', 'c'], hidden: ['a', 'b', 'c'] },
			outbox: { order: ['a', 'b', 'c'], hidden: [] }
		})
	});
	assert.deepEqual(loadColPrefs(U, 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('username beda -> default dan hapus key lama', () => {
	stubWindow({
		'pandora-cols': JSON.stringify({
			username: V,
			inbox: { order: ['c', 'b'], hidden: ['c'] },
			outbox: { order: ['a', 'b', 'c'], hidden: [] }
		}),
		'pandora-inbox-cols': '{"order":["c"],"hidden":["c"]}',
		'pandora-outbox-cols': '{"order":["b"],"hidden":[]}'
	});
	assert.deepEqual(loadColPrefs(U, 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('key lama tanpa identitas akun diabaikan lalu dihapus', () => {
	const store: Record<string, string> = {
		'pandora-inbox-cols': JSON.stringify({ order: ['c', 'a'], hidden: ['a'] }),
		'pandora-outbox-cols': JSON.stringify({ order: ['b', 'a'], hidden: [] })
	};
	stubWindow(store);
	assert.deepEqual(loadColPrefs(U, 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
	assert.equal('pandora-inbox-cols' in store, false);
	assert.equal('pandora-outbox-cols' in store, false);
});

test('saveColPrefs menulis ke key bersama per route', () => {
	const store: Record<string, string> = {};
	stubWindow(store);
	saveColPrefs(U, 'inbox', { order: ['b'], hidden: [] });
	assert.deepEqual(read(U, 'inbox'), { order: ['b'], hidden: [] });
	saveColPrefs(U, 'outbox', { order: ['c', 'a'], hidden: ['a'] });
	assert.deepEqual(read(U, 'outbox'), { order: ['c', 'a'], hidden: ['a'] });
	assert.equal(JSON.parse(store['pandora-cols']).username, U);
});

test('saveColPrefs username beda menimpa prefs lama', () => {
	const store: Record<string, string> = {};
	stubWindow(store);
	saveColPrefs(U, 'inbox', { order: ['b'], hidden: ['b'] });
	saveColPrefs(V, 'inbox', { order: ['c'], hidden: [] });
	assert.equal(JSON.parse(store['pandora-cols']).username, V);
	assert.deepEqual(loadColPrefs(V, 'inbox', COLS), { order: ['c', 'a', 'b'], hidden: [] });
	assert.deepEqual(loadColPrefs(U, 'inbox', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('clearColPrefs hanya mereset route yang diminta', () => {
	const store: Record<string, string> = {};
	stubWindow(store);
	saveColPrefs(U, 'inbox', { order: ['b', 'a'], hidden: ['a'] });
	saveColPrefs(U, 'outbox', { order: ['c', 'a'], hidden: ['c'] });
	clearColPrefs(U, 'inbox', COLS);
	assert.deepEqual(read(U, 'inbox'), { order: ['a', 'b', 'c'], hidden: [] });
	assert.deepEqual(read(U, 'outbox'), { order: ['c', 'a'], hidden: ['c'] });
});
