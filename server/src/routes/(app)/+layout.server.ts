import { APP_UNIT } from '$lib/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, locals }) => {
	const t = cookies.get(`${APP_UNIT}-theme`);
	return {
		theme: t === 'dark' || t === 'light' ? (t as 'dark' | 'light') : null,
		username: locals.username,
		rules: locals.rules
	};
};
