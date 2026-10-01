import { ApiError } from './apiError.ts';

export type MessageFailure = { message: string; status: number; detail?: string };

export function describeError(err: unknown): MessageFailure {
	if (err instanceof ApiError) {
		switch (err.status) {
			case 401:
				return { message: 'Sesi berakhir. Silakan masuk lagi.', status: 401 };
			case 408:
			case 504:
				return {
					message: 'Server memerlukan waktu lebih lama dari biasanya. Coba lagi.',
					status: 504,
					detail: 'timeout'
				};
			default:
				if (err.status >= 500) {
					return {
						message: 'Server sedang sibuk. Coba lagi.',
						status: 500,
						detail: `http ${err.status}`
					};
				}
				return {
					message: 'Permintaan ditolak server.',
					status: 400,
					detail: `http ${err.status}`
				};
		}
	}

	const detail = err instanceof Error ? err.message : '';
	return {
		message: 'Gagal terhubung ke server. Coba lagi.',
		status: 502,
		detail: detail || undefined
	};
}
