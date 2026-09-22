const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

export function getClientIp(event: { getClientAddress(): string }): string {
	return event.getClientAddress() || 'unknown';
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

const sweep = setInterval(() => {
	const now = Date.now();
	for (const [ip, entry] of attempts) {
		if (now > entry.resetAt) {
			attempts.delete(ip);
		}
	}
}, WINDOW_MS);
sweep.unref();
