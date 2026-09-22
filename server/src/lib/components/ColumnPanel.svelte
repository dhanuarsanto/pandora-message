<script lang="ts">
	import type { ColSpec } from '$lib/types';
	import { cn } from '$lib/utils';
	import { GripVertical, RotateCcw } from '@lucide/svelte';

	let {
		cols,
		order,
		hidden,
		onReorder,
		onToggle,
		onReset
	}: {
		cols: ColSpec[];
		order: string[];
		hidden: string[];
		onReorder: (keys: string[]) => void;
		onToggle: (key: string) => void;
		onReset: () => void;
	} = $props();

	const visibleCount = $derived(order.filter((k) => !hidden.includes(k)).length);
	let dragIdx = $state<number | null>(null);
	let overIdx = $state<number | null>(null);
	let activeIndex = $state(0);
	let items = $state<(HTMLElement | null)[]>([]);

	$effect(() => {
		items[activeIndex]?.focus();
	});

	function setActive(i: number) {
		activeIndex = Math.max(0, Math.min(order.length - 1, i));
	}

	function move(from: number, to: number) {
		if (to < 0 || to >= order.length || from === to) return;
		const arr = order.slice();
		const [k] = arr.splice(from, 1);
		arr.splice(to, 0, k);
		onReorder(arr);
	}

	function moveByDrag() {
		if (dragIdx === null || overIdx === null) return;
		let to = overIdx;
		if (dragIdx < overIdx) to -= 1;
		move(dragIdx, to);
		dragIdx = null;
		overIdx = null;
	}

	function onKeydown(key: string, i: number, e: KeyboardEvent) {
		if (e.altKey && e.key === 'ArrowUp') {
			e.preventDefault();
			if (i > 0) {
				move(i, i - 1);
				setActive(i - 1);
			}
		} else if (e.altKey && e.key === 'ArrowDown') {
			e.preventDefault();
			if (i < order.length - 1) {
				move(i, i + 1);
				setActive(i + 1);
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActive(i - 1);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActive(i + 1);
		} else if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			onToggle(key);
		}
	}
</script>

<div
	class="absolute inset-x-3 top-full z-40 mt-2 rounded-xl border border-(--c-border) bg-(--c-surface) p-2 shadow-[0_16px_48px_-12px_rgba(20,32,26,0.28)] sm:inset-x-auto sm:right-0 sm:w-80"
>
	<div class="mb-1.5 flex items-center justify-between px-1.5">
		<span class="text-[11px] font-semibold tracking-[0.14em] text-(--c-fg-soft) uppercase"
			>Kolom</span
		>
		<button
			onclick={onReset}
			class="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-2) hover:text-(--c-accent)"
		>
			<RotateCcw class="h-3 w-3" />
			Reset
		</button>
	</div>

	<div
		class="max-h-[min(60vh,22rem)] overflow-auto pr-0.5"
		role="menu"
		aria-orientation="vertical"
		aria-label="Pengaturan kolom"
	>
		{#each order as key, i (key)}
			{@const col = cols.find((c) => c.key === key)}
			{@const isHidden = hidden.includes(key)}
			{@const isLastVisible = !isHidden && visibleCount <= 1}
			<div
				bind:this={items[i]}
				class={cn(
					'flex items-center gap-1 rounded-lg px-1.5 py-1 transition-colors hover:bg-(--c-surface-2)',
					overIdx === i && 'outline-2 -outline-offset-2 outline-(--c-accent) outline-solid',
					isHidden && 'opacity-50'
				)}
				role="menuitemcheckbox"
				aria-checked={!isHidden}
				tabindex={i === activeIndex ? 0 : -1}
				aria-grabbed={dragIdx === i}
				draggable={true}
				aria-label={`Kolom ${col?.label ?? key}`}
				onkeydown={(e) => onKeydown(key, i, e)}
				ondragstart={(e) => {
					dragIdx = i;
					overIdx = null;
					e.dataTransfer!.effectAllowed = 'move';
				}}
				ondragover={(e) => {
					if (dragIdx === null) return;
					e.preventDefault();
					overIdx = i;
				}}
				ondrop={(e) => {
					e.preventDefault();
					moveByDrag();
				}}
				ondragend={(e) => {
					e.preventDefault();
					dragIdx = null;
					overIdx = null;
				}}
			>
				<span
					class="cursor-grab text-(--c-fg-faint) active:cursor-grabbing"
					title="Seret untuk memindahkan"
				>
					<GripVertical class="h-4 w-4" />
				</span>
				<label class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 select-none">
					<input
						type="checkbox"
						checked={!isHidden}
						disabled={isLastVisible}
						onchange={() => onToggle(key)}
						class="h-3.5 w-3.5 shrink-0 accent-(--c-accent)"
					/>
					<span class="truncate text-[12px] text-(--c-fg)">{col?.label ?? key}</span>
				</label>
			</div>
		{/each}
	</div>

	<p
		class="mt-1.5 border-t border-(--c-border) px-1.5 pt-1.5 text-[10.5px] leading-relaxed text-(--c-fg-faint)"
	>
		Seret untuk urutkan • Centang untuk tampilkan
	</p>
</div>
