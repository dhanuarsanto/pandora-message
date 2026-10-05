<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let {
		error,
		errorDetail,
		onRetry
	}: {
		error: string;
		errorDetail: string | null;
		onRetry: () => void;
	} = $props();

	const isSessionExpired = $derived(error.includes('Sesi berakhir'));
	let loggingOut = $state(false);

	async function handleLogout() {
		if (loggingOut) return;
		loggingOut = true;
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} finally {
			await goto(resolve('/login'));
		}
	}
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
			{#if isSessionExpired}
				<button
					onclick={handleLogout}
					disabled={loggingOut}
					class="rounded-lg bg-(--c-danger) px-5 py-2 text-[13px] font-semibold text-(--c-on-accent) transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if loggingOut}
						<span
							class="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--c-on-accent)/30 border-t-(--c-on-accent)"
						></span>
						Keluar...
					{:else}
						Keluar
					{/if}
				</button>
			{:else}
				<button
					onclick={onRetry}
					class="rounded-lg bg-(--c-accent) px-5 py-2 text-[13px] font-semibold text-(--c-on-accent) transition-colors hover:opacity-90"
				>
					Coba lagi
				</button>
			{/if}
		</div>
	</div>
</div>
