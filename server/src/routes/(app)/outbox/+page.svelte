<script lang="ts">
	import MessageList, { type ColSpec, type FilterField } from '$lib/components/MessageList.svelte';
	import { APP_NAME, TIPE_PENERIMA } from '$lib/config';

	let { data } = $props();

	const COLS: ColSpec[] = [
		{ key: 'kode', label: 'Kode', mono: true, strong: true, trunc: true, maxWidth: 200 },
		{ key: 'tgl_entri', label: 'Tgl Entri', muted: true },
		{ key: 'penerima', label: 'Penerima', strong: true, trunc: true, maxWidth: 220 },
		{ key: 'tipe_penerima', label: 'Tipe Penerima', badge: true },
		{ key: 'pesan', label: 'Pesan', muted: true, trunc: true, maxWidth: 260 },
		{ key: 'status', label: 'Status' },
		{ key: 'tgl_status', label: 'Tgl Status', muted: true },
		{ key: 'kode_inbox', label: 'Kode Inbox', mono: true },
		{ key: 'kode_transaksi', label: 'Kode Transaksi', mono: true, trunc: true, maxWidth: 150 },
		{ key: 'kode_reseller', label: 'Kode Reseller', mono: true, trunc: true, maxWidth: 150 },
		{ key: 'bebas_biaya', label: 'Bebas Biaya' },
		{ key: 'is_perintah', label: 'Perintah' },
		{ key: 'kode_modul', label: 'Kode Modul', mono: true },
		{ key: 'prioritas', label: 'Prioritas' },
		{ key: 'modul_proses', label: 'Modul Proses', trunc: true, maxWidth: 160 },
		{ key: 'pengirim', label: 'Pengirim', strong: true, trunc: true, maxWidth: 140 },
		{ key: 'kode_terminal', label: 'Kode Terminal', mono: true },
		{ key: 'ctr_kirim', label: 'Ctr Kirim' }
	];

	const FILTERS: FilterField[] = [
		{ type: 'date', param: 'startDate', label: 'Tgl Mulai' },
		{ type: 'date', param: 'endDate', label: 'Tgl Akhir' },
		{ type: 'number', param: 'limit', label: 'Limit', placeholder: 'Batas maksimal data' },
		{ type: 'reseller', param: 'reseller', label: 'Reseller' },
		{ type: 'text', param: 'penerima', label: 'Penerima', placeholder: 'Cari penerima…' },
		{ type: 'tipe', param: 'tipe', label: 'Tipe Penerima', source: TIPE_PENERIMA },
		{ type: 'status', param: 'status', label: 'Status' },
		{ type: 'text', param: 'pesan', label: 'Pesan', placeholder: 'Isi pesan…' },
		{ type: 'checkbox', param: 'replyToReseller', label: 'Reply ke Reseller' },
		{ type: 'checkbox', param: 'perintahProvider', label: 'Perintah Provider' }
	];

	const SKELETON = [48, 84, 140, 52, 180, 84, 84, 140, 84, 80, 64, 64, 80, 64, 120, 140, 80, 64];
</script>

<svelte:head><title>Outbox — {APP_NAME}</title></svelte:head>

<MessageList
	load={data.outbox}
	resellers={data.resellers}
	path="/outbox"
	title="Kotak Keluar"
	subtitle="Pesan terkirim dari sistem."
	cols={COLS}
	filters={FILTERS}
	skeletonWidths={SKELETON}
	stackKey="pandora-outbox-cursor-stack"
/>
