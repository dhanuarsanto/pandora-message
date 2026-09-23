<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { KODE_TERMINAL } from '$lib/config';
	import type { FilterField, ResellerResponse } from '$lib/types';
	import { SvelteDate } from 'svelte/reactivity';
	import DateInput from './DateInput.svelte';

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
		onApply: () => void;
	} = $props();

	let applying = $state(false);

	$effect(() => {
		if (!controlsDisabled) applying = false;
	});

	const controlCls =
		'h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60';

	const today = new SvelteDate();
	today.setHours(0, 0, 0, 0);

	function iso(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function addDays(days: number): string {
		const d = new SvelteDate(today);
		d.setDate(d.getDate() + days);
		return iso(d);
	}

	function firstOfMonth(offset: number): string {
		return iso(new SvelteDate(today.getFullYear(), today.getMonth() + offset, 1));
	}

	type DatePreset = { label: string; start: string; end: string };

	const PRESETS: DatePreset[] = [
		{ label: 'Hari Ini', start: iso(today), end: iso(today) },
		{ label: '7 Hari', start: addDays(-6), end: iso(today) },
		{ label: 'Bulan Ini', start: firstOfMonth(0), end: iso(today) },
		{ label: '3 Bulan', start: firstOfMonth(-2), end: iso(today) }
	];

	const dateFields = $derived(filters.filter((f) => f.type === 'date'));
	const datePairs = $derived(
		dateFields.flatMap((f) => {
			if (f.type !== 'date') return [];
			const m = /^start(.+)$/.exec(f.param);
			if (!m) return [];
			const end = dateFields.find((e) => e.type === 'date' && e.param === 'end' + m[1]);
			return end ? [{ start: f, end }] : [];
		})
	);
	const pairedParams = $derived(new Set(datePairs.flatMap((p) => [p.start.param, p.end.param])));
	const standaloneDates = $derived(dateFields.filter((f) => !pairedParams.has(f.param)));
	const nonDateFields = $derived(filters.filter((f) => f.type !== 'checkbox' && f.type !== 'date'));

	function presetActive(p: DatePreset): boolean {
		return datePairs.every(
			(pair) => query[pair.start.param] === p.start && query[pair.end.param] === p.end
		);
	}

	function applyPreset(p: DatePreset) {
		for (const pair of datePairs) {
			query[pair.start.param] = p.start;
			query[pair.end.param] = p.end;
		}
		onApply();
	}

	function applyAllDates() {
		for (const pair of datePairs) {
			query[pair.start.param] = '';
			query[pair.end.param] = '';
		}
		onApply();
	}
</script>

<form
	class="mb-5 rounded-xl border border-(--c-border) bg-(--c-surface) p-5"
	onsubmit={(e) => {
		e.preventDefault();
		applying = true;
		onApply();
	}}
>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-[13px] font-semibold text-(--c-fg)">Filter</h3>
		<button
			type="button"
			onclick={onReset}
			disabled={controlsDisabled}
			class="text-[12px] font-medium text-(--c-danger) hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline"
			>Reset semua</button
		>
	</div>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
		{#each datePairs as pair (pair.start.param)}
			<div
				class="rounded-lg border border-(--c-border) bg-(--c-surface-2) p-4 sm:col-span-2 md:col-span-4 lg:col-span-5"
			>
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<span class="text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
						>Rentang Tanggal</span
					>
					<div class="flex flex-wrap gap-1.5">
						{#each PRESETS as p (p.label)}
							<button
								type="button"
								disabled={controlsDisabled || applying}
								onclick={() => {
									applying = true;
									applyPreset(p);
								}}
								class="rounded-full border px-3 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 {presetActive(
									p
								)
									? 'border-(--c-accent) bg-(--c-accent-soft) text-(--c-accent-strong)'
									: 'border-(--c-border) text-(--c-fg-muted) hover:border-(--c-accent) hover:text-(--c-accent)'}"
								>{p.label}</button
							>
						{/each}
						<button
							type="button"
							disabled={controlsDisabled || applying}
							onclick={() => {
								applying = true;
								applyAllDates();
							}}
							class="rounded-full border px-3 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 {!query[
								pair.start.param
							] && !query[pair.end.param]
								? 'border-(--c-accent) bg-(--c-accent-soft) text-(--c-accent-strong)'
								: 'border-(--c-border) text-(--c-fg-muted) hover:border-(--c-accent) hover:text-(--c-accent)'}"
							>Semua data</button
						>
					</div>
				</div>
				<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
					<div class="flex-1">
						<label
							for={'f-' + pair.start.param}
							class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
							>{pair.start.label}</label
						>
						<DateInput
							id={'f-' + pair.start.param}
							bind:value={query[pair.start.param]}
							disabled={controlsDisabled}
						/>
					</div>
					<div class="hidden pb-2.5 text-(--c-fg-faint) sm:block">
						<ArrowRight class="h-4 w-4" />
					</div>
					<div class="flex-1">
						<label
							for={'f-' + pair.end.param}
							class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
							>{pair.end.label}</label
						>
						<DateInput
							id={'f-' + pair.end.param}
							bind:value={query[pair.end.param]}
							disabled={controlsDisabled}
						/>
					</div>
				</div>
			</div>
		{/each}
		{#each standaloneDates as f (f.param)}
			<div>
				<label
					for={'f-' + f.param}
					class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
					>{f.label}</label
				>
				<DateInput id={'f-' + f.param} bind:value={query[f.param]} disabled={controlsDisabled} />
			</div>
		{/each}
		{#each nonDateFields as f (f.param)}
			<div>
				<label
					for={'f-' + f.param}
					class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
					>{f.label}</label
				>
				{#if f.type === 'number'}
					<input
						id={'f-' + f.param}
						type="number"
						min="1"
						placeholder={f.placeholder}
						bind:value={query[f.param]}
						disabled={controlsDisabled}
						class={controlCls}
					/>
				{:else if f.type === 'text'}
					<input
						id={'f-' + f.param}
						type="text"
						placeholder={f.placeholder}
						bind:value={query[f.param]}
						disabled={controlsDisabled}
						class={controlCls}
					/>
				{:else if f.type === 'terminal'}
					<select
						id={'f-' + f.param}
						bind:value={query[f.param]}
						disabled={controlsDisabled}
						class={controlCls}
					>
						<option value="">Semua</option>
						{#each Object.entries(KODE_TERMINAL) as [key, label] (key)}
							<option value={key}>{label}</option>
						{/each}
					</select>
				{:else if f.type === 'status'}
					<select
						id={'f-' + f.param}
						bind:value={query[f.param]}
						disabled={controlsDisabled}
						class={controlCls}
					>
						<option value="">Semua</option>
						{#each statusOptions as [val, label] (val)}
							<option value={val}>{label}</option>
						{/each}
					</select>
				{:else if f.type === 'tipe'}
					<select
						id={'f-' + f.param}
						bind:value={query[f.param]}
						disabled={controlsDisabled}
						class={controlCls}
					>
						<option value="">Semua</option>
						{#each Object.entries(f.source) as [key, label] (key)}
							<option value={key}>{label}</option>
						{/each}
					</select>
				{:else if f.type === 'reseller'}
					<select
						id={'f-' + f.param}
						bind:value={query[f.param]}
						disabled={controlsDisabled}
						class={controlCls}
					>
						<option value="">Semua</option>
						{#await resellers}
							<option value="">Memuat…</option>
						{:then res}
							{#if res}
								{#each res.data.items as r (r.kode)}
									<option value={r.kode}>{r.nama}</option>
								{/each}
							{:else}
								<option value="">-</option>
							{/if}
						{:catch}
							<option value="">-</option>
						{/await}
					</select>
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
					<label class="flex cursor-pointer items-center gap-2 text-[13px] text-(--c-fg-muted)">
						<input
							type="checkbox"
							class="h-4 w-4 rounded border-(--c-border) accent-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
							checked={query[f.param] === 'true'}
							disabled={controlsDisabled}
							onchange={(e) => (query[f.param] = e.currentTarget.checked ? 'true' : '')}
						/>
						{f.label}
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
