import { ApiError } from './api';
import { clearAllCookies } from './auth';
import { redirect, type Cookies } from '@sveltejs/kit';

export async function authed<T>(promise: Promise<T>, cookies: Cookies): Promise<T> {
	try {
		return await promise;
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) {
			clearAllCookies(cookies);
			throw redirect(302, '/login');
		}
		throw err;
	}
}

export async function soft<T>(promise: Promise<T>): Promise<T | null> {
	try {
		return await promise;
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) throw err;
		return null;
	}
}
