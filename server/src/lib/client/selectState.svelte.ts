let openKey = $state<symbol | null>(null);

export function openSelect(key: symbol): void {
	openKey = key;
}

export function closeSelect(): void {
	openKey = null;
}

export function isSelectOpen(key: symbol): boolean {
	return openKey === key;
}
