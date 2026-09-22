<script lang="ts">
	import { LogOut } from '@lucide/svelte';

	let {
		confirm,
		busy,
		loading,
		size = 'md',
		onOpen,
		onCancel,
		onConfirm
	}: {
		confirm: boolean;
		busy: boolean;
		loading: boolean;
		size?: 'md' | 'lg';
		onOpen: () => void;
		onCancel: () => void;
		onConfirm: () => void;
	} = $props();
</script>

{#if !confirm}
	{#if size === 'md'}
		<button
			onclick={onOpen}
			disabled={busy}
			class="flex items-center gap-1.5 rounded-[10px] border border-(--c-border) px-3 py-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-fg) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
		>
			<LogOut class="h-3.5 w-3.5" />
			Keluar
		</button>
	{:else}
		<button
			onclick={onOpen}
			disabled={busy}
			class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-3) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
		>
			<LogOut class="h-4 w-4" />
			Keluar
		</button>
	{/if}
{:else}
	{#if size === 'md'}
		<div class="flex items-center gap-1.5">
			<button
				onclick={onConfirm}
				disabled={busy || loading}
				class="flex items-center gap-1.5 rounded-[10px] border border-(--c-danger) bg-(--c-danger-bg) px-3 py-2 text-xs font-semibold text-(--c-danger) transition-colors hover:bg-(--c-danger-bg-2) disabled:opacity-60"
			>
				{#if loading}
					<span
						class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-(--c-danger-bg-2) border-t-(--c-danger)"
					></span>
					Keluar...
				{:else}
					Yakin?
				{/if}
			</button>
			<button
				onclick={onCancel}
				disabled={busy || loading}
				class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-(--c-border) text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-fg) hover:text-(--c-fg) disabled:opacity-60"
				aria-label="Batal"
			>
				×
			</button>
		</div>
	{:else}
		<div class="flex items-center gap-2 px-3 py-1">
			<button
				onclick={onConfirm}
				disabled={busy || loading}
				class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-(--c-danger) bg-(--c-danger-bg) px-3 py-2.5 text-sm font-semibold text-(--c-danger) transition-colors hover:bg-(--c-danger-bg-2) disabled:opacity-60"
			>
				{#if loading}
					<span
						class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--c-danger-bg-2) border-t-(--c-danger)"
					></span>
					Keluar...
				{:else}
					Yakin?
				{/if}
			</button>
			<button
				onclick={onCancel}
				disabled={busy || loading}
				class="flex h-9 w-9 items-center justify-center rounded-lg border border-(--c-border) text-(--c-fg-muted) transition-colors hover:border-(--c-fg) hover:text-(--c-fg) disabled:opacity-60"
				aria-label="Batal"
			>
				×
			</button>
		</div>
	{/if}
{/if}
