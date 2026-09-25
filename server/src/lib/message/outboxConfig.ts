import { TIPE_PENERIMA } from '$lib/config';
import type { ColSpec, FilterField } from '$lib/message/types';

export const OUTBOX_PATH = '/outbox' as const;
export const OUTBOX_LABEL = 'Kotak Keluar';
export const OUTBOX_SUBTITLE = 'Pesan terkirim dari sistem.';
export const OUTBOX_STACK_KEY = 'pandora-outbox-cursor-stack';

export const OUTBOX_COLS: ColSpec[] = [
	{ key: 'kode', label: 'Kode', mono: true, strong: true },
	{ key: 'tgl_entri', label: 'Tgl Entri', muted: true, date: true },
	{ key: 'penerima', label: 'Penerima', strong: true },
	{ key: 'tipe_penerima', label: 'Tipe Penerima', badge: true },
	{ key: 'pesan', label: 'Pesan', muted: true },
	{ key: 'status', label: 'Status', status: true },
	{ key: 'tgl_status', label: 'Tgl Status', muted: true, date: true },
	{ key: 'kode_inbox', label: 'Kode Inbox', mono: true },
	{ key: 'kode_transaksi', label: 'Kode Transaksi', mono: true },
	{ key: 'kode_reseller', label: 'Kode Reseller', mono: true },
	{ key: 'bebas_biaya', label: 'Bebas Biaya' },
	{ key: 'is_perintah', label: 'Perintah' },
	{ key: 'kode_modul', label: 'Kode Modul', mono: true },
	{ key: 'prioritas', label: 'Prioritas' },
	{ key: 'modul_proses', label: 'Modul Proses' },
	{ key: 'pengirim', label: 'Pengirim', strong: true },
	{ key: 'kode_terminal', label: 'Kode Terminal', mono: true },
	{ key: 'ctr_kirim', label: 'Ctr Kirim' }
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
