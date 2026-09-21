import { APP_UNIT } from '$lib/config';
import { ApiError, apiGet } from '$lib/server/api';
import { clearAllCookies, getToken } from '$lib/server/auth';
import { getResellers } from '$lib/server/resellerCache';
import type { OutboxResponse } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = getToken(cookies);
	if (!token) throw redirect(302, '/login');

	const qs = url.searchParams.toString();
	try {
		const outbox = await apiGet<OutboxResponse>(
			`/api/v1/${APP_UNIT}/outbox${qs ? '?' + qs : ''}`,
			token
		);
		return { outbox, resellers: getResellers(token) };
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) {
			clearAllCookies(cookies);
			throw redirect(302, '/login');
		}
		throw err;
	}
};
