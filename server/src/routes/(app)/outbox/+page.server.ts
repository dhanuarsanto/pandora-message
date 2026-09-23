import { getToken } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = getToken(cookies);
	if (!token) throw redirect(302, '/login');

	return {};
};
