import { COOKIE_RULES, COOKIE_TOKEN, COOKIE_USERNAME } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

const PUBLIC_PATHS = ['/login', '/test-error', '/api/auth/login', '/api/auth/logout'];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function securityHeaders(response: Response): void {
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	if (import.meta.env.PROD) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const username = event.cookies.get(COOKIE_USERNAME) ?? null;
	const rules = event.cookies.get(COOKIE_RULES) ?? null;

	event.locals.username = username;
	event.locals.rules = rules;

	if (!event.cookies.get(COOKIE_TOKEN) && !isPublicPath(pathname)) {
		throw redirect(302, '/login');
	}

	if (event.cookies.get(COOKIE_TOKEN) && (pathname === '/login' || pathname === '/')) {
		throw redirect(302, '/inbox');
	}

	const response = await resolve(event);
	securityHeaders(response);
	return response;
};
