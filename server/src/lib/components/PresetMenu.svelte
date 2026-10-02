<script lang="ts">
	import { BULAN_PENDEK, addDaysISO, endOfMonthISO, firstOfMonthISO, todayISO } from '$lib/date';
	import type { FilterField } from '$lib/message/types';
	import { cn } from '$lib/utils';
	import { CalendarRange, ChevronDown } from '@lucide/svelte';
	import MenuList from './MenuList.svelte';

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

	const activePreset = $derived(getPresets().find((p) => presetActive(p)));

	const menuItems = $derived(
		getPresets().map((p) => ({ value: p.label, label: p.label, separate: p.separate }))
	);

	const label = $derived(activePreset?.label || activeRange || 'Preset');

	function closeMenu() {
		open = false;
		btn?.focus();
	}

	function applyPresetByLabel(value: string) {
		const p = getPresets().find((x) => x.label === value);
		if (!p) return;
		for (const pair of datePairs) {
			query[pair.start] = p.start;
			if (pair.end !== null) query[pair.end] = p.end;
		}
		closeMenu();
		applying = onApply();
	}

	function toggle() {
		if (controlsDisabled || applying) return;
		open = !open;
	}
</script>

<div class="relative" data-menu-list>
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

	<MenuList
		{open}
		items={menuItems}
		selectedValue={activePreset?.label ?? null}
		onSelect={applyPresetByLabel}
		onClose={closeMenu}
		ariaLabel="Preset rentang tanggal"
		width="w-56"
	/>
</div>
