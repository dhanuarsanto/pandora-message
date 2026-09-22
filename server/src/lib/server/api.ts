import { PRIVATE_API_BASE_URL, PRIVATE_API_KEY } from '$env/static/private';
import { APP_UNIT } from '$lib/config';

const TIMEOUT_MS = 180000;

const PUBLIC_ENDPOINTS = [`/api/v1/${APP_UNIT}/auth/login`];

export class ApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const headers = new Headers(options.headers);
		headers.set('X-API-KEY', PRIVATE_API_KEY);

		if (!headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json');
		}

		const res = await fetch(`${PRIVATE_API_BASE_URL}${path}`, {
			...options,
			headers,
			signal: controller.signal
		});

		if (!res.ok) {
			throw new ApiError(res.status, 'Permintaan gagal');
		}

		return (await res.json()) as T;
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') {
			throw new ApiError(408, 'Permintaan gagal');
		}

		throw err;
	} finally {
		clearTimeout(timeout);
	}
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
	return apiRequest<T>(path, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
	if (!token && !PUBLIC_ENDPOINTS.some((ep) => path.startsWith(ep))) {
		throw new ApiError(401, 'Permintaan gagal');
	}

	return apiRequest<T>(path, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: token ? { Authorization: `Bearer ${token}` } : {}
	});
}
