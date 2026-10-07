import { APP_UNIT } from '../config.ts';

const STORAGE_KEY = `${APP_UNIT}-session`;
export const SESSION_TTL_SEC = 3600;

type StorageMode = 'session' | 'persistent';

function getMode(): StorageMode {
	if (typeof window === 'undefined') return 'persistent';
	const env = (import.meta as { env?: Record<string, string> }).env?.PUBLIC_SESSION_COOKIE_MODE;
	if (env === 'session' || env === 'persistent') {
		return env;
	}
	return 'persistent';
}

function getStore(mode: StorageMode): Storage | null {
	if (typeof window === 'undefined') return null;
	return mode === 'session' ? window.sessionStorage : window.localStorage;
}

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

export type Session = {
	token: string;
	username: string;
	rules: string;
	expiresAt: number;
};

export function readSession(): Session | null {
	if (typeof window === 'undefined') return null;
	const mode = getMode();
	const store = getStore(mode);
	if (!store) return null;
	try {
		const raw = store.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return null;
		const s = parsed as Partial<Session>;
		if (typeof s.token !== 'string' || typeof s.username !== 'string') return null;
		if (typeof s.rules !== 'string' || typeof s.expiresAt !== 'number') return null;
		if (s.expiresAt <= Date.now()) {
			clearSession();
			return null;
		}
		return { token: s.token, username: s.username, rules: s.rules, expiresAt: s.expiresAt };
	} catch {
		return null;
	}
}

export function saveSession(data: LoginData): void {
	if (typeof window === 'undefined') return;
	const mode = getMode();
	const store = getStore(mode);
	if (!store) return;
	const session: Session = {
		token: data.token,
		username: data.username,
		rules: data.rules,
		expiresAt: Date.now() + SESSION_TTL_SEC * 1000
	};
	try {
		store.setItem(STORAGE_KEY, JSON.stringify(session));
	} catch {
	}
}

export function getToken(): string | null {
	return readSession()?.token ?? null;
}

export function clearSession(): void {
	if (typeof window === 'undefined') return;
	const mode = getMode();
	const store = getStore(mode);
	if (!store) return;
	try {
		store.removeItem(STORAGE_KEY);
	} catch {
	}
}