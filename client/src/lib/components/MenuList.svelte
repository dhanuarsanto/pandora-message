<script lang="ts">
	import { cn } from '$lib/utils';
	import { Check } from '@lucide/svelte';

	type Item = { value: string; label: string; separate?: boolean };

	let {
		open,
		items,
		selectedValue = null,
		onSelect,
		onClose,
		ariaLabel,
		width = 'w-full'
	}: {
		open: boolean;
		items: Item[];
		selectedValue?: string | null;
		onSelect: (value: string) => void;
		onClose: () => void;
		ariaLabel: string;
		width?: string;
	} = $props();

	$effect(() => {
		if (typeof window === 'undefined' || !open) return;
		const onPointer = (e: PointerEvent) => {
			const t = e.target as Element | null;
			if (t && !t.closest('[data-menu-list]')) onClose();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			onClose();
		};
		window.addEventListener('pointerdown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

{#if open}
	<div
		data-menu-list
		role="listbox"
		aria-label={ariaLabel}
		class={cn(
			'absolute z-40 mt-2 flex flex-col rounded-xl border border-(--c-border) bg-(--c-surface) p-1 shadow-[0_16px_48_-12px_rgba(20,32,26,0.28)]',
			width
		)}
	>
		{#each items as it (it.value)}
			{#if it.separate}
				<div class="my-1 h-px bg-(--c-border)"></div>
			{/if}
			<button
				type="button"
				role="option"
				aria-selected={it.value === selectedValue}
				onclick={() => onSelect(it.value)}
				class={cn(
					'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
					it.value === selectedValue
						? 'bg-(--c-accent-soft) font-semibold text-(--c-accent-strong)'
						: 'text-(--c-fg) hover:bg-(--c-surface-2)'
				)}
			>
				<span class="min-w-0 flex-1 truncate">{it.label}</span>
				{#if it.value === selectedValue}
					<Check class="h-4 w-4 shrink-0" />
				{/if}
			</button>
		{/each}
	</div>
{/if}
