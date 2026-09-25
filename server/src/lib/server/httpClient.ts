import { ApiError } from './apiError.ts';

const TIMEOUT_MS = 180000;

export function createHttpClient(baseUrl: string, apiKey: string, publicPaths: readonly string[]) {
	async function request<T>(path: string, options: RequestInit): Promise<T> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

		try {
			const headers = new Headers(options.headers);
			headers.set('X-API-KEY', apiKey);

			if (!headers.has('Content-Type')) {
				headers.set('Content-Type', 'application/json');
			}

			const res = await fetch(`${baseUrl}${path}`, {
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

	return {
		get: <T>(path: string, token: string) =>
			request<T>(path, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` }
			}),
		post: <T>(path: string, body: unknown, token?: string) => {
			if (!token && !publicPaths.some((ep) => path.startsWith(ep))) {
				throw new ApiError(401, 'Permintaan gagal');
			}

			return request<T>(path, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: token ? { Authorization: `Bearer ${token}` } : {}
			});
		}
	};
}
