<script lang="ts">
	import MessageList from '$lib/components/MessageList.svelte';
	import { APP_NAME, TIPE_PENERIMA } from '$lib/config';
	import type { ColSpec, FilterField } from '$lib/types';

	const COLS: ColSpec[] = [
		{ key: 'kode', label: 'Kode', mono: true, strong: true },
		{ key: 'tgl_entri', label: 'Tgl Entri', muted: true, date: true },
		{ key: 'penerima', label: 'Penerima', strong: true, width: 200 },
		{ key: 'tipe_penerima', label: 'Tipe Penerima', badge: true },
		{ key: 'pesan', label: 'Pesan', muted: true, width: 320 },
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

	const FILTERS: FilterField[] = [
		{ type: 'date', param: 'startDate', label: 'Tgl Mulai' },
		{ type: 'date', param: 'endDate', label: 'Tgl Akhir' },
		{ type: 'number', param: 'limit', label: 'Limit', placeholder: 'Batas maksimal data' },
		{ type: 'reseller', param: 'reseller', label: 'Reseller' },
		{ type: 'text', param: 'penerima', label: 'Penerima', placeholder: 'Cari penerima...' },
		{ type: 'tipe', param: 'tipe', label: 'Tipe Penerima', source: TIPE_PENERIMA },
		{ type: 'status', param: 'status', label: 'Status' },
		{ type: 'text', param: 'pesan', label: 'Pesan', placeholder: 'Isi pesan...' },
		{ type: 'checkbox', param: 'replyToReseller', label: 'Reply ke Reseller' },
		{ type: 'checkbox', param: 'perintahProvider', label: 'Perintah Provider' }
	];
</script>

<svelte:head><title>Outbox - {APP_NAME}</title></svelte:head>

<MessageList
	path="/outbox"
	title="Kotak Keluar"
	subtitle="Pesan terkirim dari sistem."
	cols={COLS}
	filters={FILTERS}
	stackKey="pandora-outbox-cursor-stack"
/>
