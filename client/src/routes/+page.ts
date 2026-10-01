import { redirect } from '@sveltejs/kit';
import { session } from '$lib/client/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	session.init();
	throw redirect(302, session.token ? '/inbox' : '/login');
};
