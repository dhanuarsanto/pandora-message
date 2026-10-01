import { redirect } from '@sveltejs/kit';
import { session } from '$lib/client/session.svelte';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
	session.init();
	if (!session.token) throw redirect(302, '/login');
	return {};
};
