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

export function shouldFetch(
	lastKey: string,
	lastRetry: number,
	currentKey: string,
	currentRetry: number
): boolean {
	return lastKey !== currentKey || lastRetry !== currentRetry;
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
	return Object.entries(path === '/outbox' ? OUTBOX_STATUS : INBOX_STATUS);
}
