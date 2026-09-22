import assert from 'node:assert/strict';
import test from 'node:test';
import {
	clearColPrefs,
	loadColPrefs,
	reorderKeys,
	saveColPrefs,
	visibleOf
} from '../src/lib/colPrefs.ts';

type C = { key: string };
const COLS: C[] = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];

function stubWindow(store: Record<string, string>) {
	(globalThis as Record<string, unknown>).window = {
		localStorage: {
			getItem: (k: string) => store[k] ?? null,
			setItem: (k: string, v: string) => (store[k] = v),
			removeItem: (k: string) => delete store[k]
		}
	};
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
	assert.deepEqual(loadColPrefs('k', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('loadColPrefs valid, menambah kolom baru, membuang key asing', () => {
	stubWindow({ k: JSON.stringify({ order: ['c', 'a'], hidden: ['a'] }) });
	const prefs = loadColPrefs('k', COLS);
	assert.deepEqual(prefs.order, ['c', 'a', 'b']);
	assert.deepEqual(prefs.hidden, ['a']);
});

test('loadColPrefs JSON korup -> default', () => {
	stubWindow({ k: '{rusak' });
	assert.deepEqual(loadColPrefs('k', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('loadColPrefs tidak bisa hidden semua kolom', () => {
	stubWindow({ k: JSON.stringify({ order: ['a', 'b', 'c'], hidden: ['a', 'b', 'c'] }) });
	assert.deepEqual(loadColPrefs('k', COLS), { order: ['a', 'b', 'c'], hidden: [] });
});

test('saveColPrefs & clearColPrefs menulis ulang localStorage', () => {
	const store: Record<string, string> = {};
	stubWindow(store);
	saveColPrefs('x', { order: ['b'], hidden: [] });
	assert.equal(store['x'], JSON.stringify({ order: ['b'], hidden: [] }));
	clearColPrefs('x');
	assert.equal('x' in store, false);
	saveColPrefs('x', { order: ['b'], hidden: [] });
});
