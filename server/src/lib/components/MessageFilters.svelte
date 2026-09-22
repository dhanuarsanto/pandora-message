<script lang="ts">
	import { KODE_TERMINAL } from '$lib/config';
	import type { FilterField, ResellerResponse } from '$lib/types';

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
		resellers: ResellerResponse | null | Promise<ResellerResponse | null>;
		controlsDisabled: boolean;
		onReset: () => void;
		onApply: () => void;
	} = $props();

	const controlCls =
		'h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) px-2.5 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60';
</script>

<form
	class="mb-5 rounded-xl border border-(--c-border) bg-(--c-surface) p-5"
	onsubmit={(e) => {
		e.preventDefault();
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
		{#each filters.filter((f) => f.type !== 'checkbox') as f (f.param)}
			<div>
				<label
					for={'f-' + f.param}
					class="mb-1.5 block text-[11px] font-semibold tracking-widest text-(--c-fg-muted) uppercase"
					>{f.label}</label
				>
				{#if f.type === 'date'}
					<input
						id={'f-' + f.param}
						type="date"
						bind:value={query[f.param]}
						disabled={controlsDisabled}
						class={controlCls}
					/>
				{:else if f.type === 'number'}
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
				{:else}
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
			disabled={controlsDisabled}
			class="rounded-lg bg-(--c-accent) px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Terapkan Filter
		</button>
	</div>
</form>
