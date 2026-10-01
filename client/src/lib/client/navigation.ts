import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export function navigate(route: '/inbox' | '/outbox', queryString: string): void {
	const target = queryString
		? (`${route}?${queryString}` as unknown as '/inbox' | '/outbox')
		: route;
	goto(resolve(target));
}
