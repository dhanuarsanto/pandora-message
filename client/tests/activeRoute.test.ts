import assert from 'node:assert/strict';
import test from 'node:test';
import { isRouteActive } from '../src/lib/activeRoute.ts';

test('isRouteActive: route id persis -> true', () => {
	assert.equal(isRouteActive('/inbox', '/inbox'), true);
	assert.equal(isRouteActive('/outbox', '/outbox'), true);
});

test('isRouteActive: route id lain -> false', () => {
	assert.equal(isRouteActive('/inbox', '/outbox'), false);
	assert.equal(isRouteActive('/outbox', '/inbox'), false);
});

test('isRouteActive: turunan route -> true', () => {
	assert.equal(isRouteActive('/inbox/123', '/inbox'), true);
});

test('isRouteActive: prefiks yang bukan segmen -> false', () => {
	assert.equal(isRouteActive('/inbox-arsip', '/inbox'), false);
});

test('isRouteActive: null -> false', () => {
	assert.equal(isRouteActive(null, '/inbox'), false);
});

test('isRouteActive: pathname browser tidak cocok, route id cocok', () => {
	const pathname = '/pandora-message/inbox';
	assert.equal(pathname.startsWith('/inbox'), false);
	assert.equal(isRouteActive('/inbox', '/inbox'), true);
});
