<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';

	let {
		value,
		label,
		x,
		y
	}: {
		value: string;
		label: string;
		x: number;
		y: number;
	} = $props();

	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			copied = false;
		}
	}
</script>

<div
	data-cell-popover
	role="dialog"
	aria-label={label}
	tabindex="-1"
	class="fixed z-50 max-w-[min(92vw,380px)] min-w-64 rounded-xl border border-(--c-border) bg-(--c-surface) p-3 shadow-[0_16px_48px_-12px_rgba(20,32,26,0.3)]"
	style="left: {x}px; top: {y}px"
>
	<div class="mb-1.5 flex items-center justify-between gap-2">
		<span class="text-[11px] font-semibold tracking-[0.14em] text-(--c-fg-soft) uppercase"
			>{label}</span
		>
		<button
			onclick={copy}
			class="flex items-center gap-1.5 rounded-md border border-(--c-border) px-2 py-1 text-[11px] font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent)"
		>
			{#if copied}
				<Check class="h-3 w-3 text-(--c-success)" />
				Tersalin
			{:else}
				<Copy class="h-3 w-3" />
				Salin
			{/if}
		</button>
	</div>
	<p
		class="max-h-[min(40vh,20rem)] overflow-auto text-[12.5px] leading-relaxed wrap-break-word whitespace-pre-wrap text-(--c-fg) select-text"
	>
		{value}
	</p>
</div>
