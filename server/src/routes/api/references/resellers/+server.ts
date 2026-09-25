import { json, type RequestHandler } from '@sveltejs/kit';
import { getToken } from '$lib/server/auth';
import { describeError } from '$lib/server/messageError';
import { getResellers } from '$lib/server/resellerClient';

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
		const { message, status, detail } = describeError(err);
		return json({ status: 'gagal', message, ...(detail ? { detail } : {}) }, { status });
	}
};
