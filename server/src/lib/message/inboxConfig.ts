import { TIPE_PENGIRIM } from '$lib/config';
import type { ColSpec, FilterField } from '$lib/message/types';

export const INBOX_PATH = '/inbox' as const;
export const INBOX_LABEL = 'Kotak Masuk';
export const INBOX_SUBTITLE = 'Pesan masuk dari sistem.';
export const INBOX_STACK_KEY = 'pandora-inbox-cursor-stack';

export const INBOX_COLS: ColSpec[] = [
	{ key: 'kode', label: 'Kode', mono: true, strong: true },
	{ key: 'tgl_entri', label: 'Tgl Entri', muted: true, date: true },
	{ key: 'penerima', label: 'Penerima', strong: true },
	{ key: 'pengirim', label: 'Pengirim', strong: true, width: 200 },
	{ key: 'tipe_pengirim', label: 'Tipe Pengirim', badge: true },
	{ key: 'pesan', label: 'Pesan', muted: true, width: 320 },
	{ key: 'status', label: 'Status', status: true },
	{ key: 'kode_terminal', label: 'Kode Terminal', mono: true },
	{ key: 'tgl_status', label: 'Tgl Status', muted: true, date: true },
	{ key: 'kode_reseller', label: 'Kode Reseller', mono: true },
	{ key: 'kode_transaksi', label: 'Kode Transaksi', mono: true },
	{ key: 'is_jawaban', label: 'Jawaban' },
	{ key: 'service_center', label: 'Service Center' },
	{ key: 'is_cs', label: 'Is CS' },
	{ key: 'kode_jawaban_cs', label: 'Kode Jawaban CS', mono: true },
	{ key: 'hash', label: 'Hash', mono: true, muted: true }
];

export const INBOX_FILTERS: FilterField[] = [
	{ type: 'date', param: 'startDate', label: 'Tgl Mulai' },
	{ type: 'date', param: 'endDate', label: 'Tgl Akhir' },
	{ type: 'number', param: 'limit', label: 'Limit', placeholder: 'Batas maksimal data' },
	{ type: 'terminal', param: 'terminal', label: 'Terminal' },
	{ type: 'reseller', param: 'reseller', label: 'Reseller' },
	{ type: 'text', param: 'pengirim', label: 'Pengirim', placeholder: 'Cari pengirim...' },
	{ type: 'tipe', param: 'tipe', label: 'Tipe Pengirim', source: TIPE_PENGIRIM },
	{ type: 'status', param: 'status', label: 'Status' },
	{ type: 'text', param: 'pesan', label: 'Pesan', placeholder: 'Isi pesan...' },
	{ type: 'checkbox', param: 'requestFromReseller', label: 'Request dari Reseller' },
	{ type: 'checkbox', param: 'jawabanFromProvider', label: 'Jawaban dari Provider' }
];
