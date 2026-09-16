<script lang="ts">
	import { APP_NAME, INBOX_STATUS } from '$lib/config';
	import type { InboxItem } from '$lib/types';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page, navigating } from '$app/state';
	import { ChevronLeft, ChevronRight, SlidersHorizontal } from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	let { data } = $props();

	const loading = $derived(navigating.type !== null);

	const STACK_KEY = 'pandora-inbox-cursor-stack';

	function initStack(): (number | null)[] {
		try {
			const raw = sessionStorage.getItem(STACK_KEY);
			if (raw) {
				const saved: unknown = JSON.parse(raw);
				if (Array.isArray(saved) && saved.every((x) => x === null || typeof x === 'number')) {
					return saved as (number | null)[];
				}
			}
		} catch {
			// corrupt -> mulai dari halaman pertama
		}
		return [null];
	}

	let cursorStack = $state<(number | null)[]>(initStack());

	function saveStack() {
		if (cursorStack.length === 1 && cursorStack[0] === null) {
			sessionStorage.removeItem(STACK_KEY);
		} else {
			sessionStorage.setItem(STACK_KEY, JSON.stringify(cursorStack));
		}
	}

	let showFilter = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(min-width: 768px)');
		showFilter = mq.matches;
		mq.addEventListener('change', () => (showFilter = mq.matches));
		return () => mq.removeEventListener('change', () => (showFilter = mq.matches));
	});

	function initQuery(key: string): string {
		return page.url.searchParams.get(key) ?? '';
	}

	let startDate = $state(initQuery('startDate'));
	let endDate = $state(initQuery('endDate'));
	let itemsPerPage = $state(initQuery('limit'));
	let pageSizeValue = $state(initQuery('pageSize'));
	let terminalFilter = $state(initQuery('terminal'));
	let resellerInput = $state(initQuery('reseller'));
	let pengirimInput = $state(initQuery('pengirim'));
	let tipeFilter = $state(initQuery('tipe'));
	let statusFilter = $state(initQuery('status'));
	let pesanInput = $state(initQuery('pesan'));
	let reqReseller = $state(initQuery('requestFromReseller') === 'true');
	let jawabanProvider = $state(initQuery('jawabanFromProvider') === 'true');

	const COLS = [
		{ key: 'kode', label: 'Kode' },
		{ key: 'tgl_entri', label: 'Tgl Entri' },
		{ key: 'tgl_status', label: 'Tgl Status' },
		{ key: 'pengirim', label: 'Pengirim' },
		{ key: 'tipe_pengirim', label: 'Tipe Pengirim' },
		{ key: 'pesan', label: 'Pesan' },
		{ key: 'status', label: 'Status' },
		{ key: 'kode_reseller', label: 'Kode Reseller' },
		{ key: 'kode_transaksi', label: 'Kode Transaksi' },
		{ key: 'is_jawaban', label: 'Jawaban' },
		{ key: 'hash', label: 'Hash' }
	];

	function uniqueTipes(rows: InboxItem[]): string[] {
		return ['', ...new Set(rows.map((r) => r.tipe_pengirim))];
	}
	const terminalOptions = ['', '1', '2', '3', '4', '5'];

	const skeletonRows = $derived(
		Array.from({ length: Number(pageSizeValue) || 10 }, (_, i) => i)
	);
	const skeletonWidths = [48, 84, 84, 100, 52, 180, 56, 80, 96, 56, 120];

	type InboxUrl = '/inbox' | `/inbox?${string}`;

	function buildQuery(cursor: number | null): URLSearchParams {
		const u = new SvelteURLSearchParams();
		if (cursor !== null) u.set('cursor', String(cursor));
		if (startDate) u.set('startDate', startDate);
		if (endDate) u.set('endDate', endDate);
		if (itemsPerPage) u.set('limit', itemsPerPage);
		if (pageSizeValue) u.set('pageSize', pageSizeValue);
		if (terminalFilter) u.set('terminal', terminalFilter);
		if (resellerInput) u.set('reseller', resellerInput);
		if (pengirimInput) u.set('pengirim', pengirimInput);
		if (tipeFilter) u.set('tipe', tipeFilter);
		if (statusFilter) u.set('status', statusFilter);
		if (pesanInput) u.set('pesan', pesanInput);
		if (reqReseller) u.set('requestFromReseller', 'true');
		if (jawabanProvider) u.set('jawabanFromProvider', 'true');
		return u;
	}

	function urlFor(cursor: number | null): InboxUrl {
		const qs = buildQuery(cursor).toString();
		return qs ? `/inbox?${qs}` : '/inbox';
	}

	const SCROLL_KEY = 'pandora-inbox-scroll';

	function saveScroll() {
		const el = document.getElementById('app-scroll');
		if (el) sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop));
	}

	function restoreScroll() {
		const el = document.getElementById('app-scroll');
		const pos = Number(sessionStorage.getItem(SCROLL_KEY) ?? 0);
		if (!el || !pos) return;
		requestAnimationFrame(() => {
			el.scrollTop = pos;
			setTimeout(() => (el.scrollTop = pos), 80);
		});
	}

	afterNavigate(restoreScroll);

	function goNext(meta: { has_next_page: boolean; next_cursor: number | null }) {
		if (!meta.has_next_page) return;
		saveScroll();
		cursorStack.push(meta.next_cursor);
		saveStack();
		goto(resolve(urlFor(meta.next_cursor)));
	}

	function goPrev(meta: { has_prev_page: boolean }) {
		if (!meta.has_prev_page) return;
		saveScroll();
		cursorStack.pop();
		const prev = cursorStack[cursorStack.length - 1] ?? null;
		saveStack();
		goto(resolve(urlFor(prev)));
	}

	function applyFilter() {
		cursorStack = [null];
		saveStack();
		goto(resolve(urlFor(null)));
	}

	function resetFilters() {
		startDate = '';
		endDate = '';
		itemsPerPage = '';
		pageSizeValue = '';
		terminalFilter = '';
		resellerInput = '';
		pengirimInput = '';
		tipeFilter = '';
		statusFilter = '';
		pesanInput = '';
		reqReseller = false;
		jawabanProvider = false;
		cursorStack = [null];
		saveStack();
		goto(resolve('/inbox'));
	}

	function is401(err: unknown): boolean {
		return typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 401;
	}
</script>

<svelte:head><title>Inbox — {APP_NAME}</title></svelte:head>

<main class="mx-auto flex min-h-full w-full max-w-375 flex-col px-4 py-4 sm:px-7 md:h-full">
	<div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Kotak Masuk</h1>
			<p class="mt-0.5 text-[13px] text-(--c-fg-muted)">Pesan masuk dari sistem.</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<button
				onclick={() => (showFilter = !showFilter)}
				class="flex items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 py-1.5 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent)"
			>
				<SlidersHorizontal class="h-3.5 w-3.5" />
				{showFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
			</button>
		</div>
	</div>

	{#if showFilter}
		<div class="mb-5 rounded-xl border border-(--c-border) bg-(--c-surface) p-5">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-[13px] font-semibold text-(--c-fg)">Filter</h3>
				<button
					onclick={resetFilters}
					class="text-[12px] font-medium text-(--c-danger) hover:underline">Reset semua</button
				>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
				<div>
					<label
						for="fs-start"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Tgl Mulai</label
					>
					<input
						id="fs-start"
						type="date"
						bind:value={startDate}
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					/>
				</div>
				<div>
					<label
						for="fs-end"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Tgl Akhir</label
					>
					<input
						id="fs-end"
						type="date"
						bind:value={endDate}
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					/>
				</div>
				<div>
					<label
						for="fs-limit"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Limit</label
					>
					<input
						id="fs-limit"
						type="number"
						min="1"
						bind:value={itemsPerPage}
						placeholder="Jumlah per halaman"
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					/>
				</div>
				<div>
					<label
						for="fs-terminal"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Terminal</label
					>
					<select
						id="fs-terminal"
						bind:value={terminalFilter}
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					>
						{#each terminalOptions as t (t)}
							<option value={t}>{t === '' ? 'Semua' : t}</option>
						{/each}
					</select>
				</div>
				<div>
					<label
						for="fs-reseller"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Reseller</label
					>
					<select
						id="fs-reseller"
						bind:value={resellerInput}
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					>
						<option value="">Semua</option>
						{#await data.resellers}
							<option value="">Memuat…</option>
						{:then res}
							{#each res.data.items as r (r.kode)}
								<option value={r.kode}>{r.kode} — {r.nama}</option>
							{/each}
						{/await}
					</select>
				</div>
				<div>
					<label
						for="fs-pengirim"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Pengirim</label
					>
					<input
						id="fs-pengirim"
						type="text"
						bind:value={pengirimInput}
						placeholder="Cari pengirim…"
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					/>
				</div>
				<div>
					<label
						for="fs-tipe"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Tipe</label
					>
					<select
						id="fs-tipe"
						bind:value={tipeFilter}
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					>
						<option value="">Semua</option>
						{#await data.inbox}
							<option value="">Memuat…</option>
						{:then d}
							{#each uniqueTipes(d.data.items) as t (t)}
								<option value={t}>{t === '' ? 'Semua' : t}</option>
							{/each}
						{/await}
					</select>
				</div>
				<div>
					<label
						for="fs-status"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Status</label
					>
					<select
						id="fs-status"
						bind:value={statusFilter}
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					>
						<option value="">Semua</option>
						{#each Object.entries(INBOX_STATUS) as [val, label] (val)}
							<option value={val}>{label} ({val})</option>
						{/each}
					</select>
				</div>
				<div>
					<label
						for="fs-pesan"
						class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Pesan</label
					>
					<input
						id="fs-pesan"
						type="text"
						bind:value={pesanInput}
						placeholder="Isi pesan…"
						class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					/>
				</div>
			</div>
			<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--c-border) pt-4">
				<div class="flex flex-wrap items-center gap-6">
					<label class="flex cursor-pointer items-center gap-2 text-[13px] text-(--c-fg-muted)">
						<input
							type="checkbox"
							bind:checked={reqReseller}
							class="h-4 w-4 rounded border-(--c-border) accent-(--c-accent)"
						/>
						Request dari Reseller
					</label>
					<label class="flex cursor-pointer items-center gap-2 text-[13px] text-(--c-fg-muted)">
						<input
							type="checkbox"
							bind:checked={jawabanProvider}
							class="h-4 w-4 rounded border-(--c-border) accent-(--c-accent)"
						/>
						Jawaban dari Provider
					</label>
				</div>
				<button
					onclick={applyFilter}
					class="rounded-lg bg-(--c-accent) px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:opacity-90"
				>
					Terapkan Filter
				</button>
			</div>
		</div>
	{/if}

	{#await data.inbox}
		<div class="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-(--c-border) bg-(--c-surface)">
			<div class="min-h-0 flex-1 overflow-auto">
				<table class="w-full border-collapse">
					<thead>
						<tr>
							{#each COLS as c (c.key)}
								<th
									class="sticky top-0 border-b border-(--c-border) bg-(--c-table-head) px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-(--c-fg-soft) uppercase select-none"
									>{c.label}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each skeletonRows as r (r)}
							<tr class="animate-pulse border-b border-(--c-border)">
								{#each skeletonWidths as w, ci (ci)}
									<td class="border-b border-(--c-border) px-3.5 py-3">
										<div class="h-3.5 rounded bg-(--c-surface-2)" style="width: {w}px"></div>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-(--c-border) bg-(--c-surface) px-5 py-3.5">
				<span class="text-[12px] text-(--c-fg-muted)">Memuat data…</span>
				<div class="flex items-center gap-1.5">
					<button
						disabled
						class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) opacity-40"
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<button
						disabled
						class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) opacity-40"
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{:then d}
		<div class="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-(--c-border) bg-(--c-surface)">
			<div class="min-h-0 flex-1 overflow-auto">
				<table class="w-full border-collapse">
					<thead>
						<tr>
							{#each COLS as c (c.key)}
								<th
									class="sticky top-0 border-b border-(--c-border) bg-(--c-table-head) px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-(--c-fg-soft) uppercase select-none"
									>{c.label}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each d.data.items as msg (msg.kode)}
							<tr class="transition-colors hover:bg-(--c-row-hover)">
								<td
									class="max-w-50 overflow-hidden border-b border-(--c-border) px-3.5 py-3 text-[11px] font-semibold text-ellipsis whitespace-nowrap"
									style="font-family: ui-monospace, monospace">{msg.kode}</td
								>
								<td
									class="border-b border-(--c-border) px-3.5 py-3 text-[12px] whitespace-nowrap text-(--c-fg-soft)"
									>{msg.tgl_entri}</td
								>
								<td
									class="border-b border-(--c-border) px-3.5 py-3 text-[12px] whitespace-nowrap text-(--c-fg-soft)"
									>{msg.tgl_status}</td
								>
								<td
									class="max-w-35 overflow-hidden border-b border-(--c-border) px-3.5 py-3 text-[12px] font-semibold text-ellipsis whitespace-nowrap"
									>{msg.pengirim}</td
								>
								<td class="border-b border-(--c-border) px-3.5 py-3"
									><span
										class="inline-block rounded bg-(--c-surface-2) px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-(--c-fg-muted)"
										>{msg.tipe_pengirim}</span
									></td
								>
								<td
									class="max-w-65 overflow-hidden border-b border-(--c-border) px-3.5 py-3 text-[12px] text-ellipsis whitespace-nowrap text-(--c-fg-soft)"
									title={msg.pesan}
									>{msg.pesan.length > 34 ? msg.pesan.slice(0, 34) + '…' : msg.pesan}</td
								>
								<td class="border-b border-(--c-border) px-3.5 py-3 text-[12px]">{msg.status}</td>
								<td
									class="border-b border-(--c-border) px-3.5 py-3 text-[11px] whitespace-nowrap"
									style="font-family: ui-monospace, monospace">{msg.kode_reseller}</td
								>
								<td
									class="border-b border-(--c-border) px-3.5 py-3 text-[11px] whitespace-nowrap"
									style="font-family: ui-monospace, monospace">{msg.kode_transaksi}</td
								>
								<td class="border-b border-(--c-border) px-3.5 py-3 text-[12px]">{msg.is_jawaban}</td>
								<td
									class="max-w-40 overflow-hidden border-b border-(--c-border) px-3.5 py-3 text-[11px] text-ellipsis whitespace-nowrap text-(--c-fg-soft)"
									style="font-family: ui-monospace, monospace"
									title={msg.hash}
									>{msg.hash.length > 26 ? msg.hash.slice(0, 26) + '…' : msg.hash}</td
								>
							</tr>
						{:else}
							<tr
								><td colspan={COLS.length} class="py-16 text-center text-sm text-(--c-fg-soft)"
									>Tidak ada pesan.</td
								></tr
							>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-(--c-border) bg-(--c-surface) px-5 py-3.5">
				<div class="flex items-center gap-3">
					<label class="flex items-center gap-2 text-[12px] text-(--c-fg-muted)">
						Baris/halaman
						<select
							bind:value={pageSizeValue}
							onchange={applyFilter}
							class="h-8 rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs text-(--c-fg) outline-none focus:border-(--c-accent)"
						>
							<option value="">10</option>
							<option value="25">25</option>
							<option value="50">50</option>
							<option value="100">100</option>
						</select>
					</label>
				</div>
				<div class="flex items-center gap-1.5">
					<button
						onclick={() => goPrev(d.data.meta)}
						disabled={!d.data.meta.has_prev_page}
						class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<button
						onclick={() => goNext(d.data.meta)}
						disabled={!d.data.meta.has_next_page}
						class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{:catch err}
		<div class="flex flex-1 items-center justify-center rounded-xl border border-(--c-border) bg-(--c-surface)">
			<div class="text-center">
				<p class="text-[14px] font-semibold text-(--c-fg)">
					{is401(err) ? 'Sesi berakhir' : 'Gagal memuat data'}
				</p>
				{#if !is401(err)}
					<p class="mt-1 text-[12px] text-(--c-fg-muted)">Silakan coba lagi.</p>
					<button
						onclick={() => goto(resolve('/inbox'))}
						class="mt-3 rounded-lg border border-(--c-border) px-4 py-1.5 text-xs font-medium text-(--c-fg) transition-colors hover:border-(--c-accent)"
					>
						Muat ulang
					</button>
				{/if}
			</div>
		</div>
	{/await}
</main>