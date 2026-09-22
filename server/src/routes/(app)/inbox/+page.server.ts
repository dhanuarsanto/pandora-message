import { APP_UNIT } from '$lib/config';
import { apiGet } from '$lib/server/api';
import { as401, settleResellers } from '$lib/server/guard';
import { getToken } from '$lib/server/auth';
import { getResellers } from '$lib/server/resellerCache';
import type { InboxResponse } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies, url }) => {
	const token = getToken(cookies);
	if (!token) throw redirect(302, '/login');

	const qs = url.searchParams.toString();
	return {
		inbox: as401(apiGet<InboxResponse>(`/api/v1/${APP_UNIT}/inbox${qs ? '?' + qs : ''}`, token)),
		resellers: settleResellers(getResellers(token))
	};
};
