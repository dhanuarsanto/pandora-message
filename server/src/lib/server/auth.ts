import type { Cookies, RequestEvent } from '@sveltejs/kit';

export const COOKIE_TOKEN = 'token';
export const COOKIE_USERNAME = 'username';
export const COOKIE_RULES = 'rules';
export const SESSION_TTL_SEC = 86400;

export type LoginRequest = {
	username: string;
	password: string;
};

export type LoginData = {
	rules: string;
	token: string;
	username: string;
};

export type LoginResponse = {
	status: string;
	data: LoginData;
};

export function secureCookie(): boolean {
	return Boolean(import.meta.env?.PROD) && process.env.COOKIE_SECURE !== 'false';
}

export function setSessionCookies(
	event: RequestEvent,
	session: { token: string; username: string; rules: string }
): void {
	const opts = {
		path: '/',
		maxAge: SESSION_TTL_SEC,
		httpOnly: true,
		secure: secureCookie(),
		sameSite: 'strict' as const
	};
	event.cookies.set(COOKIE_TOKEN, session.token, opts);
	event.cookies.set(COOKIE_USERNAME, session.username, opts);
	event.cookies.set(COOKIE_RULES, session.rules, opts);
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
