import {
	clearSession as clearStored,
	readSession,
	saveSession as saveStored,
	type LoginData,
	type Session
} from '$lib/api/session';

let current = $state<Session | null>(null);
let initialized = false;

export const session = {
	get value(): Session | null {
		return current;
	},
	get token(): string | null {
		return current?.token ?? null;
	},
	get username(): string {
		return current?.username ?? '';
	},
	get rules(): string | null {
		return current?.rules ?? null;
	},
	init(): void {
		if (initialized) return;
		initialized = true;
		current = readSession();
	},
	login(data: LoginData): void {
		saveStored(data);
		initialized = true;
		current = readSession();
	},
	logout(): void {
		clearStored();
		initialized = true;
		current = null;
	}
};
