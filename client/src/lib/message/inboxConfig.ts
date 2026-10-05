import { TIPE_PENGIRIM } from '$lib/config';
import type { ColSpec, FilterField, InboxItem } from '$lib/message/types';

export const INBOX_PATH = '/inbox' as const;
export const INBOX_LABEL = 'Kotak Masuk';
export const INBOX_SUBTITLE = 'Pesan masuk dari sistem.';

function terminalLabel(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === '') return 'IP';
	if (value === 1 || value === '1') return '-';
	if (value === 2 || value === '2') return 'WA 1 - 082121437735';
	if (value === 3 || value === '3') return 'WA 2 - 087887864122';
	return String(value);
}

export const INBOX_COLS: ColSpec<InboxItem>[] = [
	{ key: 'kode', label: 'Kode', mono: true, strong: true },
	{ key: 'tgl_entri', label: 'Tgl Entri', muted: true, date: true },
	{ key: 'tgl_status', label: 'Tgl Status', muted: true, date: true },
	{ key: 'pengirim', label: 'Pengirim', strong: true },
	{ key: 'kode_reseller', label: 'Kode Reseller', mono: true },
	{ key: 'pesan', label: 'Pesan', muted: true, wrap: true },
	{ key: 'nama_reseller', label: 'Nama Reseller' },
	{ key: 'status', label: 'Status', status: true },
	{ key: 'kode_transaksi', label: 'TrxID', mono: true },
	{ key: 'kode_terminal', label: 'Terminal', mono: true, render: (item) => terminalLabel(item.kode_terminal) },
	{ key: 'service_center', label: 'Service Center' }
];

export const INBOX_FILTERS: FilterField[] = [
	{ type: 'date', param: 'startDate', label: 'Tgl Mulai' },
	{ type: 'date', param: 'endDate', label: 'Tgl Akhir' },
	{ type: 'number', param: 'limit', label: 'Limit', placeholder: 'Mis. 20' },
	{ type: 'terminal', param: 'terminal', label: 'Terminal' },
	{ type: 'reseller', param: 'reseller', label: 'Reseller' },
	{ type: 'text', param: 'pengirim', label: 'Pengirim', placeholder: 'Cari pengirim...' },
	{ type: 'tipe', param: 'tipe', label: 'Tipe Pengirim', source: TIPE_PENGIRIM },
	{ type: 'status', param: 'status', label: 'Status' },
	{ type: 'text', param: 'pesan', label: 'Pesan', placeholder: 'Isi pesan...' },
	{
		type: 'checkbox',
		param: 'requestFromReseller',
		label: 'Request dari Reseller',
		defaultChecked: true
	},
	{ type: 'checkbox', param: 'jawabanFromProvider', label: 'Jawaban dari Provider' }
];
