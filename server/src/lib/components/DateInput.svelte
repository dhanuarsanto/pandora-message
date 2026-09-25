<script lang="ts">
	import { Calendar, Check, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { closePicker, isPickerOpen, openPicker } from '$lib/client/datePickerState.svelte';
	import { BULAN, HARI, monthCells, parseISODate, toISODate, todayISO } from '$lib/date';
	import { cn } from '$lib/utils';

	let {
		value = $bindable(),
		id,
		ariaLabel,
		disabled
	}: {
		value?: string;
		id: string;
		ariaLabel?: string;
		disabled: boolean;
	} = $props();

	function fmtDisp(v: string | undefined): string {
		const d = parseISODate(v);
		if (!d) return '';
		return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
	}

	const today = parseISODate(todayISO()) ?? new Date();
	const key = Symbol();
	const open = $derived(isPickerOpen(key));
	let view = $state<Date>(parseISODate(value) ? (parseISODate(value) as Date) : new Date(today));
	let panel: HTMLDivElement | null = $state(null);
	let btn: HTMLButtonElement | null = $state(null);

	const viewKey = $derived(`${view.getFullYear()}-${view.getMonth()}`);
	let mode = $state<'days' | 'months' | 'years'>('days');
	const yearsBase = $derived(Math.floor(view.getFullYear() / 12) * 12);
	const headerLabel = $derived(
		mode === 'days'
			? `${BULAN[view.getMonth()]} ${view.getFullYear()}`
			: mode === 'months'
				? String(view.getFullYear())
				: `${yearsBase} - ${yearsBase + 11}`
	);
	const cells = $derived(monthCells(view.getFullYear(), view.getMonth()));

	function moveView(delta: number) {
		const y = view.getFullYear();
		const m = view.getMonth();
		if (mode === 'days') view = new Date(y, m + delta, 1);
		else if (mode === 'months') view = new Date(y + delta, m, 1);
		else view = new Date(y + delta * 12, m, 1);
	}

	function enterMode() {
		if (mode === 'days') mode = 'months';
		else if (mode === 'months') mode = 'years';
	}

	function pick(iso: string) {
		value = iso;
		close();
	}

	function toggle() {
		if (disabled) return;
		if (open) {
			closePicker();
			return;
		}
		openPicker(key);
		mode = 'days';
		view = parseISODate(value) ? (parseISODate(value) as Date) : new Date(today);
	}

	function close() {
		closePicker();
		btn?.focus();
	}

	function onDayKeydown(iso: string, e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(iso);
		}
	}

	$effect(() => {
		if (!open || !panel) return;
		const onPointer = (e: PointerEvent) => {
			const t = e.target as Element | null;
			if (!t || !t.closest('[data-date-picker]')) close();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};
		window.addEventListener('pointerdown', onPointer);
		window.addEventListener('keydown', onKey);
		panel.focus();
		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="relative" data-date-picker>
	<button
		bind:this={btn}
		{id}
		type="button"
		{disabled}
		aria-label={ariaLabel}
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
		class="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 text-left text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60"
	>
		<span class={cn(!fmtDisp(value) && 'text-(--c-fg-faint)')}>
			{fmtDisp(value) || 'Pilih tanggal'}
		</span>
		<Calendar class="h-4 w-4 shrink-0 text-(--c-fg-faint)" />
	</button>

	{#if open}
		<div
			bind:this={panel}
			role="dialog"
			aria-label="Pilih tanggal"
			tabindex="-1"
			class="absolute z-30 mt-1.5 w-70 rounded-xl border border-(--c-border) bg-(--c-surface) p-3 shadow-[0_16px_48px_-12px_rgba(20,32,26,0.3)]"
		>
			<div class="mb-2 flex items-center justify-between gap-1">
				<button
					type="button"
					onclick={() => moveView(-1)}
					aria-label={mode === 'days'
						? 'Bulan sebelumnya'
						: mode === 'months'
							? 'Tahun sebelumnya'
							: 'Rentang tahun sebelumnya'}
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-2) hover:text-(--c-accent)"
				>
					<ChevronLeft class="h-4 w-4" /></button
				>
				<button
					type="button"
					onclick={enterMode}
					aria-label="Pilih bulan dan tahun"
					class="min-h-7 flex-1 truncate rounded-md px-1 text-[12.5px] font-semibold text-(--c-fg) transition-colors hover:bg-(--c-surface-2) hover:text-(--c-accent)"
				>
					{headerLabel}
				</button>
				<button
					type="button"
					onclick={() => moveView(1)}
					aria-label={mode === 'days'
						? 'Bulan berikutnya'
						: mode === 'months'
							? 'Tahun berikutnya'
							: 'Rentang tahun berikutnya'}
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-2) hover:text-(--c-accent)"
				>
					<ChevronRight class="h-4 w-4" /></button
				>
			</div>
			{#if mode === 'days'}
				<div class="grid grid-cols-7 gap-0.5 text-center">
					{#each HARI as h (h)}
						<span
							class="py-1 text-[10px] font-semibold tracking-widest text-(--c-fg-faint) uppercase"
							>{h}</span
						>
					{/each}
					{#each cells as cell, ci (viewKey + '-' + ci)}
						{#if cell.d === null}
							<span class="h-8"></span>
						{:else}
							<button
								type="button"
								tabindex="-1"
								aria-label={cell.iso}
								onclick={() => pick(cell.iso)}
								onkeydown={(e) => onDayKeydown(cell.iso, e)}
								class={cn(
									'flex h-8 items-center justify-center rounded-lg text-[12.5px] transition-colors',
									cell.iso === value
										? 'bg-(--c-accent) font-semibold text-white'
										: cell.iso === toISODate(today)
											? 'font-semibold text-(--c-accent)'
											: 'text-(--c-fg) hover:bg-(--c-surface-2)'
								)}>{cell.d}</button
							>
						{/if}
					{/each}
				</div>
			{:else if mode === 'months'}
				<div class="grid grid-cols-3 gap-1">
					{#each BULAN as b, i (b)}
						<button
							type="button"
							tabindex="-1"
							onclick={() => {
								view = new Date(view.getFullYear(), i, 1);
								mode = 'days';
							}}
							class={cn(
								'flex h-9 items-center justify-center rounded-lg text-[12.5px] transition-colors',
								i === view.getMonth()
									? 'bg-(--c-accent) font-semibold text-white'
									: 'text-(--c-fg) hover:bg-(--c-surface-2)'
							)}>{b.slice(0, 3)}</button
						>
					{/each}
				</div>
			{:else}
				<div class="grid grid-cols-3 gap-1">
					{#each Array.from({ length: 12 }, (_, k) => yearsBase + k) as yy (yy)}
						<button
							type="button"
							tabindex="-1"
							onclick={() => {
								view = new Date(yy, view.getMonth(), 1);
								mode = 'months';
							}}
							class={cn(
								'flex h-9 items-center justify-center rounded-lg text-[12.5px] transition-colors',
								yy === view.getFullYear()
									? 'bg-(--c-accent) font-semibold text-white'
									: 'text-(--c-fg) hover:bg-(--c-surface-2)'
							)}>{yy}</button
						>
					{/each}
				</div>
			{/if}
			<div class="mt-2 flex items-center justify-between border-t border-(--c-border) pt-2">
				<button
					type="button"
					onclick={() => {
						value = toISODate(today);
						close();
					}}
					class="flex items-center gap-1 text-[11.5px] font-medium text-(--c-accent-strong) hover:underline"
				>
					<Check class="h-3 w-3" />
					Hari ini
				</button>
				<button
					type="button"
					onclick={() => {
						value = '';
						close();
					}}
					class="text-[11.5px] font-medium text-(--c-fg-muted) hover:text-(--c-danger) hover:underline"
					>Kosongkan</button
				>
			</div>
		</div>
	{/if}
</div>
