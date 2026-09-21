import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import type { ColSpec, FilterField } from './types';

export function navigate(route: '/inbox' | '/outbox', queryString: string): void {
	const target = queryString
		? (`${route}?${queryString}` as unknown as '/inbox' | '/outbox')
		: route;
	goto(resolve(target));
}

export function initStack(stackKey: string): (number | null)[] {
	try {
		const raw = sessionStorage.getItem(stackKey);
		if (raw) {
			const saved: unknown = JSON.parse(raw);
			if (Array.isArray(saved) && saved.every((x) => x === null || typeof x === 'number')) {
				return saved as (number | null)[];
			}
		}
	} catch {
		// korup -> mulai dari halaman pertama
	}
	return [null];
}

export function is401(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'status' in err &&
		(err as { status: number }).status === 401
	);
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatDate(raw: string | number | undefined): string {
	if (raw === null || raw === undefined || raw === '') return '-';
	const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(raw));
	if (!m) return String(raw);
	const detik = m[6] ? ':' + m[6] : '';
	return `${m[3]} ${BULAN[+m[2] - 1]} ${m[1]} ${m[4]}:${m[5]}${detik}`;
}

export function statusClasses(raw: string | number | undefined): string {
	const s = Number(raw);
	if (s === 20) return 'bg-(--c-success-bg) text-(--c-success)';
	if (s >= 40 && s < 50) return 'bg-(--c-danger-bg) text-(--c-danger)';
	if (s === 50 || s === 52 || s === 55 || s === 69) {
		return 'bg-(--c-warning-bg) text-(--c-warning)';
	}
	return 'bg-(--c-surface-2) text-(--c-fg-muted)';
}

export function cellText(raw: string | number | undefined): string {
	if (raw === null || raw === undefined) return '-';
	return String(raw);
}

export function cellClass(c: ColSpec): string {
	let cls = 'border-b border-(--c-border) px-3.5 py-3';
	cls += c.mono ? ' font-mono text-[11px] whitespace-nowrap' : ' text-[12px]';
	if (c.strong) cls += ' font-semibold';
	if (c.muted) cls += ' text-(--c-fg-soft)';
	if (c.trunc) cls += ' truncate';
	return cls;
}

export function initFilterFromUrl(
	filters: FilterField[],
	params: URLSearchParams
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const f of filters) {
		out[f.param] = '';
		const v = params.get(f.param);
		if (f.type === 'checkbox' ? v === 'true' : v) out[f.param] = v as string;
	}
	return out;
}

export function buildQuery(
	query: Record<string, string>,
	pageSize: string,
	cursor: number | null
): URLSearchParams {
	const u = new SvelteURLSearchParams();
	if (cursor !== null) u.set('cursor', String(cursor));
	if (pageSize !== '' && Number(pageSize) > 0) u.set('pageSize', pageSize);
	for (const [k, v] of Object.entries(query)) {
		if (v === '') continue;
		u.set(k, v);
	}
	return u;
}
