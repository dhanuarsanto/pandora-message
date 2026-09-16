import type { Cookies, RequestEvent } from '@sveltejs/kit';

export const COOKIE_TOKEN = 'token';
export const COOKIE_USERNAME = 'username';
export const COOKIE_RULES = 'rules';
export const SESSION_TTL_SEC = 86400;

export function setToken(event: RequestEvent, token: string): void {
	event.cookies.set(COOKIE_TOKEN, token, {
		path: '/',
		maxAge: SESSION_TTL_SEC,
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'strict'
	});
}

export function clearToken(event: RequestEvent): void {
	event.cookies.set(COOKIE_TOKEN, '', {
		path: '/',
		maxAge: 0,
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'strict'
	});
}

export function getToken(cookies: RequestEvent['cookies']): string | null {
	return cookies.get(COOKIE_TOKEN) ?? null;
}

export function clearAllCookies(cookies: Cookies): void {
	cookies.set(COOKIE_TOKEN, '', { path: '/', maxAge: 0 });
	cookies.set(COOKIE_USERNAME, '', { path: '/', maxAge: 0 });
	cookies.set(COOKIE_RULES, '', { path: '/', maxAge: 0 });
}
