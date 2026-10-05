import { RULES } from './config.ts';
import { cn } from './utils.ts';
import type { ColSpec } from './message/types.ts';
import { BULAN_PENDEK } from './date.ts';

export function formatDate(raw: string | number | undefined): string {
	if (raw === null || raw === undefined || raw === '') return '-';
	const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(raw));
	if (!m) return String(raw);
	const detik = m[6] ? ':' + m[6] : '';
	return `${m[3]} ${BULAN_PENDEK[+m[2] - 1]} ${m[1]} ${m[4]}:${m[5]}${detik}`;
}

export function formatDateTime(raw: string | number | undefined): { date: string; time: string } {
	if (raw === null || raw === undefined || raw === '') return { date: '-', time: '' };
	const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(raw));
	if (!m) return { date: String(raw), time: '' };
	const detik = m[6] ? ':' + m[6] : '';
	const date = `${m[3]} ${BULAN_PENDEK[+m[2] - 1]} ${m[1]}`;
	const time = `${m[4]}:${m[5]}${detik}`;
	return { date, time };
}

export function formatRules(code: string | null): string | null {
	if (!code) return null;
	return RULES[code.trim().toLowerCase()] ?? code;
}

export function statusClasses(raw: string | number | undefined): string {
	const s = Number(raw);
	if (s === 20) return 'bg-(--c-success-bg) text-(--c-success)';
	if (s >= 40) return 'bg-(--c-danger-bg) text-(--c-danger)';
	return 'bg-(--c-success-bg) text-(--c-success)';
}

export function cellText(raw: string | number | undefined): string {
	if (raw === null || raw === undefined) return '-';
	return String(raw);
}

export function cellTextFor(c: ColSpec, raw: string | number | undefined): string {
	return c.date ? formatDate(raw) : cellText(raw);
}

export function rowKeyOf(item: { tgl_entri: string }, index: number): string {
	return `${item.tgl_entri}-${index}`;
}

export function cellClass(c: ColSpec): string {
	return cn(
		'border-b border-(--c-table-line) px-3.5 py-3',
		c.mono ? 'font-mono text-[12px]' : 'text-[13px]',
		c.date && 'tabular-nums',
		c.wrap ? 'align-top' : 'whitespace-nowrap',
		c.strong && 'font-semibold',
		c.muted && 'text-(--c-fg-soft)'
	);
}

export function cellBodyClass(c: ColSpec): string {
	if (!c.wrap) return '';
	return 'block min-w-[20rem] max-w-[40rem] whitespace-normal break-words leading-[1.6]';
}
