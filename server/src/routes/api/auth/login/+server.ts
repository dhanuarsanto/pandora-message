import { APP_UNIT } from '$lib/config';
import { ApiError, apiPost } from '$lib/server/api';
import { setSessionCookies } from '$lib/server/auth';
import { getClientIp, isRateLimited, recordAttempt, resetAttempts } from '$lib/server/rateLimiter';
import { validateLogin } from '$lib/server/validateLogin';
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

	let body: LoginRequest;
	try {
		body = await event.request.json();
	} catch {
		return json({ status: 'gagal', message: 'Format permintaan tidak valid' }, { status: 400 });
	}

	try {
		const validationError = validateLogin(body);
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
		setSessionCookies(event, {
			token: data.data.token,
			username: data.data.username,
			rules: data.data.rules
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
