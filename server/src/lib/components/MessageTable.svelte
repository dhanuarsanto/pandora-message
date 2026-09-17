<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ColSpec, FooterMeta, MessageItem } from '$lib/types';
	import { cellClass, cellText, formatDate, is401, statusClasses } from '$lib/utils';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	let {
		load,
		cols,
		skeletonRows,
		skeletonWidths,
		pageSize,
		busy,
		onPageSizeChange,
		onGoNext,
		onGoPrev,
		reloadPath
	}: {
		load: Promise<{ data: { items: MessageItem[]; meta: FooterMeta } }>;
		cols: ColSpec[];
		skeletonRows: number[];
		skeletonWidths: number[];
		pageSize: string;
		busy: boolean;
		onPageSizeChange: (value: string) => void;
		onGoNext: (meta: FooterMeta) => void;
		onGoPrev: (meta: FooterMeta) => void;
		reloadPath: '/inbox' | '/outbox';
	} = $props();

	let scrollable = $state(false);
	let tableContainer: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (typeof window === 'undefined' || !tableContainer) return;
		const check = () => {
			const el = tableContainer as HTMLDivElement;
			if (!el) return;
			scrollable = el.scrollWidth > el.clientWidth;
		};
		check();
		const ro = new ResizeObserver(check);
		ro.observe(tableContainer);
		return () => ro.disconnect();
	});
</script>

{#snippet footer(meta: FooterMeta | null)}
	<div
		class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-(--c-border) bg-(--c-surface) px-5 py-3.5"
	>
		<div class="flex items-center gap-3">
			<label class="flex items-center gap-2 text-[12px] text-(--c-fg-muted)">
				Baris/halaman
				<select
					value={pageSize}
					onchange={(e) => onPageSizeChange(e.currentTarget.value)}
					disabled={meta === null || busy}
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
				onclick={() => meta && onGoPrev(meta)}
				disabled={meta === null || busy || !meta.has_prev_page}
				class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--c-border) disabled:hover:text-(--c-fg-muted)"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>
			<button
				onclick={() => meta && onGoNext(meta)}
				disabled={meta === null || busy || !meta.has_next_page}
				class="flex h-8 min-w-8 items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--c-border) disabled:hover:text-(--c-fg-muted)"
			>
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>
{/snippet}

{#await load}
	<div
		class="relative flex min-h-0 flex-1 flex-col overflow-clip rounded-xl border border-(--c-border) bg-(--c-surface)"
	>
		<div class="min-h-0 flex-1 overflow-auto" bind:this={tableContainer}>
			<table class="w-full border-separate border-spacing-0">
				<thead>
					<tr>
						{#each cols as c (c.key)}
							<th
								class="border-b border-(--c-border) bg-(--c-table-head) px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-(--c-fg-soft) uppercase select-none"
								>{c.label}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each skeletonRows as r (r)}
						<tr
							class="animate-pulse border-b border-(--c-border) {r % 2 ? 'bg-(--c-surface-2)' : ''}"
						>
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
		{#if scrollable}
			<div
				class="pointer-events-none absolute right-0 bottom-12 z-20 w-6 bg-linear-to-l from-(--c-surface) to-transparent"
			></div>
		{/if}
		{@render footer(null)}
	</div>
{:then d}
	<div
		class="relative flex min-h-0 flex-1 flex-col overflow-clip rounded-xl border border-(--c-border) bg-(--c-surface)"
	>
		<div class="min-h-0 flex-1 overflow-auto" bind:this={tableContainer}>
			<table class="w-full border-separate border-spacing-0">
				<thead>
					<tr>
						{#each cols as c (c.key)}
							<th
								class="border-b border-(--c-border) bg-(--c-table-head) px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-(--c-fg-soft) uppercase select-none"
								>{c.label}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each d.data.items as item, i (item.kode + '-' + i)}
						<tr
							class="transition-colors hover:bg-(--c-row-hover) {i % 2 ? 'bg-(--c-surface-2)' : ''}"
						>
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
		{#if scrollable}
			<div
				class="pointer-events-none absolute right-0 bottom-12 z-20 w-6 bg-linear-to-l from-(--c-surface) to-transparent"
			></div>
		{/if}
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
					onclick={() => goto(resolve(reloadPath))}
					class="mt-3 rounded-lg border border-(--c-border) px-4 py-1.5 text-xs font-medium text-(--c-fg) transition-colors hover:border-(--c-accent)"
				>
					Muat ulang
				</button>
			{/if}
		</div>
	</div>
{/await}
