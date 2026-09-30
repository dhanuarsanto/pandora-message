import { APP_UNIT } from '../config.ts';

export type ColPrefs = {
	order: string[];
	hidden: string[];
};

export type ColsStore = {
	username: string;
	inbox: ColPrefs;
	outbox: ColPrefs;
};

const STORE_KEY = `${APP_UNIT}-cols`;
const LEGACY_KEYS = [`${APP_UNIT}-inbox-cols`, `${APP_UNIT}-outbox-cols`];

function defaultPrefs(): ColPrefs {
	return { order: [], hidden: [] };
}

function readStore(): ColsStore | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.localStorage.getItem(STORE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return null;
		const s = parsed as Partial<ColsStore>;
		if (typeof s.username !== 'string') return null;
		return {
			username: s.username,
			inbox: s.inbox ?? defaultPrefs(),
			outbox: s.outbox ?? defaultPrefs()
		};
	} catch {
		return null;
	}
}

function writeStore(store: ColsStore): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
	} catch {
		// localStorage penuh atau diblokir — abaikan
	}
}

function dropLegacy(): void {
	if (typeof window === 'undefined') return;
	for (const k of LEGACY_KEYS) {
		try {
			window.localStorage.removeItem(k);
		} catch {
			// abaikan
		}
	}
}

function sanitize(raw: unknown, cols: Keys[]): ColPrefs | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const s = raw as Partial<ColPrefs>;
	if (!Array.isArray(s.order) || !Array.isArray(s.hidden)) return null;

	const all = cols.map((c) => c.key);
	const valid = s.order.filter((k) => all.includes(k));
	const missing = all.filter((k) => !valid.includes(k));
	const hidden = s.hidden.filter((k) => all.includes(k) && !missing.includes(k));

	if (valid.length + missing.length === 0) return null;

	const visibleCount = valid.length + missing.length - hidden.length;
	return {
		order: [...valid, ...missing],
		hidden: visibleCount > 0 ? hidden.slice(0, valid.length + missing.length - 1) : []
	};
}

function currentStore(username: string): ColsStore {
	const store = readStore();
	if (!store) {
		dropLegacy();
		return { username, inbox: defaultPrefs(), outbox: defaultPrefs() };
	}
	if (store.username !== username) dropLegacy();
	return store;
}

export function loadColPrefs(username: string, route: ColsRoute, cols: Keys[]): ColPrefs {
	if (typeof window === 'undefined' || !username)
		return { order: cols.map((c) => c.key), hidden: [] };

	const store = currentStore(username);
	if (store.username !== username) return { order: cols.map((c) => c.key), hidden: [] };

	const branch = sanitize(store[route], cols);
	return branch ?? { order: cols.map((c) => c.key), hidden: [] };
}

export function saveColPrefs(username: string, route: ColsRoute, prefs: ColPrefs): void {
	if (typeof window === 'undefined' || !username) return;
	const store = currentStore(username);
	writeStore({ ...store, username, [route]: prefs });
}

export function clearColPrefs(username: string, route: ColsRoute, cols: Keys[]): void {
	if (typeof window === 'undefined' || !username) return;
	const store = currentStore(username);
	writeStore({
		...store,
		username,
		[route]: { order: cols.map((c) => c.key), hidden: [] }
	});
}

export function visibleOf<T extends { key: string }>(ordered: T[], hidden: string[]): T[] {
	return ordered.filter((c) => !hidden.includes(c.key));
}

export function reorderKeys(
	keys: string[],
	from: string,
	to: string,
	side: 'before' | 'after'
): string[] {
	const f = keys.indexOf(from);
	const t = keys.indexOf(to);
	if (f < 0 || t < 0 || f === t) return keys;
	const arr = keys.slice();
	arr.splice(f, 1);
	let idx = arr.indexOf(to);
	if (side === 'after') idx += 1;
	arr.splice(idx, 0, from);
	return arr;
}

type Keys = { key: string };
export type ColsRoute = 'inbox' | 'outbox';
