export const APP_NAME = 'Pandora';
export const APP_UNIT = 'pandora';

export const RULES: Record<string, string> = {
	sa: 'Super Admin',
	op: 'Operator',
	fin: 'Finance',
	opout: 'Operator Out'
};

export const INBOX_STATUS = identityMap([
	20, 21, 22, 40, 41, 42, 43, 44, 45, 46, 47, 49, 52, 56, 64, 65, 69
]);

export const OUTBOX_STATUS = identityMap([20, 40, 50]);

export const TIPE = identityMap([1, 'O', 'W', 'X']);
export const TIPE_PENGIRIM: Record<string, string> = TIPE;
export const TIPE_PENERIMA: Record<string, string> = TIPE;

export const KODE_TERMINAL = identityMap([1, 2, 3]);

function identityMap<T extends number | string>(keys: readonly T[]): Record<T, string> {
	return Object.fromEntries(keys.map((k) => [k, String(k)])) as Record<T, string>;
}
