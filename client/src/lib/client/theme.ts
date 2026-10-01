import { get, writable } from 'svelte/store';
import { APP_UNIT } from '../config';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = `${APP_UNIT}-theme`;

function safeGet(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		// akses storage diblokir — anggap kosong
		return null;
	}
}

function safeSet(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// storage penuh atau diblokir — abaikan
	}
}

function getInitialMode(): ThemeMode {
	if (typeof window === 'undefined') return 'light';
	const saved = safeGet(STORAGE_KEY);
	if (saved === 'dark' || saved === 'light') return saved;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const store = writable<ThemeMode>(getInitialMode());
let initialized = false;

function apply(mode: ThemeMode): void {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', mode === 'dark');
}

function init(): void {
	if (typeof window === 'undefined' || initialized) return;
	initialized = true;
	apply(get(store));
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		if (!safeGet(STORAGE_KEY)) store.set(e.matches ? 'dark' : 'light');
	});
}

function setMode(next: ThemeMode): void {
	store.set(next);
	safeSet(STORAGE_KEY, next);
	document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
	apply(next);
}

function toggle(): void {
	setMode(get(store) === 'dark' ? 'light' : 'dark');
}

export const theme = {
	subscribe: store.subscribe,
	init,
	toggle
};
