<script lang="ts">
	import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/svelte';
	import { pageRange, pageWindow } from '$lib/sortRows';
	import { cn } from '$lib/utils';

	let {
		page,
		total,
		pageSize,
		disabled = false,
		onPage,
		onPageSizeChange
	}: {
		page: number;
		total: number;
		pageSize: number;
		disabled?: boolean;
		onPage: (page: number) => void;
		onPageSizeChange: (size: number) => void;
	} = $props();

	const SIZES = [10, 25, 50, 100];

	const pages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const window_ = $derived(pageWindow(page, pages));
	const range = $derived(pageRange(page, total, pageSize));
	const blocks = $derived(new Intl.NumberFormat('id-ID').format);

	const btn =
		'flex h-8 min-w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

	function go(next: number) {
		if (disabled) return;
		if (next < 1 || next > pages || next === page) return;
		onPage(next);
	}
</script>

<div
	class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-(--c-border) bg-(--c-surface) px-5 py-3.5"
>
	<div class="flex items-center gap-3">
		<label class="flex items-center gap-2 text-[12px] text-(--c-fg-muted)">
			Baris/halaman
			<select
				value={pageSize}
				onchange={(e) => {
					const v = Number(e.currentTarget.value);
					if (Number.isFinite(v) && v > 0) onPageSizeChange(v);
				}}
				{disabled}
				class="h-8 cursor-pointer rounded-md border border-(--c-border) bg-(--c-surface) px-2 text-xs text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-40"
			>
				{#each SIZES as s (s)}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</label>
		<span class="text-[12px] text-(--c-fg-muted)">
			Menampilkan {blocks(range.from)}–{blocks(range.to)} dari {blocks(total)}
		</span>
	</div>
	<nav aria-label="Penomoran halaman" class="flex items-center gap-1.5">
		<button
			type="button"
			class={cn(
				btn,
				'border-(--c-border) bg-(--c-surface) px-2 text-(--c-fg-muted) enabled:cursor-pointer enabled:hover:border-(--c-accent) enabled:hover:text-(--c-accent)'
			)}
			disabled={disabled || page <= 1}
			title="Ke halaman pertama"
			aria-label="Ke halaman pertama"
			onclick={() => go(1)}
		>
			<ChevronsLeft class="h-4 w-4" />
		</button>
		<button
			type="button"
			class={cn(
				btn,
				'border-(--c-border) bg-(--c-surface) px-2 text-(--c-fg-muted) enabled:cursor-pointer enabled:hover:border-(--c-accent) enabled:hover:text-(--c-accent)'
			)}
			disabled={disabled || page <= 1}
			title="Halaman sebelumnya"
			aria-label="Halaman sebelumnya"
			onclick={() => go(page - 1)}
		>
			<ChevronLeft class="h-4 w-4" />
		</button>
		{#each window_ as p, i (p === -1 ? `gap-${i}` : `page-${p}`)}
			{#if p === -1}
				<span class="px-1 text-xs text-(--c-fg-faint)" aria-hidden="true">…</span>
			{:else}
				<button
					type="button"
					class={cn(
						btn,
						p === page
							? 'border-(--c-accent) bg-(--c-accent) text-white'
							: 'border-(--c-border) bg-(--c-surface) text-(--c-fg-muted) enabled:cursor-pointer enabled:hover:border-(--c-accent) enabled:hover:text-(--c-accent)'
					)}
					{disabled}
					aria-current={p === page ? 'page' : undefined}
					aria-label={'Halaman ' + p}
					title={'Halaman ' + p}
					onclick={() => go(p)}
				>
					{p}
				</button>
			{/if}
		{/each}
		<button
			type="button"
			class={cn(
				btn,
				'border-(--c-border) bg-(--c-surface) px-2 text-(--c-fg-muted) enabled:cursor-pointer enabled:hover:border-(--c-accent) enabled:hover:text-(--c-accent)'
			)}
			disabled={disabled || page >= pages}
			title="Halaman berikutnya"
			aria-label="Halaman berikutnya"
			onclick={() => go(page + 1)}
		>
			<ChevronRight class="h-4 w-4" />
		</button>
		<button
			type="button"
			class={cn(
				btn,
				'border-(--c-border) bg-(--c-surface) px-2 text-(--c-fg-muted) enabled:cursor-pointer enabled:hover:border-(--c-accent) enabled:hover:text-(--c-accent)'
			)}
			disabled={disabled || page >= pages}
			title="Ke halaman terakhir"
			aria-label="Ke halaman terakhir"
			onclick={() => go(pages)}
		>
			<ChevronsRight class="h-4 w-4" />
		</button>
	</nav>
</div>
