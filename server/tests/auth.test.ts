import assert from 'node:assert/strict';
import test from 'node:test';
import {
	clearAllCookies,
	COOKIE_RULES,
	COOKIE_TOKEN,
	COOKIE_USERNAME,
	getToken,
	secureCookie,
	SESSION_TTL_SEC,
	setSessionCookies
} from '../src/lib/server/auth.ts';

type Ctx = {
	store: Record<string, string>;
	opts: Record<string, Record<string, unknown>>;
	cookies: {
		get: (name: string) => string | undefined;
		set: (name: string, value: string, opts: Record<string, unknown>) => void;
	};
};

function makeCookies(): Ctx {
	const ctx: Ctx = {
		store: {},
		opts: {},
		cookies: {
			get: (name) => ctx.store[name],
			set: (name, value, opts) => {
				ctx.store[name] = value;
				ctx.opts[name] = opts;
			}
		}
	};
	return ctx;
}

test('getToken: kosong -> null, ada -> nilai', () => {
	const c = makeCookies();
	const cookies = c.cookies as unknown as Parameters<typeof getToken>[0];
	assert.equal(getToken(cookies), null);
	c.store[COOKIE_TOKEN] = 'abc';
	assert.equal(getToken(cookies), 'abc');
});

test('setSessionCookies: set token, username, rules', () => {
	const c = makeCookies();
	const event = { cookies: c.cookies } as unknown as Parameters<typeof setSessionCookies>[0];
	setSessionCookies(event, { token: 'T', username: 'U', rules: 'sa' });
	assert.deepEqual(c.store, { [COOKIE_TOKEN]: 'T', [COOKIE_USERNAME]: 'U', [COOKIE_RULES]: 'sa' });
	for (const name of [COOKIE_TOKEN, COOKIE_USERNAME, COOKIE_RULES]) {
		assert.equal(c.opts[name].maxAge, SESSION_TTL_SEC);
		assert.equal(c.opts[name].httpOnly, true);
		assert.equal(c.opts[name].sameSite, 'strict');
		assert.equal(c.opts[name].secure, false);
	}
});

test('clearAllCookies: kosongkan semua dengan maxAge 0', () => {
	const c = makeCookies();
	const cookies = c.cookies as unknown as Parameters<typeof clearAllCookies>[0];
	c.store = { [COOKIE_TOKEN]: 'T', [COOKIE_USERNAME]: 'U', [COOKIE_RULES]: 'sa' };
	clearAllCookies(cookies);
	for (const name of [COOKIE_TOKEN, COOKIE_USERNAME, COOKIE_RULES]) {
		assert.equal(c.store[name], '');
		assert.equal(c.opts[name].maxAge, 0);
	}
});

test('secureCookie: false saat bukan production', () => {
	assert.equal(secureCookie(), false);
});
