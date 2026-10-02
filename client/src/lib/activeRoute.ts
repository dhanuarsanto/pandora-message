export type AppRoute = '/inbox' | '/outbox';

export function isRouteActive(currentRouteId: string | null, target: AppRoute): boolean {
	if (!currentRouteId) return false;
	return currentRouteId === target || currentRouteId.startsWith(`${target}/`);
}
