<script lang="ts">
	import { cellClass, cellText, formatDate, statusClasses } from '$lib/format';
	import type { ColSpec, FooterMeta, MessageItem } from '$lib/message/types';
	import { cn } from '$lib/utils';
	import TableError from './table/TableError.svelte';
	import TableFooter from './table/TableFooter.svelte';
	import TableHeader from './table/TableHeader.svelte';
	import TableSkeleton from './table/TableSkeleton.svelte';

	let {
		data,
		loading,
		error,
		errorDetail,
		cols,
		skeletonRows,
		pageSize,
		busy,
		onPageSizeChange,
		onGoNext,
		onGoPrev,
		onReorderColumns,
		onRetry,
		reloadPath
	}: {
		data: { items: MessageItem[]; meta: FooterMeta } | null;
		loading: boolean;
		error: string | null;
		errorDetail: string | null;
		cols: ColSpec[];
		skeletonRows: number[];
		pageSize: string;
		busy: boolean;
		onPageSizeChange: (value: string) => void;
		onGoNext: (meta: FooterMeta) => void;
		onGoPrev: (meta: FooterMeta) => void;
		onReorderColumns: (keys: string[]) => void;
		onRetry: () => void;
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

{#if error}
	<TableError {error} {errorDetail} {onRetry} {reloadPath} />
{:else}
	<div
		class="relative flex min-h-0 flex-1 flex-col overflow-clip rounded-xl border border-(--c-border) bg-(--c-surface)"
	>
		{#if loading || !data}
			<div class="min-h-0 flex-1 overflow-auto" bind:this={tableContainer}>
				<table class="w-full border-separate border-spacing-0">
					<TableHeader {cols} {onReorderColumns} />
					<TableSkeleton {cols} {skeletonRows} />
				</table>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto" bind:this={tableContainer}>
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
					<table class="w-full border-separate border-spacing-0">
						<TableHeader {cols} {onReorderColumns} />
						<tbody>
							{#each data.items as item, i (item.kode + '-' + i)}
								<tr class="transition-colors hover:bg-(--c-row-hover)">
									{#each cols as c (c.key)}
										{@const raw = (item as Record<string, string | number>)[c.key]}
										{#if c.badge}
											<td class="border-b border-(--c-border) px-3.5 py-3">
												<span
													class="inline-block rounded bg-(--c-border) px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-(--c-fg-muted)"
													>{cellText(raw)}</span
												>
											</td>
										{:else if c.status}
											<td class="border-b border-(--c-border) px-3.5 py-3">
												<span
													class={cn(
														'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
														statusClasses(raw)
													)}>{cellText(raw)}</span
												>
											</td>
										{:else}
											<td class={cn(cellClass(c), c.date && 'whitespace-nowrap')}>
												{c.date ? formatDate(raw) : cellText(raw)}</td
											>
										{/if}
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		{/if}
		{#if scrollable}
			<div
				class="pointer-events-none absolute right-0 bottom-12 z-20 w-6 bg-linear-to-l from-(--c-surface) to-transparent"
			></div>
		{/if}
		<TableFooter
			meta={data?.meta ?? null}
			{pageSize}
			{busy}
			{loading}
			{onPageSizeChange}
			{onGoNext}
			{onGoPrev}
		/>
	</div>
{/if}
