<script lang="ts">
	import { KODE_TERMINAL } from '$lib/config';
	import { endOfMonthISO, todayISO } from '$lib/date';
	import { AUTO_REFRESH_OPTIONS } from '$lib/messageQuery';
	import type { FilterField } from '$lib/message/types';
	import type { ResellerResponse } from '$lib/references/types';
	import { cn } from '$lib/utils';
	import { ChevronDown, Hash, Search } from '@lucide/svelte';
	import DateInput from './DateInput.svelte';
	import FilterSelect from './FilterSelect.svelte';
	import MenuList from './MenuList.svelte';

	let {
		query = $bindable(),
		filters,
		statusOptions,
		resellers,
		resellersLoaded,
		controlsDisabled,
		autoRefresh = $bindable(),
		refreshSeconds = $bindable(),
		onApply
	}: {
		query: Record<string, string>;
		filters: FilterField[];
		statusOptions: [string, string][];
		resellers: ResellerResponse | null;
		resellersLoaded: boolean;
		controlsDisabled: boolean;
		autoRefresh: boolean;
		refreshSeconds: string;
		onApply: () => boolean;
	} = $props();

	let applying = $state(false);
	let refreshOpen = $state(false);
	let refreshBtn: HTMLButtonElement | null = $state(null);

	const refreshItems = $derived(
		AUTO_REFRESH_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
	);

	const refreshLabel = $derived(
		AUTO_REFRESH_OPTIONS.find((o) => o.value === refreshSeconds)?.label ?? refreshSeconds
	);

	function toggleRefreshMenu() {
		refreshOpen = !refreshOpen;
	}

	function closeRefreshMenu() {
		refreshOpen = false;
		refreshBtn?.focus();
	}

	function pickRefresh(value: string) {
		refreshSeconds = value;
		closeRefreshMenu();
	}

	$effect(() => {
		if (!controlsDisabled) applying = false;
	});

	const inputCls =
		'h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) pl-8.5 pr-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60';

	const nonCheckboxFields = $derived(filters.filter((f) => f.type !== 'checkbox'));

	function fieldCls(f: FilterField): string {
		if (f.type === 'number') return 'w-full sm:w-40 sm:shrink-0';
		if (f.type === 'text') return 'w-full sm:min-w-[220px] sm:flex-[1.6]';
		return 'w-full sm:min-w-[200px] sm:flex-1';
	}

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
</script>

<form
	class="mb-5 rounded-xl border border-(--c-border) bg-(--c-surface) p-4"
	onsubmit={(e) => {
		e.preventDefault();
		applying = onApply();
	}}
>
	<div class="flex flex-wrap gap-4">
		{#each nonCheckboxFields as f (f.param)}
			<div class={fieldCls(f)}>
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
						max={/^end/.test(f.param) ? endOfMonthISO(0) : todayISO()}
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
							class={cn(
								inputCls,
								'appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
							)}
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
						emptyText={f.type === 'reseller' && !resellers
							? resellersLoaded
								? 'Gagal memuat reseller'
								: 'Memuat…'
							: 'Belum ada data'}
						searchable={f.type === 'reseller'}
						disabled={controlsDisabled}
					/>
				{/if}
			</div>
		{/each}
	</div>

	<div
		class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--c-border) pt-4"
	>
		<div class="flex flex-wrap items-center gap-6">
			{#each filters.filter((f) => f.type === 'checkbox') as f (f.param)}
				<label class="flex cursor-pointer items-center gap-2.5">
					<input
						type="checkbox"
						class="sr-only"
						checked={query[f.param] === 'true'}
						disabled={controlsDisabled}
						onchange={(e) =>
							(query[f.param] = e.currentTarget.checked ? 'true' : f.defaultChecked ? 'false' : '')}
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
			<div class="flex flex-wrap items-center gap-3">
				<label class="flex cursor-pointer items-center gap-2.5">
					<input
						type="checkbox"
						class="sr-only"
						checked={autoRefresh}
						onchange={(e) => (autoRefresh = e.currentTarget.checked)}
					/>
					<span
						class={cn(
							'relative h-5 w-9 shrink-0 rounded-full transition-colors',
							autoRefresh ? 'bg-(--c-accent)' : 'bg-(--c-border)'
						)}
					>
						<span
							class={cn(
								'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
								autoRefresh && 'translate-x-4'
							)}
						></span>
					</span>
					<span class="text-[13px] text-(--c-fg-muted) select-none">Perbarui otomatis</span>
				</label>
				<div class="relative" data-menu-list>
					<button
						bind:this={refreshBtn}
						type="button"
						disabled={!autoRefresh}
						aria-haspopup="listbox"
						aria-expanded={refreshOpen}
						aria-label="Selang penyegaran otomatis"
						onclick={toggleRefreshMenu}
						class="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 text-left text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
					>
						<span class="min-w-0 truncate">{refreshLabel}</span>
						<ChevronDown
							class={cn(
								'h-4 w-4 shrink-0 text-(--c-fg-faint) transition-transform',
								refreshOpen && 'rotate-180'
							)}
						/>
					</button>
					<MenuList
						open={refreshOpen}
						items={refreshItems}
						selectedValue={refreshSeconds}
						onSelect={pickRefresh}
						onClose={closeRefreshMenu}
						ariaLabel="Selang penyegaran otomatis"
						width="w-max min-w-full"
					/>
				</div>
			</div>
		</div>
		<button
			type="submit"
			disabled={controlsDisabled || applying}
			class="cursor-pointer rounded-lg bg-(--c-accent) px-5 py-2 text-[13px] font-semibold text-(--c-on-accent) transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Terapkan Filter
		</button>
	</div>
</form>
