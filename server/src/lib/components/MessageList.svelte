<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { appBusy } from '$lib/appBusy.svelte.js';
	import { INBOX_STATUS, KODE_TERMINAL } from '$lib/config';
	import type { InboxItem, OutboxItem, ResellerResponse } from '$lib/types';
	import { ChevronLeft, ChevronRight, SlidersHorizontal } from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { untrack } from 'svelte';

	export type ColSpec = {
		key: string;
		label: string;
		mono?: boolean;
		badge?: boolean;
		strong?: boolean;
		muted?: boolean;
		trunc?: boolean;
		date?: boolean;
		status?: boolean;
		maxWidth?: number;
	};

	export type FilterField =
		| { type: 'date'; param: string; label: string }
		| { type: 'text'; param: string; label: string; placeholder?: string }
		| { type: 'number'; param: string; label: string; placeholder?: string }
		| { type: 'terminal'; param: string; label: string }
		| { type: 'status'; param: string; label: string }
		| { type: 'tipe'; param: string; label: string; source: Record<string, string> }
		| { type: 'reseller'; param: string; label: string }
		| { type: 'checkbox'; param: string; label: string };

	type MessageItem = InboxItem | OutboxItem;

	type MessagePage = {
		data: {
			items: MessageItem[];
			meta: { has_next_page: boolean; has_prev_page: boolean; next_cursor: number | null };
		};
	};

	let {
		load,
		resellers,
		path,
		title,
		subtitle,
		cols,
		filters,
		skeletonWidths,
		stackKey
	}: {
		load: Promise<MessagePage>;
		resellers: Promise<ResellerResponse>;
		path: '/inbox' | '/outbox';
		title: string;
		subtitle: string;
		cols: ColSpec[];
		filters: FilterField[];
		skeletonWidths: number[];
		stackKey: string;
	} = $props();

	function initStack(stackKey: string): (number | null)[] {
		try {
			const raw = sessionStorage.getItem(stackKey);
			if (raw) {
				const saved: unknown = JSON.parse(raw);
				if (Array.isArray(saved) && saved.every((x) => x === null || typeof x === 'number')) {
					return saved as (number | null)[];
				}
			}
		} catch {
			// korup -> mulai dari halaman pertama
		}
		return [null];
	}

	let cursorStack = $state<(number | null)[]>(untrack(() => initStack(stackKey)));

	function saveStack() {
		if (cursorStack.length === 1 && cursorStack[0] === null) {
			sessionStorage.removeItem(stackKey);
		} else {
			sessionStorage.setItem(stackKey, JSON.stringify(cursorStack));
		}
	}

	let query = $state<Record<string, string>>({});

	$effect(() => {
		const params = page.url.searchParams;
		const fresh: Record<string, string> = {};
		for (const f of filters) {
			fresh[f.param] = '';
			const v = params.get(f.param);
			if (f.type === 'checkbox' ? v === 'true' : v) fresh[f.param] = v as string;
		}
		query = fresh;
	});
	let showFilter = $state(false);

	let dataReady = $state(false);

	$effect(() => {
		dataReady = false;
		const p = load;
		p.then(
			() => (dataReady = true),
			() => (dataReady = true)
		);
	});

	$effect(() => {
		appBusy.value = !dataReady;
	});

	const controlsDisabled = $derived(!dataReady || navigating.type !== null);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(min-width: 768px)');
		showFilter = mq.matches;
		const onChange = () => (showFilter = mq.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const scrollKey = $derived(stackKey.replace('-cursor-stack', '-scroll'));

	function saveScroll() {
		const el = document.getElementById('app-scroll');
		if (el) sessionStorage.setItem(scrollKey, String(el.scrollTop));
	}

	function restoreScroll() {
		const el = document.getElementById('app-scroll');
		const pos = Number(sessionStorage.getItem(scrollKey) ?? 0);
		if (!el || !pos) return;
		requestAnimationFrame(() => {
			el.scrollTop = pos;
			setTimeout(() => (el.scrollTop = pos), 80);
		});
	}

	afterNavigate(restoreScroll);

	const statusOptions = Object.entries(INBOX_STATUS);
	const limitN = $derived(Number(query['limit']));
	const pageSizeN = $derived(Number(query['pageSize']));
	const skeletonCount = $derived(Math.min(limitN || pageSizeN || 10, pageSizeN || limitN || 10));
	const skeletonRows = $derived(Array.from({ length: skeletonCount }, (_, i) => i));

	type PageUrl = '/inbox' | '/outbox' | `/inbox?${string}` | `/outbox?${string}`;

	function buildQuery(cursor: number | null): URLSearchParams {
		const u = new SvelteURLSearchParams();
		if (cursor !== null) u.set('cursor', String(cursor));
		for (const [k, v] of Object.entries(query)) {
			if (v === '') continue;
			if ((k === 'limit' || k === 'pageSize') && !(Number(v) > 0)) continue;
			u.set(k, v);
		}
		return u;
	}

	function urlFor(cursor: number | null): PageUrl {
		const qs = buildQuery(cursor).toString();
		return qs ? (`${path}?${qs}` as PageUrl) : path;
	}

	function goNext(meta: { has_next_page: boolean; next_cursor: number | null }) {
		if (!meta.has_next_page || navigating.type !== null) return;
		saveScroll();
		cursorStack.push(meta.next_cursor);
		saveStack();
		goto(resolve(urlFor(meta.next_cursor)));
	}

	function goPrev(meta: { has_prev_page: boolean }) {
		if (!meta.has_prev_page || navigating.type !== null) return;
		saveScroll();
		cursorStack.pop();
		const prev = cursorStack[cursorStack.length - 1] ?? null;
		saveStack();
		goto(resolve(urlFor(prev)));
	}

	function applyFilter() {
		if (navigating.type !== null) return;
		cursorStack = [null];
		saveStack();
		goto(resolve(urlFor(null)));
	}

	function resetFilters() {
		query = {};
		cursorStack = [null];
		saveStack();
		goto(resolve(path));
	}

	function is401(err: unknown): boolean {
		return (
			typeof err === 'object' &&
			err !== null &&
			'status' in err &&
			(err as { status: number }).status === 401
		);
	}

	function cellClass(c: ColSpec): string {
		let cls = 'border-b border-(--c-border) px-3.5 py-3';
		cls += c.mono ? ' font-mono text-[11px] whitespace-nowrap' : ' text-[12px]';
		if (c.strong) cls += ' font-semibold';
		if (c.muted) cls += ' text-(--c-fg-soft)';
		if (c.trunc) cls += ' truncate';
		return cls;
	}

	type FooterMeta = { has_next_page: boolean; has_prev_page: boolean; next_cursor: number | null };

	function cellText(raw: string | number | undefined, c: ColSpec): string {
		if (raw === null || raw === undefined) return '-';
		const s = String(raw);
		return c.trunc && s.length > 24 ? s.slice(0, 24) + '…' : s;
	}

	function formatDate(raw: string | number | undefined): string {
		if (raw === null || raw === undefined) return '-';
		if (typeof raw === 'string' && raw.includes('T')) return raw.slice(0, 16).replace('T', ' ');
		return String(raw);
	}

	function statusClasses(raw: string | number | undefined): string {
		const s = Number(raw);
		if (s === 20) return 'bg-(--c-success-bg) text-(--c-success)';
		if (s >= 40 && s < 50) return 'bg-(--c-danger-bg) text-(--c-danger)';
		if (s === 50 || s === 52 || s === 55 || s === 69)
			return 'bg-(--c-warning-bg) text-(--c-warning)';
		return 'bg-(--c-surface-2) text-(--c-fg-muted)';
	}
</script>

{#snippet footer(meta: FooterMeta | null)}
	<div
		class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-(--c-border) bg-(--c-surface) px-5 py-3.5"
	>
		<div class="flex items-center gap-3">
			<label class="flex items-center gap-2 text-[12px] text-(--c-fg-muted)">
				Baris/halaman
				<select
					bind:value={query['pageSize']}
					onchange={applyFilter}
					disabled={meta === null || navigating.type !== null}
					class="h-8 rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40"
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
				onclick={() => meta && goPrev(meta)}
				disabled={meta === null || navigating.type !== null || !meta.has_prev_page}
				class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--c-border) disabled:hover:text-(--c-fg-muted)"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>
			<button
				onclick={() => meta && goNext(meta)}
				disabled={meta === null || navigating.type !== null || !meta.has_next_page}
				class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--c-border) disabled:hover:text-(--c-fg-muted)"
			>
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>
{/snippet}

<main class="mx-auto flex min-h-full w-full max-w-375 flex-col px-4 py-4 sm:px-7 md:h-full">
	<div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{title}</h1>
			<p class="mt-0.5 text-[13px] text-(--c-fg-muted)">{subtitle}</p>
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
					disabled={controlsDisabled}
					class="text-[12px] font-medium text-(--c-danger) hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline"
					>Reset semua</button
				>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
				{#each filters.filter((f) => f.type !== 'checkbox') as f (f.param)}
					<div>
						<label
							for={'f-' + f.param}
							class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
							>{f.label}</label
						>
						{#if f.type === 'date'}
							<input
								id={'f-' + f.param}
								type="date"
								bind:value={query[f.param]}
								class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
								disabled={controlsDisabled}
							/>
						{:else if f.type === 'number'}
							<input
								id={'f-' + f.param}
								type="number"
								min="1"
								placeholder={f.placeholder}
								bind:value={query[f.param]}
								class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
								disabled={controlsDisabled}
							/>
						{:else if f.type === 'text'}
							<input
								id={'f-' + f.param}
								type="text"
								placeholder={f.placeholder}
								bind:value={query[f.param]}
								class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
								disabled={controlsDisabled}
							/>
						{:else if f.type === 'terminal'}
							<select
								id={'f-' + f.param}
								bind:value={query[f.param]}
								class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
								disabled={controlsDisabled}
							>
								<option value="">Semua</option>
								{#each Object.entries(KODE_TERMINAL) as [key, label] (key)}
									<option value={key}>{label}</option>
								{/each}
							</select>
						{:else if f.type === 'status'}
							<select
								id={'f-' + f.param}
								bind:value={query[f.param]}
								class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
								disabled={controlsDisabled}
							>
								<option value="">Semua</option>
								{#each statusOptions as [val, label] (val)}
									<option value={val}>{label}</option>
								{/each}
							</select>
						{:else if f.type === 'tipe'}
							<select
								id={'f-' + f.param}
								bind:value={query[f.param]}
								class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
								disabled={controlsDisabled}
							>
								<option value="">Semua</option>
								{#each Object.entries(f.source) as [key, label] (key)}
									<option value={key}>{label}</option>
								{/each}
							</select>
						{:else}
							<select
								id={'f-' + f.param}
								bind:value={query[f.param]}
								class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
								disabled={controlsDisabled}
							>
								<option value="">Semua</option>
								{#await resellers}
									<option value="">Memuat…</option>
								{:then res}
									{#each res.data.items as r (r.kode)}
										<option value={r.kode}>{r.nama}</option>
									{/each}
								{:catch}
									<option value="">-</option>
								{/await}
							</select>
						{/if}
					</div>
				{/each}
			</div>
			<div
				class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--c-border) pt-4"
			>
				{#if filters.some((f) => f.type === 'checkbox')}
					<div class="flex flex-wrap items-center gap-6">
						{#each filters.filter((f) => f.type === 'checkbox') as f (f.param)}
							<label class="flex cursor-pointer items-center gap-2 text-[13px] text-(--c-fg-muted)">
								<input
									type="checkbox"
									class="h-4 w-4 rounded border-(--c-border) accent-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
									checked={query[f.param] === 'true'}
									disabled={controlsDisabled}
									onchange={(e) => (query[f.param] = e.currentTarget.checked ? 'true' : '')}
								/>
								{f.label}
							</label>
						{/each}
					</div>
				{/if}
				<button
					onclick={applyFilter}
					disabled={controlsDisabled}
					class="rounded-lg bg-(--c-accent) px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Terapkan Filter
				</button>
			</div>
		</div>
	{/if}

	{#await load}
		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-(--c-border) bg-(--c-surface)"
		>
			<div class="min-h-0 flex-1 overflow-auto">
				<table class="w-full border-collapse">
					<thead>
						<tr>
							{#each cols as c (c.key)}
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
			{@render footer(null)}
		</div>
	{:then d}
		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-(--c-border) bg-(--c-surface)"
		>
			<div class="min-h-0 flex-1 overflow-auto">
				<table class="w-full border-collapse">
					<thead>
						<tr>
							{#each cols as c (c.key)}
								<th
									class="sticky top-0 border-b border-(--c-border) bg-(--c-table-head) px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-(--c-fg-soft) uppercase select-none"
									>{c.label}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each d.data.items as item, i (item.kode + '-' + i)}
							<tr class="transition-colors hover:bg-(--c-row-hover)">
								{#each cols as c (c.key)}
									{@const raw = (item as Record<string, string | number>)[c.key]}
									{#if c.badge}
										<td class="border-b border-(--c-border) px-3.5 py-3">
											<span
												class="inline-block rounded bg-(--c-surface-2) px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-(--c-fg-muted)"
												>{cellText(raw, c)}</span
											>
										</td>
									{:else if c.status}
										<td class="border-b border-(--c-border) px-3.5 py-3">
											<span
												class="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap {statusClasses(
													raw
												)}">{cellText(raw, c)}</span
											>
										</td>
									{:else}
										<td
											class={cellClass(c)}
											style={c.maxWidth ? `max-width: ${c.maxWidth}px` : undefined}
											title={c.trunc ? String(raw) : undefined}
											>{c.date ? formatDate(raw) : cellText(raw, c)}</td
										>
									{/if}
								{/each}
							</tr>
						{:else}
							<tr
								><td colspan={cols.length} class="py-16 text-center text-sm text-(--c-fg-soft)"
									>Tidak ada pesan.</td
								></tr
							>
						{/each}
					</tbody>
				</table>
			</div>
			{@render footer(d.data.meta)}
		</div>
	{:catch err}
		<div
			class="flex flex-1 items-center justify-center rounded-xl border border-(--c-border) bg-(--c-surface)"
		>
			<div class="text-center">
				<p class="text-[14px] font-semibold text-(--c-fg)">
					{is401(err) ? 'Sesi berakhir' : 'Gagal memuat data'}
				</p>
				{#if is401(err)}
					<button
						onclick={async () => {
							try {
								await fetch('/api/auth/logout', { method: 'POST' });
							} finally {
								goto(resolve('/login'));
							}
						}}
						class="mt-3 rounded-lg border border-(--c-border) px-4 py-1.5 text-xs font-medium text-(--c-fg) transition-colors hover:border-(--c-accent)"
					>
						Masuk ulang
					</button>
				{:else}
					<p class="mt-1 text-[12px] text-(--c-fg-muted)">Silakan coba lagi.</p>
					<button
						onclick={() => goto(resolve(path))}
						class="mt-3 rounded-lg border border-(--c-border) px-4 py-1.5 text-xs font-medium text-(--c-fg) transition-colors hover:border-(--c-accent)"
					>
						Muat ulang
					</button>
				{/if}
			</div>
		</div>
	{/await}
</main>
