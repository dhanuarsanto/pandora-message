import { APP_UNIT } from '$lib/config';
import { apiGet } from '$lib/server/api';
import { as401, settleResellers } from '$lib/server/guard';
import { getToken } from '$lib/server/auth';
import { getResellers } from '$lib/server/resellerCache';
import type { OutboxResponse } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies, url }) => {
	const token = getToken(cookies);
	if (!token) throw redirect(302, '/login');

	const qs = url.searchParams.toString();
	return {
		outbox: as401(apiGet<OutboxResponse>(`/api/v1/${APP_UNIT}/outbox${qs ? '?' + qs : ''}`, token)),
		resellers: settleResellers(getResellers(token))
	};
};
