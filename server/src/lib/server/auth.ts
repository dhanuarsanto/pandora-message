import type { RequestEvent } from '@sveltejs/kit';

export function setToken(event: RequestEvent, token: string): void {
	event.cookies.set('token', token, {
		path: '/',
		maxAge: 3600,
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'strict'
	});
}

export function clearToken(event: RequestEvent): void {
	event.cookies.set('token', '', {
		path: '/',
		maxAge: 0,
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'strict'
	});
}

export function getToken(cookies: RequestEvent['cookies']): string | null {
	return cookies.get('token') ?? null;
}
