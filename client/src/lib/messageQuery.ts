import type { FooterMeta, MessageItem } from './message/types.ts';
import type { FilterField } from './message/types.ts';
import { INBOX_STATUS, OUTBOX_STATUS } from './config.ts';
import { todayISO } from './date.ts';

export type MessageData = { items: MessageItem[]; meta: FooterMeta };
export type MessageBody = {
	status: string;
	data?: MessageData;
	message?: string;
	detail?: string;
};

export function applyDateDefaults(
	params: URLSearchParams,
	scope: 'today' | 'all'
): URLSearchParams {
	if (scope === 'today' && !params.has('startDate') && !params.has('endDate')) {
		params.set('startDate', todayISO());
		params.set('endDate', todayISO());
	}
	return params;
}

export function applyLimitDefault(params: URLSearchParams): URLSearchParams {
	if (!params.has('limit')) params.set('limit', '20');
	return params;
}

export function applyCheckboxDefaults(
	params: URLSearchParams,
	filters: FilterField[]
): URLSearchParams {
	for (const f of filters) {
		if (f.type === 'checkbox' && f.defaultChecked && !params.has(f.param)) {
			params.set(f.param, 'true');
		}
	}
	return params;
}

export function calcSkeletonCount(limit: number): number {
	return Math.min(limit || 10, 15);
}

export type FetchTrigger = { key: string; retry: number; refresh: number };

export function planFetch(
	last: FetchTrigger,
	current: FetchTrigger
): { run: boolean; silent: boolean } {
	const paramsChanged = last.key !== current.key;
	const retryPressed = last.retry !== current.retry;
	const refreshDue = last.refresh !== current.refresh;
	const run = paramsChanged || retryPressed || refreshDue;
	return { run, silent: run && !paramsChanged && !retryPressed };
}

export const AUTO_REFRESH_OPTIONS: { value: string; label: string }[] = [
	{ value: '30', label: '30 detik' },
	{ value: '60', label: '60 detik' },
	{ value: '120', label: '120 detik' }
];

export const DEFAULT_AUTO_REFRESH = '30';

export function autoRefreshMs(seconds: string): number {
	const n = Number(seconds);
	return (Number.isFinite(n) && n > 0 ? n : Number(DEFAULT_AUTO_REFRESH)) * 1000;
}

export function canAutoRefresh(enabled: boolean, hidden: boolean, loading: boolean): boolean {
	return enabled && !hidden && !loading;
}

export function normalizeMessageBody(body: MessageBody): {
	data: MessageData | null;
	error: string | null;
	cause: string | null;
} {
	if (body.status === 'sukses' && body.data) {
		return {
			data: { items: body.data.items ?? [], meta: body.data.meta },
			error: null,
			cause: null
		};
	}
	return { data: null, error: body.message ?? 'Gagal memuat data.', cause: body.detail ?? null };
}

export function statusOptionsFor(path: '/inbox' | '/outbox'): [string, string][] {
	const statusMap = path === '/outbox' ? OUTBOX_STATUS : INBOX_STATUS;
	return Object.entries(statusMap).sort(([, a], [, b]) => a.localeCompare(b, 'id'));
}
