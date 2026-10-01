import { redirect } from '@sveltejs/kit';
import { session } from '$lib/client/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	session.init();
	if (session.token) throw redirect(302, '/inbox');
	return {};
};
