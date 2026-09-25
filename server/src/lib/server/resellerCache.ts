import type { ResellerResponse } from '$lib/references/types';

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 100;

export type ResellerGetter = (token: string) => Promise<ResellerResponse>;

export function createResellerCache(getter: ResellerGetter) {
	const cache = new Map<string, { data: ResellerResponse; fetchedAt: number }>();
	const inflight = new Map<string, Promise<ResellerResponse>>();

	function prune(now = Date.now()): void {
		for (const [k, e] of cache) {
			if (now - e.fetchedAt >= TTL_MS) cache.delete(k);
		}
		while (cache.size > MAX_ENTRIES) {
			cache.delete(cache.keys().next().value as string);
		}
	}

	return {
		prune,
		getResellers(token: string): Promise<ResellerResponse> {
			prune();
			const cached = cache.get(token);
			if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
				return Promise.resolve(cached.data);
			}
			const existing = inflight.get(token);
			if (existing) return existing;

			const p = getter(token)
				.then((data) => {
					cache.set(token, { data, fetchedAt: Date.now() });
					return data;
				})
				.finally(() => inflight.delete(token));

			inflight.set(token, p);
			return p;
		}
	};
}
