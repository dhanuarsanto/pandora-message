import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../src/lib/server/apiError.ts';
import { createHttpClient } from '../src/lib/server/httpClient.ts';

const BASE = 'https://api.test';
const KEY = 'kunci';
const client = createHttpClient(BASE, KEY, ['/public/login']);

let calls: { url: string; init?: RequestInit }[] = [];
let responder: () => Response = () => new Response('{}', { status: 200 });

(globalThis as Record<string, unknown>).fetch = async (
	url: RequestInfo | URL,
	init?: RequestInit
) => {
	calls.push({ url: String(url), init });
	return responder();
};

function jsonRes(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), { status });
}

function headersOf(init?: RequestInit): Record<string, string> {
	return Object.fromEntries(new Headers(init?.headers).entries());
}

test('get: sukses, header key + bearer + content-type json', async () => {
	calls = [];
	responder = () => jsonRes({ a: 1 });
	const data = await client.get<{ a: number }>('/data', 'tok123');
	assert.deepEqual(data, { a: 1 });
	assert.equal(calls.length, 1);
	assert.equal(calls[0].url, BASE + '/data');
	const h = headersOf(calls[0].init);
	assert.equal(h['x-api-key'], KEY);
	assert.equal(h['authorization'], 'Bearer tok123');
	assert.equal(h['content-type'], 'application/json');
	assert.equal(calls[0].init?.method, 'GET');
});

test('get: status 401 -> ApiError 401', async () => {
	responder = () => jsonRes({}, 401);
	await assert.rejects(
		() => client.get('/data', 't'),
		(e: unknown) => e instanceof ApiError && e.status === 401
	);
});

test('get: status 500 -> ApiError 500', async () => {
	responder = () => jsonRes({}, 500);
	await assert.rejects(
		() => client.get('/data', 't'),
		(e: unknown) => e instanceof ApiError && e.status === 500
	);
});

test('request: AbortError -> ApiError 408', async () => {
	responder = () => {
		const e = new Error('aborted');
		e.name = 'AbortError';
		throw e;
	};
	await assert.rejects(
		() => client.get('/data', 't'),
		(e: unknown) => e instanceof ApiError && e.status === 408
	);
});

test('request: error jaringan lain diteruskan', async () => {
	responder = () => {
		throw new TypeError('fetch failed');
	};
	await assert.rejects(() => client.get('/data', 't'), TypeError);
});

test('post: tanpa token non-publik -> ApiError 401 tanpa fetch', () => {
	calls = [];
	assert.throws(
		() => client.post('/data', { x: 1 }),
		(e: unknown) => e instanceof ApiError && e.status === 401
	);
	assert.equal(calls.length, 0);
});

test('post: path publik tanpa token -> fetch jalan', async () => {
	calls = [];
	responder = () => jsonRes({ ok: true });
	await client.post('/public/login', { u: 'a' });
	assert.equal(calls.length, 1);
});

test('post: dengan token -> body + header', async () => {
	calls = [];
	responder = () => jsonRes({ ok: true });
	await client.post('/login', { u: 'a', p: 'b' }, 'tokX');
	const h = headersOf(calls[0].init);
	assert.equal(h['authorization'], 'Bearer tokX');
	assert.equal(h['content-type'], 'application/json');
	assert.equal((calls[0].init?.body as string).includes('"u":"a"'), true);
});
