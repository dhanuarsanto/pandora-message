import { json, type RequestHandler } from '@sveltejs/kit';
import { APP_UNIT } from '$lib/config';
import { apiGet } from '$lib/server/api';
import { getToken } from '$lib/server/auth';
import { describeError } from '$lib/server/messageError';
import type { InboxResponse, OutboxResponse } from '$lib/message/types';

const MODES = new Set(['inbox', 'outbox']);

export const GET: RequestHandler = async ({ params, url, cookies }) => {
	const mode = params.mode ?? '';

	if (!MODES.has(mode)) {
		return json({ status: 'gagal', message: 'Jenis data tidak dikenal.' }, { status: 404 });
	}

	const token = getToken(cookies);
	if (!token) {
		return json(
			{ status: 'gagal', message: 'Sesi berakhir. Silakan masuk lagi.' },
			{ status: 401 }
		);
	}

	const qs = url.searchParams.toString();

	try {
		const res = await apiGet<InboxResponse | OutboxResponse>(
			`/api/v1/${APP_UNIT}/${mode}${qs ? '?' + qs : ''}`,
			token
		);
		return json({ status: 'sukses', data: res.data });
	} catch (err) {
		const { message, status, detail } = describeError(err);
		const body: { status: 'gagal'; message: string; detail?: string } = {
			status: 'gagal',
			message
		};
		if (detail) body.detail = detail;
		return json(body, { status });
	}
};
