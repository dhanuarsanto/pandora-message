let openKey = $state<symbol | null>(null);

export function openPicker(key: symbol): void {
	openKey = key;
}

export function closePicker(): void {
	openKey = null;
}

export function isPickerOpen(key: symbol): boolean {
	return openKey === key;
}
