import { clearAllCookies } from '$lib/server/auth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	clearAllCookies(event.cookies);
	return json({ status: 'sukses' });
};
