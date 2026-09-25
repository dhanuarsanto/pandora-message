import { APP_UNIT } from '$lib/config';
import { apiGet } from './api.ts';
import { createResellerCache } from './resellerCache.ts';
import type { ResellerResponse } from '$lib/types';

const cache = createResellerCache((token) =>
	apiGet<ResellerResponse>(`/api/v1/${APP_UNIT}/master/reseller-dropdown`, token)
);

export const getResellers = cache.getResellers;
