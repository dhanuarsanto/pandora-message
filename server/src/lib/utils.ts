import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import clsx, { type ClassValue } from 'clsx';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { twMerge } from 'tailwind-merge';
import type { FilterField } from './types';

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

export function todayISO(): string {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
