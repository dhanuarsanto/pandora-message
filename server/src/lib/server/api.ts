import { env } from '$env/dynamic/private';
import { APP_UNIT } from '$lib/config';
import { ApiError } from './apiError.ts';
import { createHttpClient } from './httpClient.ts';

export { ApiError };

const client = createHttpClient(env.PRIVATE_API_BASE_URL, env.PRIVATE_API_KEY, [
	`/api/v1/${APP_UNIT}/auth/login`
]);

export const apiGet = client.get;
export const apiPost = client.post;
