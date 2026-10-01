import assert from 'node:assert/strict';
import test from 'node:test';
import { readSession, saveSession, SESSION_TTL_SEC, clearSession } from '../src/lib/api/session.ts';

const STORAGE_KEY = 'pandora-session';

type Store = Record<string, string>;

function stubWindow(store: Store): void {
	(globalThis as Record<string, unknown>).window = {
		localStorage: {
			getItem: (k: string) => store[k] ?? null,
			setItem: (k: string, v: string) => (store[k] = v),
			removeItem: (k: string) => delete store[k]
		}
	};
}

function stubBlockedWindow(): void {
	(globalThis as Record<string, unknown>).window = {
		localStorage: {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			},
			removeItem: () => {
				throw new Error('blocked');
			}
		}
	};
}

function valid(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		token: 'tok123',
		username: 'admin',
		rules: 'sa',
		expiresAt: Date.now() + 60_000,
		...overrides
	};
}

test('kunci penyimpanan mengikuti APP_UNIT', () => {
	const store: Store = { [STORAGE_KEY]: JSON.stringify(valid()) };
	stubWindow(store);
	assert.equal(readSession()?.token, 'tok123');
});

test('session ttl satu hari', () => {
	assert.equal(SESSION_TTL_SEC, 86400);
});

test('readSession: tidak ada -> null', () => {
	stubWindow({});
	assert.equal(readSession(), null);
});

test('readSession: json rusak -> null', () => {
	stubWindow({ [STORAGE_KEY]: 'bukan json' });
	assert.equal(readSession(), null);
});

test('readSession: bentuk tidak lengkap -> null', () => {
	stubWindow({ [STORAGE_KEY]: JSON.stringify({ token: 'a' }) });
	assert.equal(readSession(), null);
});

test('readSession: tipe salah -> null', () => {
	stubWindow({ [STORAGE_KEY]: JSON.stringify(valid({ token: 5 })) });
	assert.equal(readSession(), null);
});

test('readSession: kedaluwarsa -> null dan dihapus', () => {
	const store: Store = { [STORAGE_KEY]: JSON.stringify(valid({ expiresAt: Date.now() - 1 })) };
	stubWindow(store);
	assert.equal(readSession(), null);
	assert.equal(store[STORAGE_KEY], undefined);
});

test('readSession: valid -> mengembalikan session', () => {
	const saved = valid();
	stubWindow({ [STORAGE_KEY]: JSON.stringify(saved) });
	assert.deepEqual(readSession(), {
		token: 'tok123',
		username: 'admin',
		rules: 'sa',
		expiresAt: saved.expiresAt
	});
});

test('saveSession lalu readSession -> konsisten', () => {
	const store: Store = {};
	stubWindow(store);
	saveSession({ token: 'tk', username: 'budi', rules: 'op' });
	const s = readSession();
	assert.equal(s?.token, 'tk');
	assert.equal(s?.username, 'budi');
	assert.equal(s?.rules, 'op');
	assert.ok(s !== null && s.expiresAt > Date.now());
});

test('saveSession: storage diblokir -> tidak melempar', () => {
	stubBlockedWindow();
	assert.doesNotThrow(() => saveSession({ token: 'tk', username: 'budi', rules: 'op' }));
});

test('readSession: storage diblokir -> null', () => {
	stubBlockedWindow();
	assert.equal(readSession(), null);
});

test('clearSession -> storage kosong', () => {
	const store: Store = {};
	stubWindow(store);
	saveSession({ token: 'tk', username: 'budi', rules: 'op' });
	clearSession();
	assert.equal(store[STORAGE_KEY], undefined);
});

test('clearSession: storage diblokir -> tidak melempar', () => {
	stubBlockedWindow();
	assert.doesNotThrow(() => clearSession());
});
