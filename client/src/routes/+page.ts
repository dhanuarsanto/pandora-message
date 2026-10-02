import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { session } from '$lib/client/session.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	session.init();
	throw redirect(302, resolve(session.token ? '/inbox' : '/login'));
};
