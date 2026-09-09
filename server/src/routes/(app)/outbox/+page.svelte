<script lang="ts">
	let dateStart = $state('');
	let dateEnd = $state('');
	let limitVal = $state('24');
	let resellerInput = $state('');
	let penerimaInput = $state('');
	let tipeFilter = $state('all');
	let statusFilter = $state('all');
	let pesanInput = $state('');
	let replyReseller = $state(false);
	let perintahProvider = $state(false);
	let sortKey = $state('kode');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let page = $state(1);
	let showFilter = $state(true);
	const PER_PAGE = 10;

	interface OutboxMsg {
		kode: string;
		tgl_entri: string;
		penerima: string;
		tipe_penerima: string;
		pesan: string;
		status: string;
		tgl_status: string;
		kode_inbox: string;
		kode_transaksi: string;
		kode_reseller: string;
		bebas_biaya: string;
		is_perintah: string;
		kode_modul: string;
		prioritas: string;
		modul_proses: string;
		pengirim: string;
		kode_terminal: string;
		ctr_kirim: string;
	}

	const COLS = [
		{ key: 'kode', label: 'Kode' },
		{ key: 'tgl_entri', label: 'Tgl Entri' },
		{ key: 'penerima', label: 'Penerima' },
		{ key: 'tipe_penerima', label: 'Tipe Penerima' },
		{ key: 'pesan', label: 'Pesan' },
		{ key: 'status', label: 'Status' },
		{ key: 'tgl_status', label: 'Tgl Status' },
		{ key: 'kode_inbox', label: 'Kode Inbox' },
		{ key: 'kode_transaksi', label: 'Kode Transaksi' },
		{ key: 'kode_reseller', label: 'Kode Reseller' },
		{ key: 'bebas_biaya', label: 'Bebas Biaya' },
		{ key: 'is_perintah', label: 'Perintah' },
		{ key: 'kode_modul', label: 'Kode Modul' },
		{ key: 'prioritas', label: 'Prioritas' },
		{ key: 'modul_proses', label: 'Modul Proses' },
		{ key: 'pengirim', label: 'Pengirim' },
		{ key: 'kode_terminal', label: 'Kode Terminal' },
		{ key: 'ctr_kirim', label: 'Ctr Kirim' }
	];

	const TIPES = ['SMS', 'Whatsapp', 'Telegram', 'API', 'Web'];
	const TERMINALS = ['T001', 'T002', 'T003', 'T004', 'T005'];
	const RESELLERS = ['R001', 'R002', 'R003', '-'];
	const MODULS = ['MOD-SMS', 'MOD-WA', 'MOD-API', 'MOD-CRM'];
	const PRIORITAS = ['Tinggi', 'Sedang', 'Rendah'];

	const outbox: OutboxMsg[] = [];
	for (let i = 0; i < 48; i++) {
		const day = String(Math.max(1, 9 - Math.floor(i / 6))).padStart(2, '0');
		const hh = String(8 + ((i * 2) % 12)).padStart(2, '0');
		const mm = String((i * 13) % 60).padStart(2, '0');
		const st = i % 5 === 0 ? 'Gagal' : i % 4 === 0 ? 'Pending' : 'Terkirim';
		const pri = PRIORITAS[i % PRIORITAS.length];
		const isPerintah = i % 4 === 0 ? 'Ya' : 'Tidak';
		outbox.push({
			kode: 'OUT-202609' + day + '-' + String(i + 1).padStart(3, '0'),
			tgl_entri: `${day} Sep, ${hh}:${mm}`,
			penerima: ['0812XXXX' + (3000 + i), 'User-' + (100 + i), 'CS-Regional'][i % 3],
			tipe_penerima: TIPES[i % TIPES.length],
			pesan: `Balasan contoh ${i + 1} terkait layanan ${['tagihan', 'pengiriman', 'akun', 'promo', 'konsultasi'][i % 5]}.`,
			status: st,
			tgl_status: `${day} Sep, ${hh}:${String((+mm + 5) % 60).padStart(2, '0')}`,
			kode_inbox: 'IN-202609' + day + '-' + String(i + 1).padStart(3, '0'),
			kode_transaksi: 'TRX-' + (91000 + i),
			kode_reseller: RESELLERS[i % RESELLERS.length],
			bebas_biaya: i % 5 === 0 ? 'Ya' : 'Tidak',
			is_perintah: isPerintah,
			kode_modul: MODULS[i % MODULS.length],
			prioritas: pri,
			modul_proses: isPerintah === 'Ya' ? 'Diproses' : '-',
			pengirim: 'Pandora',
			kode_terminal: TERMINALS[i % TERMINALS.length],
			ctr_kirim: String((i % 5) + 1)
		});
	}

	const statusOptions = $derived(['all', ...new Set(outbox.map((r) => r.status))]);
	const tipeOptions = ['all', ...TIPES];

	const filteredData = $derived(() => {
		let rows = outbox.filter((r) => {
			if (dateStart && r.tgl_entri.replace(/(\d{2}) Sep.*/, '2026-09-$1') < dateStart) return false;
			if (dateEnd && r.tgl_entri.replace(/(\d{2}) Sep.*/, '2026-09-$1') > dateEnd) return false;
			if (resellerInput && !r.kode_reseller.toLowerCase().includes(resellerInput.toLowerCase()))
				return false;
			if (penerimaInput && !r.penerima.toLowerCase().includes(penerimaInput.toLowerCase()))
				return false;
			if (tipeFilter !== 'all' && r.tipe_penerima !== tipeFilter) return false;
			if (statusFilter !== 'all' && r.status !== statusFilter) return false;
			if (pesanInput && !r.pesan.toLowerCase().includes(pesanInput.toLowerCase())) return false;
			if (replyReseller && r.bebas_biaya !== 'Ya') return false;
			if (perintahProvider && r.is_perintah !== 'Ya') return false;
			return true;
		});
		const limit = parseInt(limitVal) || rows.length;
		if (rows.length > limit) rows = rows.slice(0, limit);
		rows.sort((a, b) => {
			const av = String(a[sortKey as keyof OutboxMsg] ?? '');
			const bv = String(b[sortKey as keyof OutboxMsg] ?? '');
			return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
		});
		return rows;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredData().length / PER_PAGE)));
	const pagedData = $derived(() => filteredData().slice((page - 1) * PER_PAGE, page * PER_PAGE));
	const activeFilters = $derived(() => {
		let c = 0;
		if (dateStart) c++;
		if (dateEnd) c++;
		if (resellerInput) c++;
		if (penerimaInput) c++;
		if (tipeFilter !== 'all') c++;
		if (statusFilter !== 'all') c++;
		if (pesanInput) c++;
		if (replyReseller) c++;
		if (perintahProvider) c++;
		return c;
	});

	function resetFilters() {
		dateStart = '';
		dateEnd = '';
		limitVal = '24';
		resellerInput = '';
		penerimaInput = '';
		tipeFilter = 'all';
		statusFilter = 'all';
		pesanInput = '';
		replyReseller = false;
		perintahProvider = false;
		page = 1;
	}

	function statusBadge(s: string) {
		if (s === 'Gagal') return 'bg-[#fee2e2] text-[#b91c1c]';
		if (s === 'Pending') return 'bg-[#fef3c7] text-[#b45309]';
		return 'bg-[#ecfdf3] text-[#167a4a]';
	}
	function priBadge(p: string) {
		if (p === 'Tinggi') return 'bg-[#fee2e2] text-[#b91c1c]';
		if (p === 'Sedang') return 'bg-[#fef3c7] text-[#92400e]';
		return 'bg-[#ecfdf3] text-[#167a4a]';
	}

	function toggleSort(key: string) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = key;
			sortDir = 'desc';
		}
	}
	function goPage(p: number) {
		if (p >= 1 && p <= totalPages) page = p;
	}
	function arrow(key: string) {
		return sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
	}
	function triggerReset() {
		page = 1;
	}
</script>

<svelte:head><title>Outbox — Pandora</title></svelte:head>

<main class="mx-auto max-w-375 p-7">
	<div class="mb-5 flex items-end justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Kotak Keluar</h1>
			<p class="mt-0.5 text-[13px] text-[#5b6b60]">Pesan terkirim dari sistem.</p>
		</div>
		<div class="flex items-center gap-3">
			{#if activeFilters() > 0}
				<button
					onclick={resetFilters}
					class="rounded-lg border border-[#fee2e2] bg-[#fef2f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] transition-colors hover:bg-red-100"
				>
					Reset ({activeFilters()})
				</button>
			{/if}
			<button
				onclick={() => (showFilter = !showFilter)}
				class="flex items-center gap-2 rounded-lg border border-[#dfe4df] bg-white px-3 py-1.5 text-xs font-medium text-[#5b6b60] transition-colors hover:border-[#0e7a4a] hover:text-[#0e7a4a]"
			>
				<svg
					class="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					><path
						d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
					/></svg
				>
				{showFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
			</button>
			<span class="rounded-full border border-[#dfe4df] bg-white px-2.5 py-1 text-xs text-[#89968d]"
				>{filteredData().length} pesan</span
			>
		</div>
	</div>

	{#if showFilter}
		<div class="mb-5 rounded-xl border border-[#dfe4df] bg-white p-5">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-[13px] font-semibold text-[#14211b]">Filter Lanjutan</h3>
				{#if activeFilters() > 0}
					<button
						onclick={resetFilters}
						class="text-[12px] font-medium text-[#b91c1c] hover:underline">Reset semua</button
					>
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
				<div>
					<label
						for="f-tgl-start"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Tgl Mulai</label
					>
					<input
						id="f-tgl-start"
						type="date"
						bind:value={dateStart}
						oninput={triggerReset}
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] transition-colors outline-none focus:border-[#0e7a4a]"
					/>
				</div>
				<div>
					<label
						for="f-tgl-end"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Tgl Akhir</label
					>
					<input
						id="f-tgl-end"
						type="date"
						bind:value={dateEnd}
						oninput={triggerReset}
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] transition-colors outline-none focus:border-[#0e7a4a]"
					/>
				</div>
				<div>
					<label
						for="f-limit"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Limit</label
					>
					<input
						id="f-limit"
						type="number"
						min="1"
						max="500"
						bind:value={limitVal}
						oninput={triggerReset}
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] transition-colors outline-none focus:border-[#0e7a4a]"
					/>
				</div>
				<div>
					<label
						for="f-reseller"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Reseller</label
					>
					<input
						id="f-reseller"
						type="text"
						bind:value={resellerInput}
						oninput={triggerReset}
						placeholder="Cari kode reseller..."
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] placeholder-[#89968d] transition-colors outline-none focus:border-[#0e7a4a]"
					/>
				</div>
				<div>
					<label
						for="f-penerima"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Penerima</label
					>
					<input
						id="f-penerima"
						type="text"
						bind:value={penerimaInput}
						oninput={triggerReset}
						placeholder="Cari penerima..."
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] placeholder-[#89968d] transition-colors outline-none focus:border-[#0e7a4a]"
					/>
				</div>
				<div>
					<label
						for="f-tipe"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Tipe</label
					>
					<select
						id="f-tipe"
						bind:value={tipeFilter}
						onchange={triggerReset}
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] outline-none focus:border-[#0e7a4a]"
					>
						{#each tipeOptions as t (t)}<option value={t}>{t === 'all' ? 'Semua' : t}</option
							>{/each}
					</select>
				</div>
				<div>
					<label
						for="f-status"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Status</label
					>
					<select
						id="f-status"
						bind:value={statusFilter}
						onchange={triggerReset}
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] outline-none focus:border-[#0e7a4a]"
					>
						{#each statusOptions as s (s)}<option value={s}>{s === 'all' ? 'Semua' : s}</option
							>{/each}
					</select>
				</div>
				<div>
					<label
						for="f-pesan"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-[#5b6b60] uppercase"
						>Pesan</label
					>
					<input
						id="f-pesan"
						type="text"
						bind:value={pesanInput}
						oninput={triggerReset}
						placeholder="Cari isi pesan..."
						class="h-9 w-full rounded-lg border border-[#dfe4df] bg-white px-2.5 text-[13px] text-[#14211b] placeholder-[#89968d] transition-colors outline-none focus:border-[#0e7a4a]"
					/>
				</div>
			</div>
			<div class="mt-4 flex flex-wrap items-center gap-6 border-t border-[#dfe4df] pt-4">
				<label class="flex cursor-pointer items-center gap-2 text-[13px] text-[#5b6b60]">
					<input
						type="checkbox"
						bind:checked={replyReseller}
						onchange={triggerReset}
						class="h-4 w-4 rounded border-[#dfe4df] accent-[#0e7a4a]"
					/>
					Reply ke Reseller
				</label>
				<label class="flex cursor-pointer items-center gap-2 text-[13px] text-[#5b6b60]">
					<input
						type="checkbox"
						bind:checked={perintahProvider}
						onchange={triggerReset}
						class="h-4 w-4 rounded border-[#dfe4df] accent-[#0e7a4a]"
					/>
					Perintah Provider
				</label>
			</div>
		</div>
	{/if}

	<div class="overflow-hidden rounded-xl border border-[#dfe4df] bg-white">
		<div class="max-h-140 overflow-auto">
			<table class="w-full border-collapse">
				<thead>
					<tr>
						{#each COLS as c (c.key)}
							<th
								onclick={() => toggleSort(c.key)}
								class="sticky top-0 cursor-pointer border-b border-[#dfe4df] bg-[#fafafa] px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-[#89968d] uppercase transition-colors select-none hover:text-[#0e7a4a]"
								>{c.label}<span class="text-[10px] text-[#0e7a4a]">{arrow(c.key)}</span></th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each pagedData() as msg (msg.kode)}
						<tr class="transition-colors hover:bg-[#eef6f0]">
							<td
								class="max-w-50 overflow-hidden border-b border-[#dfe4df] px-3.5 py-3 text-[11px] font-semibold text-ellipsis whitespace-nowrap"
								style="font-family: ui-monospace, monospace">{msg.kode}</td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px] whitespace-nowrap text-[#89968d]"
								>{msg.tgl_entri}</td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px] font-semibold whitespace-nowrap"
								>{msg.penerima}</td
							>
							<td class="border-b border-[#dfe4df] px-3.5 py-3"
								><span
									class="inline-block rounded bg-[#f1f4f1] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-[#5b6b60]"
									>{msg.tipe_penerima}</span
								></td
							>
							<td
								class="max-w-65 overflow-hidden border-b border-[#dfe4df] px-3.5 py-3 text-[12px] text-ellipsis whitespace-nowrap text-[#89968d]"
								title={msg.pesan}
								>{msg.pesan.length > 34 ? msg.pesan.slice(0, 34) + '…' : msg.pesan}</td
							>
							<td class="border-b border-[#dfe4df] px-3.5 py-3"
								><span
									class="inline-block rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap {statusBadge(
										msg.status
									)}">{msg.status}</span
								></td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px] whitespace-nowrap text-[#89968d]"
								>{msg.tgl_status}</td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[11px] whitespace-nowrap"
								style="font-family: ui-monospace, monospace">{msg.kode_inbox}</td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[11px] whitespace-nowrap"
								style="font-family: ui-monospace, monospace">{msg.kode_transaksi}</td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[11px] whitespace-nowrap"
								style="font-family: ui-monospace, monospace">{msg.kode_reseller}</td
							>
							<td class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px]">{msg.bebas_biaya}</td>
							<td class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px]">{msg.is_perintah}</td>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[11px] whitespace-nowrap"
								style="font-family: ui-monospace, monospace">{msg.kode_modul}</td
							>
							<td class="border-b border-[#dfe4df] px-3.5 py-3"
								><span
									class="inline-block rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap {priBadge(
										msg.prioritas
									)}">{msg.prioritas}</span
								></td
							>
							<td class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px] whitespace-nowrap"
								>{msg.modul_proses}</td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px] font-semibold whitespace-nowrap"
								>{msg.pengirim}</td
							>
							<td
								class="border-b border-[#dfe4df] px-3.5 py-3 text-[11px] whitespace-nowrap"
								style="font-family: ui-monospace, monospace">{msg.kode_terminal}</td
							>
							<td class="border-b border-[#dfe4df] px-3.5 py-3 text-[12px]">{msg.ctr_kirim}</td>
						</tr>
					{:else}
						<tr
							><td colspan={COLS.length} class="py-16 text-center text-sm text-[#89968d]"
								>Tidak ada pesan yang cocok dengan filter.</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="flex items-center justify-between border-t border-[#dfe4df] px-5 py-3.5">
			<span class="text-[12px] text-[#5b6b60]"
				>{filteredData().length} pesan — hal {page} dari {totalPages}</span
			>
			<div class="flex flex-wrap gap-1.5">
				<button
					onclick={() => goPage(page - 1)}
					disabled={page <= 1}
					class="flex h-8 min-w-8 items-center justify-center rounded-md border border-[#dfe4df] bg-white px-2 text-xs font-medium text-[#5b6b60] transition-colors hover:border-[#0e7a4a] hover:text-[#0e7a4a] disabled:cursor-not-allowed disabled:opacity-40"
					>&lsaquo;</button
				>
				{#each Array.from({ length: totalPages }, (_, index) => index) as i (i)}
					<button
						onclick={() => goPage(i + 1)}
						class="flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors {page ===
						i + 1
							? 'border-[#0e7a4a] bg-[#0e7a4a] text-white'
							: 'border-[#dfe4df] bg-white text-[#5b6b60] hover:border-[#0e7a4a] hover:text-[#0e7a4a]'}"
						>{i + 1}</button
					>
				{/each}
				<button
					onclick={() => goPage(page + 1)}
					disabled={page >= totalPages}
					class="flex h-8 min-w-8 items-center justify-center rounded-md border border-[#dfe4df] bg-white px-2 text-xs font-medium text-[#5b6b60] transition-colors hover:border-[#0e7a4a] hover:text-[#0e7a4a] disabled:cursor-not-allowed disabled:opacity-40"
					>&rsaquo;</button
				>
			</div>
		</div>
	</div>
</main>
