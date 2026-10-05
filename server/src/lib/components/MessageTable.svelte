<script lang="ts">
	import { copyText } from '$lib/client/clipboard';
	import {
		cellBodyClass,
		cellClass,
		cellText,
		cellTextFor,
		rowKeyOf,
		statusClasses,
		formatDateTime
	} from '$lib/format';
	import type { ColSpec, FooterMeta, MessageItem, OutboxItem } from '$lib/message/types';
	import type { SortDir } from '$lib/sortRows';
	import { cn } from '$lib/utils';
	import { onDestroy } from 'svelte';
	import TableError from './table/TableError.svelte';
	import TableHeader from './table/TableHeader.svelte';
	import TablePager from './table/TablePager.svelte';
	import TableSkeleton from './table/TableSkeleton.svelte';

	let {
		data,
		loading,
		error,
		errorDetail,
		cols,
		skeletonRows,
		page,
		total,
		pageSize,
		sortKey,
		sortDir,
		pagerDisabled,
		onSort,
		onPage,
		onPageSizeChange,
		onReorderColumns,
		onRetry
	}: {
		data: { items: MessageItem[]; meta: FooterMeta } | null;
		loading: boolean;
		error: string | null;
		errorDetail: string | null;
		cols: ColSpec[];
		skeletonRows: number[];
		page: number;
		total: number;
		pageSize: number;
		sortKey: string | null;
		sortDir: SortDir;
		pagerDisabled: boolean;
		onSort: (key: string) => void;
		onPage: (page: number) => void;
		onPageSizeChange: (size: number) => void;
		onReorderColumns: (keys: string[]) => void;
		onRetry: () => void;
	} = $props();

	type CellRef = { row: number; col: string };

	const CLICK_SLOP = 5;

	let scrollable = $state(false);
	let tableContainer: HTMLDivElement | null = $state(null);
	let selected = $state<CellRef | null>(null);
	let copied = $state<CellRef | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | null = null;
	let pointerDown: { x: number; y: number; cell: CellRef } | null = null;

	function sameCell(a: CellRef | null, row: number, col: string): boolean {
		return a !== null && a.row === row && a.col === col;
	}

	function selectedClass(row: number, col: string): string {
		if (!sameCell(selected, row, col)) return '';
		return sameCell(copied, row, col)
			? 'bg-(--c-cell-copied) shadow-[inset_0_0_0_1.5px_var(--c-success)]'
			: 'bg-(--c-cell-sel) shadow-[inset_0_0_0_1.5px_var(--c-accent)]';
	}

	function textAt(ref: CellRef): string | null {
		const item = data?.items[ref.row];
		const col = cols.find((c) => c.key === ref.col);
		if (!item || !col) return null;
		return cellTextFor(col, (item as Record<string, string | number>)[ref.col]);
	}

	function markCopied(ref: CellRef) {
		copied = ref;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => {
			copied = null;
			copyTimer = null;
		}, 1200);
	}

	$effect(() => {
		if (typeof window === 'undefined' || !tableContainer) return;
		const el = tableContainer;

		const check = () => {
			scrollable = el.scrollWidth > el.clientWidth;
		};
		check();
		const ro = new ResizeObserver(check);
		ro.observe(el);

		const cellOf = (target: EventTarget | null): CellRef | null => {
			const td = (target as Element | null)?.closest<HTMLElement>('[data-cell-row]');
			if (!td) return null;
			return { row: Number(td.dataset.cellRow), col: td.dataset.cellCol ?? '' };
		};

		const onPointerDown = (e: PointerEvent) => {
			if (e.button !== 0) return;
			const cell = cellOf(e.target);
			pointerDown = cell ? { x: e.clientX, y: e.clientY, cell } : null;
			if (!cell) selected = null;
		};

		const onPointerUp = (e: PointerEvent) => {
			if (!pointerDown) return;
			const moved = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y);
			if (moved <= CLICK_SLOP) selected = pointerDown.cell;
			pointerDown = null;
		};

		const onOutsideDown = (e: PointerEvent) => {
			if (!el.contains(e.target as Node)) selected = null;
		};

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				selected = null;
				return;
			}
			if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'c') return;
			const target = e.target as HTMLElement | null;
			if (target?.closest('input, textarea, select, [contenteditable]')) return;
			const ref = selected;
			if (!ref) return;
			if (window.getSelection()?.toString()) return;
			const text = textAt(ref);
			if (text === null) return;
			e.preventDefault();
			void copyText(text).then((ok) => {
				if (ok) markCopied(ref);
			});
		};

		el.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('pointerup', onPointerUp);
		document.addEventListener('pointerdown', onOutsideDown);
		window.addEventListener('keydown', onKey);
		return () => {
			el.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointerup', onPointerUp);
			document.removeEventListener('pointerdown', onOutsideDown);
			window.removeEventListener('keydown', onKey);
			ro.disconnect();
		};
	});

	$effect(() => {
		void data;
		selected = null;
		copied = null;
	});

	let lastPage = $state(1);

	$effect(() => {
		const p = page;
		if (p === lastPage) return;
		lastPage = p;
		tableContainer?.scrollTo({ top: 0 });
	});

	onDestroy(() => {
		if (copyTimer) clearTimeout(copyTimer);
	});
</script>

{#if error}
	<TableError {error} {errorDetail} {onRetry} />
{:else}
	<div
		class="relative flex min-h-72 flex-1 flex-col overflow-clip rounded-xl border border-(--c-border) bg-(--c-surface)"
	>
		{#if loading || !data}
			<div class="relative min-h-0 flex-1">
				<div class="h-full overflow-auto" bind:this={tableContainer}>
					<table class="min-w-full border-separate border-spacing-0">
						<TableHeader {cols} {onReorderColumns} {sortKey} {sortDir} {onSort} />
						<TableSkeleton {cols} {skeletonRows} />
					</table>
				</div>
				{#if scrollable}
					<div
						class="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-linear-to-l from-(--c-surface) to-transparent"
					></div>
				{/if}
			</div>
		{:else}
			<div class="relative min-h-0 flex-1">
				<div class="h-full overflow-auto" bind:this={tableContainer}>
					{#if data.items.length === 0}
						<div class="flex h-full min-h-40 items-center justify-center px-6 py-10" role="status">
							<div class="text-center">
								<p class="text-sm font-semibold text-(--c-fg-soft)">Tidak ada pesan.</p>
								<p class="mt-1 text-[12px] text-(--c-fg-faint)">
									Coba ubah filter atau rentang tanggal.
								</p>
							</div>
						</div>
					{:else}
						<table class="min-w-full border-separate border-spacing-0">
							<TableHeader {cols} {onReorderColumns} {sortKey} {sortDir} {onSort} />
							<tbody>
								{#each data.items as item, i (rowKeyOf(item, i))}
									<tr class="transition-colors hover:bg-(--c-row-hover)">
										{#each cols as c (c.key)}
											{@const raw = (item as Record<string, string | number>)[c.key]}
											{@const rendered = c.render
												? c.render(item as OutboxItem)
												: cellTextFor(c, raw)}
											{#if c.badge}
												<td
													data-cell-row={i}
													data-cell-col={c.key}
													class={cn(
														'border-b border-(--c-table-line) px-3.5 py-3',
														selectedClass(i, c.key)
													)}
												>
													<span
														class="inline-block rounded bg-(--c-border) px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-(--c-fg-muted)"
														>{cellText(raw)}</span
													>
												</td>
											{:else if c.status}
												<td
													data-cell-row={i}
													data-cell-col={c.key}
													class={cn(
														'border-b border-(--c-table-line) px-3.5 py-3',
														selectedClass(i, c.key)
													)}
												>
													<span
														class={cn(
															'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
															statusClasses(raw)
														)}>{rendered}</span
													>
												</td>
											{:else}
												<td
													data-cell-row={i}
													data-cell-col={c.key}
													class={cn(cellClass(c), selectedClass(i, c.key))}
												>
													{#if c.date}
														{@const dt = formatDateTime(raw)}
														<div class="flex flex-col gap-0.5 leading-tight">
															<span class="text-[11px] font-medium">{dt.date}</span>
															<span class="text-[10px] text-(--c-fg-muted)">{dt.time}</span>
														</div>
													{:else}
														<span class={cellBodyClass(c)}>{rendered}</span>
													{/if}
												</td>
											{/if}
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
				{#if scrollable}
					<div
						class="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-linear-to-l from-(--c-surface) to-transparent"
					></div>
				{/if}
			</div>
			<TablePager {page} {total} {pageSize} disabled={pagerDisabled} {onPage} {onPageSizeChange} />
		{/if}
		{#if copied}
			<div
				role="status"
				class="pointer-events-none absolute right-4 bottom-4 z-30 animate-[slideDown_0.2s_ease] rounded-md border border-(--c-border) bg-(--c-surface) px-3 py-1.5 text-[11px] font-semibold text-(--c-success) shadow-lg"
			>
				Tersalin
			</div>
		{/if}
	</div>
{/if}
