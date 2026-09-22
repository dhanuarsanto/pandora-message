<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { reorderKeys } from '$lib/colPrefs';
	import type { ColSpec, FooterMeta, MessageItem } from '$lib/types';
	import { cellClass, cellText, cn, formatDate, is401, statusClasses } from '$lib/utils';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import CellPopover from './CellPopover.svelte';

	let {
		load,
		cols,
		skeletonRows,
		pageSize,
		busy,
		onPageSizeChange,
		onGoNext,
		onGoPrev,
		onReorderColumns,
		reloadPath
	}: {
		load:
			| { data: { items: MessageItem[]; meta: FooterMeta } }
			| Promise<{ data: { items: MessageItem[]; meta: FooterMeta } }>;
		cols: ColSpec[];
		skeletonRows: number[];
		pageSize: string;
		busy: boolean;
		onPageSizeChange: (value: string) => void;
		onGoNext: (meta: FooterMeta) => void;
		onGoPrev: (meta: FooterMeta) => void;
		onReorderColumns: (keys: string[]) => void;
		reloadPath: '/inbox' | '/outbox';
	} = $props();

	let scrollable = $state(false);
	let tableContainer: HTMLDivElement | null = $state(null);
	let dragKey = $state<string | null>(null);
	let dropInfo = $state<{ key: string; side: 'before' | 'after' } | null>(null);

	function onHeaderDragStart(key: string, e: DragEvent) {
		if (cols.length < 2) return;
		dragKey = key;
		dropInfo = null;
		e.dataTransfer!.effectAllowed = 'move';
	}

	function onHeaderDragOver(key: string, e: DragEvent) {
		if (!dragKey || dragKey === key) return;
		e.preventDefault();
		const el = e.currentTarget as HTMLTableCellElement;
		const rect = el.getBoundingClientRect();
		dropInfo = { key, side: e.clientX < rect.left + rect.width / 2 ? 'before' : 'after' };
	}

	function onHeaderDrop(e: DragEvent) {
		e.preventDefault();
		if (!dragKey || !dropInfo) {
			onHeaderDragEnd();
			return;
		}
		const visibleKeys = cols.map((c) => c.key);
		onReorderColumns(reorderKeys(visibleKeys, dragKey, dropInfo.key, dropInfo.side));
		onHeaderDragEnd();
	}

	function onHeaderDragEnd() {
		dragKey = null;
		dropInfo = null;
	}

	function moveColumn(key: string, dir: -1 | 1) {
		const keys = cols.map((c) => c.key);
		const i = keys.indexOf(key);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= keys.length) return;
		const arr = keys.slice();
		arr.splice(i, 1);
		arr.splice(j, 0, key);
		onReorderColumns(arr);
	}

	function onHeaderKeydown(key: string, e: KeyboardEvent) {
		if (!e.altKey) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			moveColumn(key, -1);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			moveColumn(key, 1);
		}
	}

	function barPct(i: number): number {
		return 60 + ((i * 37) % 35);
	}

	type CellDetail = {
		key: string;
		label: string;
		value: string;
		anchor: { left: number; top: number; bottom: number };
	};

	let cellDetail = $state<CellDetail | null>(null);
	let returnFocus: HTMLElement | null = null;

	function cellTitle(raw: string | number | undefined): string | undefined {
		return raw === null || raw === undefined ? undefined : String(raw);
	}

	function openCellDetail(
		c: ColSpec,
		raw: string | number | undefined,
		e: MouseEvent | KeyboardEvent
	) {
		if (!c.trunc) return;
		returnFocus = e.currentTarget as HTMLElement;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		cellDetail = {
			key: c.key,
			label: c.label,
			value: raw === null || raw === undefined ? '-' : String(raw),
			anchor: { left: r.left, top: r.top, bottom: r.bottom }
		};
	}

	function closeCellDetail() {
		const el = returnFocus;
		cellDetail = null;
		returnFocus = null;
		if (el) requestAnimationFrame(() => el.focus());
	}

	$effect(() => {
		if (!cellDetail) return;
		const onPointer = (e: PointerEvent) => {
			const t = e.target;
			if (!(t instanceof HTMLElement) || !t.closest('[data-cell-popover]')) closeCellDetail();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeCellDetail();
		};
		const cont = tableContainer;
		window.addEventListener('pointerdown', onPointer);
		window.addEventListener('keydown', onKey);
		cont?.addEventListener('scroll', closeCellDetail, { capture: true });
		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.removeEventListener('keydown', onKey);
			cont?.removeEventListener('scroll', closeCellDetail, { capture: true });
		};
	});

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

{#snippet thead()}
	<thead>
		<tr>
			{#each cols as c (c.key)}
				<th
					scope="col"
					class={cn(
						'sticky top-0 z-2 border-b border-(--c-border) bg-(--c-table-head) px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-(--c-fg-soft) uppercase select-none',
						c.key === dropInfo?.key &&
							dropInfo.side === 'before' &&
							'shadow-[-3px_0_0_0_var(--c-accent)]',
						c.key === dropInfo?.key &&
							dropInfo.side === 'after' &&
							'shadow-[3px_0_0_0_var(--c-accent)]'
					)}
					draggable={cols.length > 1}
					tabindex={cols.length > 1 ? 0 : undefined}
					title={cols.length > 1 ? 'Seret, atau Alt+←/→ untuk memindahkan kolom' : undefined}
					ondragstart={(e) => onHeaderDragStart(c.key, e)}
					ondragover={(e) => onHeaderDragOver(c.key, e)}
					ondrop={(e) => onHeaderDrop(e)}
					ondragend={() => onHeaderDragEnd()}
					onkeydown={(e) => onHeaderKeydown(c.key, e)}>{c.label}</th
				>
			{/each}
		</tr>
	</thead>
{/snippet}

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
				{@render thead()}
				<tbody>
					{#each skeletonRows as r (r)}
						<tr
							class={cn(
								'animate-pulse border-b border-(--c-border)',
								r % 2 && 'bg-(--c-surface-2)'
							)}
						>
							{#each cols, ci (ci)}
								<td
									class="border-b border-(--c-border) px-3.5 py-3"
									style={cols[ci].width
										? `width: ${cols[ci].width}px; min-width: ${cols[ci].width}px; max-width: ${cols[ci].width}px`
										: undefined}
								>
									<div class="h-3.5 rounded bg-(--c-surface-2)" style="width: {barPct(ci)}%"></div>
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
				{@render thead()}
				<tbody>
					{#each d.data.items as item, i (item.kode + '-' + i)}
						<tr
							class={cn(
								'transition-colors hover:bg-(--c-row-hover)',
								i % 2 && 'bg-(--c-surface-2)'
							)}
						>
							{#each cols as c (c.key)}
								{@const raw = (item as Record<string, string | number>)[c.key]}
								{#if c.badge}
									<td class="border-b border-(--c-border) px-3.5 py-3">
										<span
											class="inline-block rounded bg-(--c-surface-2) px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-(--c-fg-muted)"
											>{cellText(raw)}</span
										>
									</td>
								{:else if c.status}
									<td class="border-b border-(--c-border) px-3.5 py-3">
										<span
											class="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap {statusClasses(
												raw
											)}">{cellText(raw)}</span
										>
									</td>
								{:else if c.trunc}
									<td
										class={cn(cellClass(c), 'cursor-pointer')}
										title={cellTitle(raw)}
										tabindex="0"
										onclick={(e) => openCellDetail(c, raw, e)}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												openCellDetail(c, raw, e);
											}
										}}>{c.date ? formatDate(raw) : cellText(raw)}</td
									>
								{:else}
									<td
										class={cn(
											cellClass(c),
											c.date && 'whitespace-nowrap',
											c.width && 'wrap-break-word'
										)}
										style={c.width
											? `width: ${c.width}px; min-width: ${c.width}px; max-width: ${c.width}px`
											: undefined}>{c.date ? formatDate(raw) : cellText(raw)}</td
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

{#if cellDetail}
	<CellPopover value={cellDetail.value} label={cellDetail.label} anchor={cellDetail.anchor} />
{/if}
