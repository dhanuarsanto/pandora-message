<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let {
		error,
		errorDetail,
		onRetry,
		reloadPath
	}: {
		error: string;
		errorDetail: string | null;
		onRetry: () => void;
		reloadPath: '/inbox' | '/outbox';
	} = $props();
</script>

<div
	class="flex flex-1 items-center justify-center rounded-xl border border-(--c-border) bg-(--c-surface)"
>
	<div class="max-w-md px-6 text-center" role="alert">
		<p class="text-[14px] font-semibold text-(--c-fg)">Gagal memuat data</p>
		<p class="mt-1.5 text-[12px] leading-relaxed text-(--c-fg-muted)">{error}</p>
		{#if errorDetail}
			<p class="mt-1 font-mono text-[11px] text-(--c-fg-faint)">{errorDetail}</p>
		{/if}
		<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
			<button
				onclick={onRetry}
				class="rounded-lg bg-(--c-accent) px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
			>
				Coba lagi
			</button>
			<button
				onclick={() => goto(resolve(reloadPath), { invalidateAll: true })}
				class="rounded-lg border border-(--c-border) px-4 py-1.5 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent)"
			>
				Muat ulang halaman
			</button>
		</div>
	</div>
</div>
