import clsx, { type ClassValue } from 'clsx';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { twMerge } from 'tailwind-merge';
import type { FilterField } from './message/types.ts';

function checkboxParamValue(f: FilterField, v: string): string {
	if (f.type !== 'checkbox') return v;
	if (v === 'true') return 'true';
	if (v === 'false' && f.defaultChecked) return 'false';
	return '';
}

export function initFilterFromUrl(
	filters: FilterField[],
	params: URLSearchParams
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const f of filters) {
		out[f.param] = '';
		const v = params.get(f.param);
		if (v !== null) {
			out[f.param] = checkboxParamValue(f, v);
		} else if (f.type === 'checkbox' && f.defaultChecked) {
			out[f.param] = 'true';
		}
	}
	return out;
}

export function buildQuery(query: Record<string, string>): URLSearchParams {
	const u = new SvelteURLSearchParams();
	for (const [k, v] of Object.entries(query)) {
		if (v === '') continue;
		u.set(k, v);
	}
	return sortedParams(u);
}

export function sortedParams(params: URLSearchParams): URLSearchParams {
	return new SvelteURLSearchParams(
		[...params.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
	);
}

export function sortedParamsString(params: URLSearchParams): string {
	return sortedParams(params).toString();
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
