<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { FooterMeta } from '$lib/message/types';

	let {
		meta,
		pageSize,
		busy,
		loading,
		onPageSizeChange,
		onGoNext,
		onGoPrev
	}: {
		meta: FooterMeta | null;
		pageSize: string;
		busy: boolean;
		loading: boolean;
		onPageSizeChange: (value: string) => void;
		onGoNext: (meta: FooterMeta) => void;
		onGoPrev: (meta: FooterMeta) => void;
	} = $props();
</script>

<div
	class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-(--c-border) bg-(--c-surface) px-5 py-3.5"
>
	<div class="flex items-center gap-3">
		<label class="flex items-center gap-2 text-[12px] text-(--c-fg-muted)">
			Baris/halaman
			<select
				value={pageSize}
				onchange={(e) => onPageSizeChange(e.currentTarget.value)}
				disabled={meta === null || busy || loading}
				class="h-8 cursor-pointer rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40"
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
			disabled={meta === null || busy || loading || !meta.has_prev_page}
			class="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--c-border) disabled:hover:text-(--c-fg-muted)"
		>
			<ChevronLeft class="h-4 w-4" />
		</button>
		<button
			onclick={() => meta && onGoNext(meta)}
			disabled={meta === null || busy || loading || !meta.has_next_page}
			class="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--c-border) disabled:hover:text-(--c-fg-muted)"
		>
			<ChevronRight class="h-4 w-4" />
		</button>
	</div>
</div>
