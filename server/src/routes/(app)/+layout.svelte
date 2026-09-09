<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto(resolve('/login'));
	}
</script>

<div class="min-h-screen bg-[#f2f4f2]">
	<header
		class="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe4df] bg-white px-7 py-3"
	>
		<a href={resolve('/inbox')} class="flex items-center gap-2.5">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e7a4a] text-xs font-bold text-white"
			>
				P
			</div>
			<span class="text-sm font-bold">Pandora</span>
		</a>
		<div class="flex items-center gap-3 text-sm text-[#5b6b60]">
			<span>{page.data.username ?? 'admin'}</span>
			<button
				onclick={logout}
				class="rounded-lg border border-[#dfe4df] bg-white px-3.5 py-1.5 text-xs font-medium text-[#5b6b60] transition-colors hover:border-[#14211b] hover:text-[#14211b]"
			>
				Keluar
			</button>
		</div>
	</header>

	<nav class="border-b-2 border-[#dfe4df] bg-white">
		<div class="mx-auto flex max-w-375 px-7">
			<a
				href={resolve('/inbox')}
				class="relative px-5 py-2.5 text-[13px] font-semibold tracking-widest uppercase transition-colors {pathname.startsWith(
					'/inbox'
				)
					? 'text-[#14211b]'
					: 'text-[#5b6b60] hover:text-[#14211b]'}"
			>
				Inbox
				{#if pathname.startsWith('/inbox')}
					<span class="absolute right-0 -bottom-0.5 left-0 h-0.5 bg-[#0e7a4a]"></span>
				{/if}
			</a>
			<a
				href={resolve('/outbox')}
				class="relative px-5 py-2.5 text-[13px] font-semibold tracking-widest uppercase transition-colors {pathname.startsWith(
					'/outbox'
				)
					? 'text-[#14211b]'
					: 'text-[#5b6b60] hover:text-[#14211b]'}"
			>
				Outbox
				{#if pathname.startsWith('/outbox')}
					<span class="absolute right-0 -bottom-0.5 left-0 h-0.5 bg-[#0e7a4a]"></span>
				{/if}
			</a>
		</div>
	</nav>

	{@render children()}
</div>
