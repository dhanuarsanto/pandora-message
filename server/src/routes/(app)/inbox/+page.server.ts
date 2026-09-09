import { apiGet } from '$lib/server/api';
import { getToken } from '$lib/server/auth';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type InboxItem = {
	kode: number;
	tgl_entri: string;
	penerima: string;
	pengirim: string;
	tipe_pengirim: string;
	pesan: string;
	status: number;
	kode_terminal: number;
	tgl_status: string;
	kode_reseller: string;
	kode_transaksi: number;
	is_jawaban: number;
	service_center: string;
	is_cs: number;
	kode_jawaban_cs: number;
};

export const load: PageServerLoad = async ({ cookies }) => {
	const token = getToken(cookies);
	if (!token) throw error(401, 'Belum login');
	const inbox = await apiGet<{
		status: string;
		data: { cursor: number; data: InboxItem[]; trace_id: string };
	}>('/api/v1/pandora/inbox?limit=20', token);
	return { inbox };
};
