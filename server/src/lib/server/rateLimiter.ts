const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

function isPrivate(ip: string): boolean {
	return (
		ip === '127.0.0.1' ||
		ip === '::1' ||
		ip === '::ffff:127.0.0.1' ||
		ip.startsWith('10.') ||
		ip.startsWith('192.168.') ||
		/^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
		ip.startsWith('fc') ||
		ip.startsWith('fd')
	);
}

export function getClientIp(event: { getClientAddress(): string; request: Request }): string {
	const direct = event.getClientAddress() || 'unknown';
	if (isPrivate(direct)) {
		const xff = event.request.headers.get('x-forwarded-for');
		const first = xff?.split(',')[0]?.trim();
		if (first) return first;
	}
	return direct;
}

export function isRateLimited(ip: string): boolean {
	const entry = attempts.get(ip);
	if (!entry) {
		return false;
	}

	if (Date.now() > entry.resetAt) {
		attempts.delete(ip);
		return false;
	}

	return entry.count >= MAX_ATTEMPTS;
}

export function recordAttempt(ip: string): void {
	const now = Date.now();
	const entry = attempts.get(ip);
	if (!entry || now > entry.resetAt) {
		attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
	} else {
		entry.count++;
	}
}

export function resetAttempts(ip: string): void {
	attempts.delete(ip);
}

setInterval(() => {
	const now = Date.now();
	for (const [ip, entry] of attempts) {
		if (now > entry.resetAt) {
			attempts.delete(ip);
		}
	}
}, WINDOW_MS);
