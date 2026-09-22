<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';
	import { onDestroy } from 'svelte';

	let {
		value,
		label,
		anchor
	}: {
		value: string;
		label: string;
		anchor: { left: number; top: number; bottom: number };
	} = $props();

	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout> | null = null;
	let panel = $state<HTMLDivElement | null>(null);
	let pos = $state<{ x: number; y: number } | null>(null);

	onDestroy(() => {
		if (copiedTimer) clearTimeout(copiedTimer);
	});

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			if (copiedTimer) clearTimeout(copiedTimer);
			copiedTimer = setTimeout(() => (copied = false), 1500);
		} catch {
			copied = false;
		}
	}

	$effect(() => {
		panel?.focus();
	});

	$effect(() => {
		const el = panel;
		if (!el) return;
		const recompute = () => {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const elW = Math.min(el.offsetWidth, vw - 24);
			const elH = el.offsetHeight;
			const x = Math.min(Math.max(12, anchor.left), vw - elW - 12);
			const y =
				anchor.bottom + 6 + elH <= vh ? anchor.bottom + 6 : Math.max(12, anchor.top - elH - 6);
			pos = { x, y };
		};
		recompute();
		window.addEventListener('resize', recompute);
		window.addEventListener('orientationchange', recompute);
		return () => {
			window.removeEventListener('resize', recompute);
			window.removeEventListener('orientationchange', recompute);
		};
	});
</script>

<div
	data-cell-popover
	bind:this={panel}
	role="dialog"
	aria-label={label}
	tabindex="-1"
	class="fixed z-50 max-w-[min(92vw,380px)] min-w-64 rounded-xl border border-(--c-border) bg-(--c-surface) p-3 shadow-[0_16px_48px_-12px_rgba(20,32,26,0.3)] transition-opacity duration-120 ease-out {pos
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
	style={pos ? `left: ${pos.x}px; top: ${pos.y}px` : 'left: -9999px; top: -9999px'}
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
