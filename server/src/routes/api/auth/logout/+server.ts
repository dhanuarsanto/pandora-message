import { clearToken } from '$lib/server/auth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
	clearToken(event);
	return json({ status: 'sukses' });
};
