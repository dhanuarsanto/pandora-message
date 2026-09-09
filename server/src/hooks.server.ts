import { redirect, type Handle } from '@sveltejs/kit';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function securityHeaders(response: Response): void {
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	if (import.meta.env.PROD) {
		response.headers.set(
			'Content-Security-Policy',
			`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';`
		);
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const username = event.cookies.get('username') ?? null;

	event.locals.username = username;
	event.locals.rules = null;

	if (!event.cookies.get('token') && !isPublicPath(pathname)) {
		throw redirect(302, '/login');
	}

	if (event.cookies.get('token') && (pathname === '/login' || pathname === '/')) {
		throw redirect(302, '/inbox');
	}

	const response = await resolve(event);
	securityHeaders(response);
	return response;
};
