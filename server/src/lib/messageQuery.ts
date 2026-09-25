import type { FooterMeta, MessageItem } from './message/types.ts';
import { INBOX_STATUS, OUTBOX_STATUS } from './config.ts';
import { todayISO } from './date.ts';

export type MessageData = { items: MessageItem[]; meta: FooterMeta };
export type MessageBody = {
	status: string;
	data?: MessageData;
	message?: string;
	detail?: string;
};
export type CursorStack = (number | null)[];

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

export function calcSkeletonCount(limit: number, pageSize: number): number {
	return Math.min(limit || pageSize || 10, pageSize || limit || 10, 15);
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

export function pushStackCursor(stack: CursorStack, cursor: number | null): CursorStack {
	return [...stack, cursor];
}

export function popStackCursor(stack: CursorStack): { stack: CursorStack; prev: number | null } {
	const next = stack.slice(0, -1);
	return { stack: next, prev: next[next.length - 1] ?? null };
}

export function rebuildStack(stack: CursorStack, cursor: number | null): CursorStack {
	const idx = stack.findIndex((x) => x === cursor);
	return idx >= 0 ? stack.slice(0, idx + 1) : [cursor];
}

export function stackStorageValue(stack: CursorStack): string | null {
	return stack.length === 1 && stack[0] === null ? null : JSON.stringify(stack);
}

export function saveCursorStack(stackKey: string, stack: CursorStack): void {
	const value = stackStorageValue(stack);
	try {
		if (value === null) {
			sessionStorage.removeItem(stackKey);
		} else {
			sessionStorage.setItem(stackKey, value);
		}
	} catch {
		// storage tidak tersedia — abaikan
	}
}
