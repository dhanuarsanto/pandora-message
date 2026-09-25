<script lang="ts">
	import { Check, ChevronDown, Search } from '@lucide/svelte';
	import { closeSelect, isSelectOpen, openSelect } from '$lib/client/selectState.svelte';
	import { cn } from '$lib/utils';

	type Option = { value: string; label: string };

	let {
		value = $bindable(),
		id,
		ariaLabel,
		placeholder = 'Semua',
		emptyText = 'Belum ada data',
		options = [],
		disabled,
		searchable = false
	}: {
		value?: string;
		id: string;
		ariaLabel?: string;
		placeholder?: string;
		emptyText?: string;
		options?: Option[];
		disabled: boolean;
		searchable?: boolean;
	} = $props();

	const key = Symbol();
	const open = $derived(isSelectOpen(key));
	let panel: HTMLDivElement | null = $state(null);
	let btn: HTMLButtonElement | null = $state(null);
	let searchInput: HTMLInputElement | null = $state(null);
	let search = $state('');

	const selectedLabel = $derived(
		options.find((o) => o.value === value)?.label ?? (value ? String(value) : '')
	);

	const filteredOptions = $derived(
		searchable
			? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
			: options
	);

	function toggle() {
		if (disabled) return;
		if (open) {
			closeSelect();
			return;
		}
		search = '';
		openSelect(key);
	}

	function pick(v: string) {
		value = v;
		closeSelect();
		btn?.focus();
	}

	$effect(() => {
		if (!open) return;
		if (searchable) {
			searchInput?.focus();
		} else {
			panel?.focus();
		}
	});

	$effect(() => {
		if (!open || !panel) return;
		const onPointer = (e: PointerEvent) => {
			const t = e.target as Element | null;
			if (!t || !t.closest('[data-filter-select]')) closeSelect();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeSelect();
		};
		window.addEventListener('pointerdown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="relative" data-filter-select>
	<button
		bind:this={btn}
		{id}
		type="button"
		{disabled}
		aria-label={ariaLabel}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={toggle}
		class="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 text-left text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
	>
		<span
			title={selectedLabel || placeholder}
			class={cn('min-w-0 truncate', !selectedLabel && 'text-(--c-fg-faint)')}
			>{selectedLabel || placeholder}</span
		>
		<ChevronDown
			class={cn('h-4 w-4 shrink-0 text-(--c-fg-faint) transition-transform', open && 'rotate-180')}
		/>
	</button>

	{#if open}
		<div
			bind:this={panel}
			role="listbox"
			aria-label={ariaLabel}
			tabindex="-1"
			class="absolute z-30 mt-1.5 max-h-64 w-full rounded-xl border border-(--c-border) bg-(--c-surface) p-1 shadow-[0_16px_48px_-12px_rgba(20,32,26,0.3)]"
		>
			{#if searchable}
				<div class="relative mb-1">
					<Search
						class="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-(--c-fg-faint)"
					/>
					<input
						bind:this={searchInput}
						type="text"
						autocomplete="off"
						aria-label={'Cari ' + (ariaLabel ?? 'opsi')}
						placeholder="Cari…"
						bind:value={search}
						class="h-8 w-full rounded-lg border border-(--c-border) bg-(--c-surface-2) pr-2.5 pl-7 text-[12.5px] text-(--c-fg) outline-none focus:border-(--c-accent)"
					/>
				</div>
			{/if}
			<div class="max-h-56 overflow-y-auto">
				<button
					type="button"
					role="option"
					aria-selected={value === ''}
					tabindex="-1"
					onclick={() => pick('')}
					class={cn(
						'flex w-full cursor-pointer items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
						value === ''
							? 'bg-(--c-accent-soft) font-medium text-(--c-accent-strong)'
							: 'text-(--c-fg) hover:bg-(--c-surface-2)'
					)}
				>
					<span class="min-w-0 flex-1">{placeholder}</span>
					{#if value === ''}
						<Check class="mt-0.5 h-4 w-4 shrink-0" />
					{/if}
				</button>
				{#if options.length === 0}
					<div class="px-3 py-2 text-[12.5px] text-(--c-fg-faint)">{emptyText}</div>
				{:else if filteredOptions.length === 0}
					<div class="px-3 py-2 text-[12.5px] text-(--c-fg-faint)">Tidak ditemukan</div>
				{:else}
					{#each filteredOptions as o (o.value)}
						<button
							type="button"
							role="option"
							aria-selected={o.value === value}
							tabindex="-1"
							onclick={() => pick(o.value)}
							class={cn(
								'flex w-full cursor-pointer items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
								o.value === value
									? 'bg-(--c-accent-soft) font-medium text-(--c-accent-strong)'
									: 'text-(--c-fg) hover:bg-(--c-surface-2)'
							)}
						>
							<span title={o.label} class="min-w-0 flex-1">{o.label}</span>
							{#if o.value === value}
								<Check class="mt-0.5 h-4 w-4 shrink-0" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
