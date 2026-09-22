import { ApiError } from './api';
import type { ResellerResponse, UnauthorizedFlag } from '$lib/types';

export function as401<T>(promise: Promise<T>): Promise<T | UnauthorizedFlag> {
	return promise.then(
		(d) => d,
		(err) => {
			if (err instanceof ApiError && err.status === 401) {
				return { __unauthorized: true } as UnauthorizedFlag;
			}
			throw err;
		}
	);
}

export function settleResellers(
	promise: Promise<ResellerResponse>
): Promise<ResellerResponse | null | UnauthorizedFlag> {
	return promise.then(
		(d) => d,
		(err) =>
			err instanceof ApiError && err.status === 401
				? ({ __unauthorized: true } as UnauthorizedFlag)
				: null
	);
}
