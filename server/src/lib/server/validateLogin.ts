import type { LoginRequest } from '$lib/types';

export function validateLogin(body: LoginRequest): string | null {
	if (!body.username || typeof body.username !== 'string') return 'username wajib diisi';
	if (body.username.length < 3) return 'username minimal 3 karakter';
	if (body.username.length > 20) return 'username maksimal 20 karakter';
	if (!/^[a-zA-Z0-9._@-]+$/.test(body.username))
		return 'Username hanya huruf, angka, titik, atau @';
	if (!body.password || typeof body.password !== 'string') return 'Password wajib diisi';
	if (body.password.length < 6) return 'Password minimal 6 karakter';
	if (body.password.length > 20) return 'Password maksimal 20 karakter';
	return null;
}
