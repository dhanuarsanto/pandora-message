import type { Cookies, RequestEvent } from '@sveltejs/kit';

export const COOKIE_TOKEN = 'token';
export const COOKIE_USERNAME = 'username';
export const COOKIE_RULES = 'rules';
export const SESSION_TTL_SEC = 86400;

export function secureCookie(): boolean {
	return import.meta.env.PROD && process.env.COOKIE_SECURE !== 'false';
}

export function setToken(event: RequestEvent, token: string): void {
	event.cookies.set(COOKIE_TOKEN, token, {
		path: '/',
		maxAge: SESSION_TTL_SEC,
		httpOnly: true,
		secure: secureCookie(),
		sameSite: 'strict'
	});
}

export function getToken(cookies: RequestEvent['cookies']): string | null {
	return cookies.get(COOKIE_TOKEN) ?? null;
}

export function clearAllCookies(cookies: Cookies): void {
	const opts = {
		path: '/',
		maxAge: 0,
		httpOnly: true,
		secure: secureCookie(),
		sameSite: 'strict' as const
	};
	cookies.set(COOKIE_TOKEN, '', opts);
	cookies.set(COOKIE_USERNAME, '', opts);
	cookies.set(COOKIE_RULES, '', opts);
}
