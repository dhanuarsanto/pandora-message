export const APP_NAME = 'Pandora';
export const APP_UNIT = 'pandora';

export const RULES: Record<string, string> = {
	sa: 'Super Admin',
	op: 'Operator',
	fin: 'Finance',
	opout: 'Operator Out'
};

export const INBOX_STATUS: Record<number, string> = {
	1: 'Sedang Proses',
	20: 'Sukses',
	40: 'Gagal',
	47: 'Produk Gangguan',
	50: 'Dibatalkan',
	52: 'Tujuan Salah',
	55: 'Timeout',
	61: 'Qty Tidak Sesuai',
	69: 'Cutoff'
};
