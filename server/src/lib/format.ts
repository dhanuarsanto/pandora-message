import type { ColSpec } from './types';

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
	return cls;
}
