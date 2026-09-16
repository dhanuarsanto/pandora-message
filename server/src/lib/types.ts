export type ThemeMode = 'light' | 'dark';

export type LoginRequest = {
	username: string;
	password: string;
};

export type LoginData = {
	rules: string;
	token: string;
	username: string;
};

export type LoginResponse = {
	status: string;
	data: LoginData;
};

export type OutboxItem = {
	kode: number;
	tgl_entri: string;
	penerima: string;
	tipe_penerima: string;
	pesan: string;
	status: number;
	tgl_status: string;
	kode_transaksi: number;
	kode_reseller: string;
	bebas_biaya: number;
	is_perintah: number;
	prioritas: number;
	modul_proses: string;
};

export type InboxItem = {
	kode: number;
	tgl_entri: string;
	tgl_status: string;
	pengirim: string;
	tipe_pengirim: string;
	pesan: string;
	status: number;
	kode_reseller: string;
	kode_transaksi: number;
	is_jawaban: number;
	hash: string;
};
export type InboxMeta = {
	has_next_page: boolean;
	has_prev_page: boolean;
	next_cursor: number | null;
};
export type InboxResponse = {
	status: string;
	data: { items: InboxItem[]; meta: InboxMeta; trace_id: string };
};

export type ResellerOption = {
	kode: string;
	nama: string;
};
export type ResellerResponse = {
	status: string;
	data: { items: ResellerOption[]; trace_id: string };
};

export type OutboxResponse = {
	status: string;
	data: { items: OutboxItem[]; meta: InboxMeta; trace_id: string };
};
