import { APP_UNIT } from '$lib/config';
import { ApiError, apiPost } from '$lib/server/api';
import {
	COOKIE_RULES,
	COOKIE_USERNAME,
	SESSION_TTL_SEC,
	secureCookie,
	setToken
} from '$lib/server/auth';
import { getClientIp, isRateLimited, recordAttempt, resetAttempts } from '$lib/server/rateLimiter';
import type { LoginRequest, LoginResponse } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	const ip = getClientIp(event);

	if (isRateLimited(ip)) {
		return json(
			{ status: 'gagal', message: 'Terlalu banyak percobaan, coba lagi dalam 1 menit' },
			{ status: 429 }
		);
	}

	try {
		const body: LoginRequest = await event.request.json();

		const validationError = validateInput(body);
		if (validationError) {
			recordAttempt(ip);
			return json({ status: 'gagal', message: validationError }, { status: 400 });
		}

		const data = await apiPost<LoginResponse>(`/api/v1/${APP_UNIT}/auth/login`, body);

		if (data.status !== 'sukses' || !data.data?.token) {
			recordAttempt(ip);
			return json({ status: 'gagal', message: 'Username atau password salah' }, { status: 401 });
		}

		resetAttempts(ip);
		setToken(event, data.data.token);
		event.cookies.set(COOKIE_USERNAME, data.data.username, {
			path: '/',
			maxAge: SESSION_TTL_SEC,
			httpOnly: true,
			secure: secureCookie(),
			sameSite: 'strict'
		});

		event.cookies.set(COOKIE_RULES, data.data.rules, {
			path: '/',
			maxAge: SESSION_TTL_SEC,
			httpOnly: true,
			secure: secureCookie(),
			sameSite: 'strict'
		});

		return json({
			status: 'sukses',
			data: { username: data.data.username, rules: data.data.rules }
		});
	} catch (err: unknown) {
		if (err instanceof ApiError && err.status === 401) {
			recordAttempt(ip);
			return json({ status: 'gagal', message: 'Username atau password salah' }, { status: 401 });
		}
		return json({ status: 'gagal', message: 'Terjadi kesalahan, coba lagi' }, { status: 500 });
	}
};

function validateInput(body: LoginRequest): string | null {
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
