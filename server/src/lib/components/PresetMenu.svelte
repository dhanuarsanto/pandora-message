<script lang="ts">
	import { BULAN_PENDEK, addDaysISO, endOfMonthISO, firstOfMonthISO, todayISO } from '$lib/date';
	import type { FilterField } from '$lib/message/types';
	import { cn } from '$lib/utils';
	import { CalendarRange, Check, ChevronDown } from '@lucide/svelte';

	let {
		query = $bindable(),
		filters,
		controlsDisabled,
		onApply
	}: {
		query: Record<string, string>;
		filters: FilterField[];
		controlsDisabled: boolean;
		onApply: () => boolean;
	} = $props();

	type DatePreset = { label: string; start: string; end: string; separate?: boolean };

	let open = $state(false);
	let applying = $state(false);
	let root: HTMLDivElement | null = $state(null);
	let btn: HTMLButtonElement | null = $state(null);

	$effect(() => {
		if (!controlsDisabled) applying = false;
	});

	function getPresets(): DatePreset[] {
		const today = todayISO();
		return [
			{ label: 'Hari Ini', start: today, end: today },
			{ label: '7 Hari', start: addDaysISO(-6), end: today },
			{ label: 'Bulan Ini', start: firstOfMonthISO(0), end: endOfMonthISO(0) },
			{ label: 'Semua Data', start: '', end: '', separate: true }
		];
	}

	function fmtShort(iso: string): string {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
		if (!m) return iso;
		return `${+m[3]} ${BULAN_PENDEK[+m[2] - 1]} ${m[1]}`;
	}

	const dateFields = $derived(filters.filter((f) => f.type === 'date'));

	const datePairs = $derived(
		dateFields.flatMap((f) => {
			const m = /^start(.+)$/.exec(f.param);
			if (!m) return [];
			const end = dateFields.find((e) => e.param === 'end' + m[1]);
			return [{ start: f.param, end: end?.param ?? null }];
		})
	);

	function presetActive(p: DatePreset): boolean {
		return (
			datePairs.length > 0 &&
			datePairs.every((pair) => {
				if (query[pair.start] !== p.start) return false;
				return pair.end === null || query[pair.end] === p.end;
			})
		);
	}

	const activeRange = $derived.by(() => {
		for (const pair of datePairs) {
			const startVal = query[pair.start];
			const endVal = pair.end === null ? '' : query[pair.end];
			if (!startVal || !endVal) continue;
			return startVal === endVal
				? fmtShort(startVal)
				: `${fmtShort(startVal)} – ${fmtShort(endVal)}`;
		}
		return '';
	});

	const label = $derived(
		getPresets().find((p) => presetActive(p))?.label || activeRange || 'Preset'
	);

	function applyPreset(p: DatePreset) {
		for (const pair of datePairs) {
			query[pair.start] = p.start;
			if (pair.end !== null) query[pair.end] = p.end;
		}
		open = false;
		btn?.focus();
		applying = onApply();
	}

	function toggle() {
		if (controlsDisabled || applying) return;
		open = !open;
	}

	$effect(() => {
		if (typeof window === 'undefined' || !open) return;
		const onPointer = (e: PointerEvent) => {
			const t = e.target as Node | null;
			if (root && t && !root.contains(t)) open = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			open = false;
			btn?.focus();
		};
		window.addEventListener('pointerdown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="relative" bind:this={root}>
	<button
		bind:this={btn}
		type="button"
		disabled={controlsDisabled || applying}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Preset rentang tanggal"
		onclick={toggle}
		class="flex items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 py-1.5 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:pointer-events-none disabled:opacity-50"
	>
		<CalendarRange class="h-3.5 w-3.5" />
		<span class="max-w-45 truncate">{label}</span>
		<ChevronDown
			class={cn(
				'h-3.5 w-3.5 shrink-0 text-(--c-fg-faint) transition-transform',
				open && 'rotate-180'
			)}
		/>
	</button>

	{#if open}
		<div
			role="listbox"
			aria-label="Preset rentang tanggal"
			class="absolute z-40 mt-2 flex w-56 flex-col rounded-xl border border-(--c-border) bg-(--c-surface) p-1 shadow-[0_16px_48px_-12px_rgba(20,32,26,0.28)]"
		>
			{#each getPresets() as p (p.label)}
				{#if p.separate}
					<div class="my-1 h-px bg-(--c-border)"></div>
				{/if}
				<button
					type="button"
					role="option"
					aria-selected={presetActive(p)}
					onclick={() => applyPreset(p)}
					class={cn(
						'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
						presetActive(p)
							? 'bg-(--c-accent-soft) font-semibold text-(--c-accent-strong)'
							: 'text-(--c-fg) hover:bg-(--c-surface-2)'
					)}
				>
					<span class="min-w-0 flex-1 truncate">{p.label}</span>
					{#if presetActive(p)}
						<Check class="h-4 w-4 shrink-0" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
