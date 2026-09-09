import { apiGet } from '$lib/server/api';
import { getToken } from '$lib/server/auth';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type OutboxItem = {
	kode: number;
	tgl_entri: string;
	penerima: string;
	tipe_penerima: string;
	pesan: string;
	status: number;
	tgl_status: string;
	kode_inbox: number;
	kode_transaksi: number;
	kode_reseller: string;
	bebas_biaya: number;
	is_perintah: number;
	kode_modul: number;
	prioritas: number;
	modul_proses: string;
	pengirim: string;
	kode_terminal: number;
	ctr_kirim: string;
};

export const load: PageServerLoad = async ({ cookies }) => {
	const token = getToken(cookies);
	if (!token) throw error(401, 'Belum login');
	const outbox = await apiGet<{
		status: string;
		data: { cursor: number; data: OutboxItem[]; trace_id: string };
	}>('/api/v1/pandora/outbox?limit=20', token);
	return { outbox };
};
