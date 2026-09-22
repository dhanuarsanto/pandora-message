import assert from 'node:assert/strict';
import test from 'node:test';
import {
	getClientIp,
	isRateLimited,
	recordAttempt,
	resetAttempts
} from '../src/lib/server/rateLimiter.ts';

test('getClientIp dari event', () => {
	assert.equal(getClientIp({ getClientAddress: () => '10.0.0.1' }), '10.0.0.1');
	assert.equal(getClientIp({ getClientAddress: () => '' }), 'unknown');
});

test('limit 5 percobaan per IP dalam 1 menit', () => {
	const ip = '203.0.113.7';
	resetAttempts(ip);
	assert.equal(isRateLimited(ip), false);
	for (let i = 0; i < 4; i++) {
		recordAttempt(ip);
		assert.equal(isRateLimited(ip), false);
	}
	recordAttempt(ip);
	assert.equal(isRateLimited(ip), true);
	resetAttempts(ip);
	assert.equal(isRateLimited(ip), false);
});

test('IP lain tidak terdampak', () => {
	const ip = '203.0.113.8';
	resetAttempts(ip);
	for (let i = 0; i < 5; i++) recordAttempt(ip);
	assert.equal(isRateLimited(ip), true);
	assert.equal(isRateLimited('203.0.113.9'), false);
	resetAttempts(ip);
});
