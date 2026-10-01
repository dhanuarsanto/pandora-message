export type SortDir = 'asc' | 'desc';

export type SortSpec = { date?: boolean };

type Cell = string | number | null | undefined;

function cellOf(item: unknown, key: string): Cell {
	const v = (item as Record<string, unknown>)[key];
	if (v === null || v === undefined) return null;
	if (typeof v === 'number' || typeof v === 'string') return v;
	return String(v);
}

function isEmpty(v: Cell): boolean {
	return v === null || v === '';
}

function asTime(v: Cell): number | null {
	if (typeof v !== 'string') return null;
	const t = Date.parse(v);
	return Number.isNaN(t) ? null : t;
}

function compare(a: Cell, b: Cell, date: boolean): number {
	if (a === b) return 0;
	if (date) {
		const ta = asTime(a);
		const tb = asTime(b);
		if (ta !== null && tb !== null) return ta - tb;
	}
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	if (typeof a === 'number') return -1;
	if (typeof b === 'number') return 1;
	return String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
}

export function sortRows<T>(
	items: T[],
	key: string | null,
	dir: SortDir,
	spec: SortSpec = {}
): T[] {
	if (key === null) return items;
	const sign = dir === 'asc' ? 1 : -1;
	const date = spec.date === true;
	return items
		.map((item, i) => ({ item, i }))
		.sort((x, y) => {
			const a = cellOf(x.item, key);
			const b = cellOf(y.item, key);
			const ea = isEmpty(a) ? 1 : 0;
			const eb = isEmpty(b) ? 1 : 0;
			if (ea !== eb) return ea - eb;
			const c = compare(a, b, date);
			if (c !== 0) return c * sign;
			return x.i - y.i;
		})
		.map((x) => x.item);
}

export function pageCount(total: number, size: number): number {
	if (size <= 0) return 1;
	return Math.max(1, Math.ceil(total / size));
}

export function clampPage(page: number, total: number, size: number): number {
	const pages = pageCount(total, size);
	if (!Number.isFinite(page)) return 1;
	return Math.min(Math.max(1, Math.trunc(page)), pages);
}

export function pageRange(page: number, total: number, size: number): { from: number; to: number } {
	if (total <= 0) return { from: 0, to: 0 };
	const from = (page - 1) * size + 1;
	return { from, to: Math.min(page * size, total) };
}

const ELLIPSIS = -1;

export function pageWindow(page: number, totalPages: number, siblings = 1): number[] {
	if (totalPages <= 0) return [];
	const edgeMax = siblings * 2 + 5;
	if (totalPages <= edgeMax) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	const left = Math.max(page - siblings, 1);
	const right = Math.min(page + siblings, totalPages);
	const hasLeftGap = left > 2;
	const hasRightGap = right < totalPages - 1;

	if (!hasLeftGap && !hasRightGap) {
		return Array.from({ length: edgeMax }, (_, i) => i + 1);
	}
	if (!hasLeftGap) {
		return [...Array.from({ length: edgeMax - 2 }, (_, i) => i + 1), ELLIPSIS, totalPages];
	}
	if (!hasRightGap) {
		return [
			1,
			ELLIPSIS,
			...Array.from({ length: edgeMax - 2 }, (_, i) => totalPages - edgeMax + 3 + i)
		];
	}
	return [
		1,
		ELLIPSIS,
		...Array.from({ length: right - left + 1 }, (_, i) => left + i),
		ELLIPSIS,
		totalPages
	];
}
