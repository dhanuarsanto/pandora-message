import { error, type RequestEvent } from '@sveltejs/kit';

export function load({ params }: RequestEvent) {
	const code = Number(params.code);
	if (!Number.isInteger(code) || code < 400 || code > 599) {
		throw error(500, `Kode error tidak valid: ${params.code}`);
	}
	throw error(code, `Pesan uji untuk kode ${code}`);
}