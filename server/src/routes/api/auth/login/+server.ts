import { ApiError, apiPost } from '$lib/server/api';
import { setToken } from '$lib/server/auth';
import { getClientIp, isRateLimited, recordAttempt, resetAttempts } from '$lib/server/rateLimiter';
import { json, type RequestHandler } from '@sveltejs/kit';

type LoginRequest = {
	username: string;
	password: string;
};

type LoginData = {
	rules: string;
	token: string;
	username: string;
};

type LoginResponse = {
	status: string;
	data: LoginData;
};

export const POST: RequestHandler = async (event) => {
	const ip = getClientIp(event);

	if (isRateLimited(ip)) {
		recordAttempt(ip);

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

		const data = await apiPost<LoginResponse>('/api/v1/pandora/auth/login', body);

		if (data.status !== 'sukses' || !data.data?.token) {
			recordAttempt(ip);
			return json({ status: 'gagal', message: 'Username atau password salah' }, { status: 401 });
		}

		resetAttempts(ip);
		setToken(event, data.data.token);
		event.cookies.set('username', data.data.username, {
			path: '/',
			maxAge: 3600,
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: 'strict'
		});

		return json({
			status: 'sukses',
			data: { username: data.data.username, rules: data.data.rules }
		});
	} catch (err: unknown) {
		recordAttempt(ip);
		if (err instanceof ApiError && err.status === 401) {
			return json({ status: 'gagal', message: 'Username atau password salah' }, { status: 401 });
		}
		return json({ status: 'gagal', message: 'Terjadi kesalahan, coba lagi' }, { status: 500 });
	}
};

function validateInput(body: LoginRequest): string | null {
	if (!body.username || typeof body.username !== 'string') return 'username wajib diisi';
	if (!body.password || typeof body.password !== 'string') return 'Password wajib diisi';
	return null;
}
