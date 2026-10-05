export const APP_NAME = 'Pandora';
export const APP_UNIT = 'pandora';

export const RULES: Record<string, string> = {
	sa: 'Super Admin',
	op: 'Operator',
	fin: 'Finance',
	opout: 'Operator Out'
};

export const INBOX_STATUS = {
	20: 'Sukses',
	21: 'Sukses Masuk Outbox',
	22: 'Sukses Masuk Transaksi',
	40: 'Gagal',
	41: 'Bukan Reseller',
	42: 'Format Salah',
	43: 'Saldo Tidak Cukup',
	44: 'Produk Salah',
	45: 'Stok Kosong',
	46: 'Transaksi Dobel',
	47: 'Produk Gangguan',
	49: 'Pin Salah',
	50: 'Dibatalkan',
	52: 'Tujuan Salah',
	56: 'Nomor Blacklist',
	64: 'Diabaikan',
	65: 'Unit Tidak Cukup',
	69: 'Cutoff'
};

export const OUTBOX_STATUS = {
	20: 'Sukses',
	40: 'Gagal',
	50: 'Dibatalkan'
};

export const OUTBOX_STATUS_TABLE = {
	20: 'Sukses',
	40: 'Gagal',
	50: 'Dibatalkan'
};

export const TIPE_PENGIRIM = {
	S: 'SMS',
	O: 'OH',
	1: 'IP',
	W: 'WA',
	X: 'API'
};
export const TIPE_PENERIMA = {
	S: 'SMS',
	O: 'OH',
	1: 'IP',
	W: 'WA',
	X: 'API'
};

export const KODE_TERMINAL = { 1: '#PANDORA' };
