import { OUTBOX_STATUS_TABLE, TIPE_PENERIMA } from '$lib/config';
import type { ColSpec, FilterField, OutboxItem } from '$lib/message/types';

export const OUTBOX_PATH = '/outbox' as const;
export const OUTBOX_LABEL = 'Kotak Keluar';
export const OUTBOX_SUBTITLE = 'Pesan terkirim dari sistem.';

function statusLabel(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === '') return '-';
	return OUTBOX_STATUS_TABLE[value as keyof typeof OUTBOX_STATUS_TABLE] ?? String(value);
}

export const OUTBOX_COLS: ColSpec<OutboxItem>[] = [
	{ key: 'kode', label: 'Kode', mono: true, strong: true, width: '80px' },
	{ key: 'tgl_entri', label: 'Tgl. Entri', muted: true, date: true, width: '1px' },
	{ key: 'tgl_status', label: 'Tgl. Status', muted: true, date: true, width: '1px' },
	{ key: 'penerima', label: 'Penerima', strong: true, minWidth: '120px' },
	{ key: 'kode_reseller', label: 'Kode Reseller', mono: true, width: '110px' },
	{ key: 'nama_reseller', label: 'Nama Reseller', minWidth: '140px' },
	{ key: 'pesan', label: 'Pesan', muted: true, wrap: true },
	{
		key: 'status',
		label: 'Status',
		status: true,
		render: (item) => statusLabel(item.status),
		width: '100px'
	},
	{ key: 'kode_inbox', label: 'Kode Inbox', mono: true, width: '100px' },
	{ key: 'kode_transaksi', label: 'TrxID', mono: true, width: '100px' },
	{
		key: 'sender',
		label: 'Sender',
		width: '60px',
		render: (item) => (item.tipe_penerima === '1' ? 'IP' : '-')
	}
];

export const OUTBOX_FILTERS: FilterField[] = [
	{ type: 'date', param: 'startDate', label: 'Tgl Mulai' },
	{ type: 'date', param: 'endDate', label: 'Tgl Akhir' },
	{ type: 'number', param: 'limit', label: 'Limit', placeholder: 'Mis. 20' },
	{ type: 'reseller', param: 'reseller', label: 'Reseller' },
	{ type: 'text', param: 'penerima', label: 'Penerima', placeholder: 'Cari penerima...' },
	{ type: 'tipe', param: 'tipe', label: 'Tipe Penerima', source: TIPE_PENERIMA },
	{ type: 'status', param: 'status', label: 'Status' },
	{ type: 'text', param: 'pesan', label: 'Pesan', placeholder: 'Isi pesan...' },
	{ type: 'checkbox', param: 'replyToReseller', label: 'Reply ke Reseller', defaultChecked: true },
	{ type: 'checkbox', param: 'perintahProvider', label: 'Perintah Provider' }
];
