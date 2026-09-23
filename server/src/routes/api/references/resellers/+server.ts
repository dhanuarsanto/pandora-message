import { json, type RequestHandler } from '@sveltejs/kit';
import { getToken } from '$lib/server/auth';
import { getResellers } from '$lib/server/resellerCache';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = getToken(cookies);
	if (!token) {
		return json(
			{ status: 'gagal', message: 'Sesi berakhir. Silakan masuk lagi.' },
			{ status: 401 }
		);
	}

	try {
		const res = await getResellers(token);
		return json({ status: 'sukses', data: res });
	} catch (err) {
		const detail = err instanceof Error ? err.message : '';
		const body: { status: 'gagal'; message: string; detail?: string } = {
			status: 'gagal',
			message: 'Gagal memuat daftar reseller. Coba lagi.'
		};
		if (detail) body.detail = detail;
		return json(body, { status: 502 });
	}
};
