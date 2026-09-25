<script lang="ts">
	import { KODE_TERMINAL } from '$lib/config';
	import { BULAN_PENDEK, addDaysISO, firstOfMonthISO, todayISO } from '$lib/date';
	import type { FilterField } from '$lib/message/types';
	import type { ResellerResponse } from '$lib/references/types';
	import { cn } from '$lib/utils';
	import { CalendarRange, Hash, Search } from '@lucide/svelte';
	import DateInput from './DateInput.svelte';
	import FilterSelect from './FilterSelect.svelte';

	let {
		query = $bindable(),
		filters,
		statusOptions,
		resellers,
		controlsDisabled,
		onReset,
		onApply
	}: {
		query: Record<string, string>;
		filters: FilterField[];
		statusOptions: [string, string][];
		resellers: ResellerResponse | null;
		controlsDisabled: boolean;
		onReset: () => void;
		onApply: () => boolean;
	} = $props();

	let applying = $state(false);

	$effect(() => {
		if (!controlsDisabled) applying = false;
	});

	const inputCls =
		'h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) pl-8.5 pr-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60';

	type DatePreset = { label: string; start: string; end: string };

	function getPresets(): DatePreset[] {
		const today = todayISO();
		return [
			{ label: 'Hari Ini', start: today, end: today },
			{ label: '7 Hari', start: addDaysISO(-6), end: today },
			{ label: 'Bulan Ini', start: firstOfMonthISO(0), end: today },
			{ label: '3 Bulan', start: firstOfMonthISO(-2), end: today },
			{ label: 'Semua Data', start: '', end: '' }
		];
	}

	function fmtShort(iso: string): string {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
		if (!m) return iso;
		return `${+m[3]} ${BULAN_PENDEK[+m[2] - 1]} ${m[1]}`;
	}

	const nonCheckboxFields = $derived(filters.filter((f) => f.type !== 'checkbox'));

	const activeRange = $derived.by(() => {
		for (const f of nonCheckboxFields) {
			if (f.type !== 'date') continue;
			const m = /^start(.+)$/.exec(f.param);
			if (!m) continue;
			const end = nonCheckboxFields.find((e) => e.type === 'date' && e.param === 'end' + m[1]);
			const startVal = query[f.param];
			const endVal = end ? query[end.param] : '';
			if (!startVal || !endVal) continue;
			return startVal === endVal
				? fmtShort(startVal)
				: `${fmtShort(startVal)} – ${fmtShort(endVal)}`;
		}
		return '';
	});

	function optionsFor(f: FilterField): { value: string; label: string }[] {
		switch (f.type) {
			case 'terminal':
				return Object.entries(KODE_TERMINAL).map(([value, label]) => ({ value, label }));
			case 'status':
				return statusOptions.map(([value, label]) => ({ value, label }));
			case 'tipe':
				return Object.entries(f.source).map(([value, label]) => ({ value, label }));
			case 'reseller':
				return (resellers?.data.items ?? []).map((r) => ({ value: r.kode, label: r.nama }));
			default:
				return [];
		}
	}

	function presetActive(p: DatePreset): boolean {
		const pairs = nonCheckboxFields.filter((f) => f.type === 'date' && /^start.+$/.test(f.param));
		return (
			pairs.length > 0 &&
			pairs.every((f) => {
				const m = /^start(.+)$/.exec(f.param)!;
				const end = nonCheckboxFields.find((e) => e.type === 'date' && e.param === 'end' + m[1]);
				return !end || (query[f.param] === p.start && query[end.param] === p.end);
			})
		);
	}

	function applyPreset(p: DatePreset) {
		for (const f of nonCheckboxFields) {
			if (f.type !== 'date') continue;
			const m = /^start(.+)$/.exec(f.param);
			if (!m) continue;
			const end = nonCheckboxFields.find((e) => e.type === 'date' && e.param === 'end' + m[1]);
			query[f.param] = p.start;
			if (end) query[end.param] = p.end;
		}
		applying = onApply();
	}
</script>

<form
	class="mb-5 rounded-xl border border-(--c-border) bg-(--c-surface) p-5"
	onsubmit={(e) => {
		e.preventDefault();
		applying = onApply();
	}}
>
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<h3 class="text-[13px] font-semibold text-(--c-fg)">Filter</h3>
		<button
			type="button"
			onclick={onReset}
			disabled={controlsDisabled}
			class="text-[12px] font-medium text-(--c-danger) hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline"
			>Reset semua</button
		>
	</div>

	{#if nonCheckboxFields.some((f) => f.type === 'date')}
		<div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
			<span
				class="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
			>
				<CalendarRange class="h-3.5 w-3.5" />
				Preset
			</span>
			<div class="flex flex-wrap items-center gap-1 rounded-lg bg-(--c-surface-2) p-1">
				{#each getPresets() as p (p.label)}
					<button
						type="button"
						disabled={controlsDisabled || applying}
						onclick={() => {
							applyPreset(p);
						}}
						class={cn(
							'rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-3',
							presetActive(p)
								? 'bg-(--c-accent-soft) font-semibold text-(--c-accent-strong)'
								: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-accent)'
						)}>{p.label}</button
					>
				{/each}
			</div>
			{#if activeRange}
				<span class="text-[12px] text-(--c-fg-muted)">{activeRange}</span>
			{/if}
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each nonCheckboxFields as f (f.param)}
			<div>
				<label
					for={'f-' + f.param}
					class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
					>{f.label}</label
				>
				{#if f.type === 'date'}
					<DateInput
						id={'f-' + f.param}
						ariaLabel={f.label}
						bind:value={query[f.param]}
						disabled={controlsDisabled}
					/>
				{:else if f.type === 'number'}
					<div class="relative">
						<Hash
							class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-(--c-fg-faint)"
						/>
						<input
							id={'f-' + f.param}
							type="number"
							min="1"
							placeholder={f.placeholder}
							bind:value={query[f.param]}
							disabled={controlsDisabled}
							class={inputCls}
						/>
					</div>
				{:else if f.type === 'text'}
					<div class="relative">
						<Search
							class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-(--c-fg-faint)"
						/>
						<input
							id={'f-' + f.param}
							type="text"
							placeholder={f.placeholder}
							bind:value={query[f.param]}
							disabled={controlsDisabled}
							class={inputCls}
						/>
					</div>
				{:else if f.type === 'terminal' || f.type === 'status' || f.type === 'tipe' || f.type === 'reseller'}
					<FilterSelect
						id={'f-' + f.param}
						ariaLabel={f.label}
						bind:value={query[f.param]}
						options={optionsFor(f)}
						emptyText={f.type === 'reseller' && !resellers ? 'Memuat…' : 'Belum ada data'}
						disabled={controlsDisabled}
					/>
				{/if}
			</div>
		{/each}
	</div>

	<div
		class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--c-border) pt-4"
	>
		{#if filters.some((f) => f.type === 'checkbox')}
			<div class="flex flex-wrap items-center gap-6">
				{#each filters.filter((f) => f.type === 'checkbox') as f (f.param)}
					<label class="flex cursor-pointer items-center gap-2.5">
						<input
							type="checkbox"
							class="sr-only"
							checked={query[f.param] === 'true'}
							disabled={controlsDisabled}
							onchange={(e) => (query[f.param] = e.currentTarget.checked ? 'true' : '')}
						/>
						<span
							class={cn(
								'relative h-5 w-9 shrink-0 rounded-full transition-colors',
								query[f.param] === 'true' ? 'bg-(--c-accent)' : 'bg-(--c-border)',
								controlsDisabled && 'opacity-60'
							)}
						>
							<span
								class={cn(
									'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
									query[f.param] === 'true' && 'translate-x-4'
								)}
							></span>
						</span>
						<span class="text-[13px] text-(--c-fg-muted) select-none">{f.label}</span>
					</label>
				{/each}
			</div>
		{/if}
		<button
			type="submit"
			disabled={controlsDisabled || applying}
			class="rounded-lg bg-(--c-accent) px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Terapkan Filter
		</button>
	</div>
</form>
