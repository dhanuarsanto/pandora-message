import { APP_UNIT } from '$lib/config';
import { ApiError } from './apiError.ts';
import { API_BASE_URL, API_KEY } from './config.ts';
import { createHttpClient } from './httpClient.ts';

export { ApiError };

const client = createHttpClient(API_BASE_URL, API_KEY, [`/api/v1/${APP_UNIT}/auth/login`]);

export const apiGet = client.get;
export const apiPost = client.post;
