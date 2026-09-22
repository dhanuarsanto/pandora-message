import { APP_UNIT } from '$lib/config';
import { apiGet } from '$lib/server/api';
import { getToken } from '$lib/server/auth';
import { authed, soft } from '$lib/server/guard';
import { getResellers } from '$lib/server/resellerCache';
import type { OutboxResponse } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = getToken(cookies);
	if (!token) throw redirect(302, '/login');

	const qs = url.searchParams.toString();
	const outbox = await authed(
		apiGet<OutboxResponse>(`/api/v1/${APP_UNIT}/outbox${qs ? '?' + qs : ''}`, token),
		cookies
	);
	const resellers = await authed(soft(getResellers(token)), cookies);

	return { outbox, resellers };
};
