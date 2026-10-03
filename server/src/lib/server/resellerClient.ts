import { APP_UNIT } from '$lib/config';
import { apiGet } from './api.ts';
import { createResellerCache } from './resellerCache.ts';
import type { ResellerResponse } from '$lib/references/types';

const cache = createResellerCache((token, clientIp) =>
	apiGet<ResellerResponse>(`/api/v1/${APP_UNIT}/master/reseller-dropdown`, token, clientIp)
);

export const getResellers = (token: string, clientIp?: string) =>
	cache.getResellers(token, clientIp);
