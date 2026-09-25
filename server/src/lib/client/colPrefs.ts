export type ColPrefs = {
	order: string[];
	hidden: string[];
};

export function loadColPrefs(key: string, cols: Keys[]): ColPrefs {
	const all = cols.map((c) => c.key);
	const defaults: ColPrefs = { order: all, hidden: [] };

	if (typeof window === 'undefined') return defaults;

	try {
		const raw = window.localStorage.getItem(key);
		if (!raw) return defaults;

		const saved: unknown = JSON.parse(raw);
		if (typeof saved !== 'object' || saved === null) return defaults;

		const s = saved as Partial<ColPrefs>;
		if (!Array.isArray(s.order) || !Array.isArray(s.hidden)) return defaults;

		const valid = s.order.filter((k) => all.includes(k));
		const missing = all.filter((k) => !valid.includes(k));
		const hidden = s.hidden.filter((k) => all.includes(k) && !missing.includes(k));

		if (valid.length + missing.length === 0) return defaults;

		const visibleCount = valid.length + missing.length - hidden.length;
		return {
			order: [...valid, ...missing],
			hidden: visibleCount > 0 ? hidden.slice(0, valid.length + missing.length - 1) : []
		};
	} catch {
		return defaults;
	}
}

export function saveColPrefs(key: string, prefs: ColPrefs): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(key, JSON.stringify(prefs));
	} catch {
		// localStorage penuh atau diblokir — abaikan
	}
}

export function clearColPrefs(key: string): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.removeItem(key);
	} catch {
		// abaikan
	}
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
