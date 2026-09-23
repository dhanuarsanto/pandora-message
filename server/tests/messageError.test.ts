import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError } from '../src/lib/server/apiError.ts';
import { describeError } from '../src/lib/server/messageError.ts';

test('401: sesi berakhir', () => {
	const r = describeError(new ApiError(401, 'x'));
	assert.equal(r.status, 401);
	assert.equal(r.message, 'Sesi berakhir. Silakan masuk lagi.');
	assert.equal(r.detail, undefined);
});

test('408/504: timeout menunggu', () => {
	for (const s of [408, 504]) {
		const r = describeError(new ApiError(s, 'x'));
		assert.equal(r.status, 504);
		assert.equal(r.message, 'Server memerlukan waktu lebih lama dari biasanya. Coba lagi.');
		assert.equal(r.detail, 'timeout');
	}
});

test('>= 500: server sibuk', () => {
	for (const s of [500, 503]) {
		const r = describeError(new ApiError(s, 'x'));
		assert.equal(r.status, 500);
		assert.equal(r.message, 'Server sedang sibuk. Coba lagi.');
		assert.equal(r.detail, `http ${s}`);
	}
});

test('4xx lain: permintaan ditolak', () => {
	const r = describeError(new ApiError(422, 'x'));
	assert.equal(r.status, 400);
	assert.equal(r.message, 'Permintaan ditolak server.');
	assert.equal(r.detail, 'http 422');
});

test('bukan ApiError: gagal terhubung', () => {
	const r = describeError(new TypeError('fetch failed'));
	assert.equal(r.status, 502);
	assert.equal(r.message, 'Gagal terhubung ke server. Coba lagi.');
	assert.equal(r.detail, 'fetch failed');
});

test('gagal non-error: detail kosong', () => {
	const r = describeError('string aneh');
	assert.equal(r.status, 502);
	assert.equal(r.detail, undefined);
});
