import assert from 'node:assert/strict';
import test from 'node:test';
import type { LoginRequest } from '../src/lib/server/auth.ts';
import { validateLogin } from '../src/lib/server/validateLogin.ts';

const valid: LoginRequest = { username: 'admin.user@1', password: 'secret1' };

test('input valid -> null', () => {
	assert.equal(validateLogin(valid), null);
});

test('username wajib dan bertipe string', () => {
	assert.equal(validateLogin({ ...valid, username: '' }), 'username wajib diisi');
	assert.equal(
		validateLogin({ ...valid, username: 123 as unknown as string }),
		'username wajib diisi'
	);
});

test('username panjang 3..20', () => {
	assert.equal(validateLogin({ ...valid, username: 'ab' }), 'username minimal 3 karakter');
	assert.equal(
		validateLogin({ ...valid, username: 'a'.repeat(21) }),
		'username maksimal 20 karakter'
	);
});

test('username hanya [a-zA-Z0-9._@-]', () => {
	assert.equal(
		validateLogin({ ...valid, username: 'user name!' }),
		'Username hanya huruf, angka, titik, atau @'
	);
});

test('password wajib dan panjang 6..20', () => {
	assert.equal(validateLogin({ ...valid, password: '' }), 'Password wajib diisi');
	assert.equal(validateLogin({ ...valid, password: 'abc' }), 'Password minimal 6 karakter');
	assert.equal(
		validateLogin({ ...valid, password: 'p'.repeat(21) }),
		'Password maksimal 20 karakter'
	);
	assert.equal(
		validateLogin({ ...valid, password: 123456 as unknown as string }),
		'Password wajib diisi'
	);
});
