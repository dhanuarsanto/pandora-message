<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { appBusy } from '$lib/appBusy.svelte.js';
	import { APP_NAME, RULES } from '$lib/config';
	import { theme } from '$lib/theme';
	import { Inbox, LogOut, Mail, Menu, Moon, Send, Sun, X } from '@lucide/svelte';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);
	let confirmLogout = $state(false);
	let loggingOut = $state(false);
	let menuOpen = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	const navBusy = $derived(appBusy.value);

	let isDark = $derived((page.data.theme ?? $theme) === 'dark');
	let username = $derived(page.data.username ?? 'admin');
	let displayUsername = $derived(username.slice(0, 1).toUpperCase() + username.slice(1) || 'User');
	let initial = $derived(username.slice(0, 1).toUpperCase() || 'U');
	let rules = $derived(formatRules(page.data.rules));

	$effect(() => {
		if (pathname) menuOpen = false;
	});

	let menuBtn = $state<HTMLButtonElement | null>(null);
	let menuPanel = $state<HTMLElement | null>(null);

	$effect(() => {
		if (typeof window === 'undefined' || !menuOpen) return;
		menuPanel?.querySelector<HTMLElement>('a, button')?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				menuOpen = false;
				menuBtn?.focus();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function toggleTheme() {
		theme.toggle();
	}

	function openConfirm() {
		if (confirmTimer) clearTimeout(confirmTimer);
		confirmLogout = true;
		confirmTimer = setTimeout(() => (confirmLogout = false), 3000);
	}

	function cancelConfirm() {
		if (confirmTimer) clearTimeout(confirmTimer);
		confirmLogout = false;
	}

	async function confirmAndLogout() {
		if (loggingOut) return;
		loggingOut = true;
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} finally {
			appBusy.value = true;
			await goto(resolve('/login'));
		}
	}

	function formatRules(code: string | null): string | null {
		if (!code) return null;
		return RULES[code.trim().toLowerCase()] ?? code;
	}
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-(--c-bg)">
	<header class="z-20 shrink-0 border-b border-(--c-border) bg-(--c-surface)/80 backdrop-blur-xl">
		<div class="mx-auto flex h-15 max-w-375 items-center gap-3.5 px-[clamp(16px,3vw,28px)]">
			<a
				href={resolve('/inbox')}
				aria-disabled={navBusy}
				class="mr-auto flex items-center gap-2.5 {navBusy ? 'pointer-events-none opacity-60' : ''}"
			>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-linear-to-br from-(--c-accent) to-(--c-accent-strong) shadow-[0_6px_14px_-6px_rgba(14,122,74,0.5)]"
				>
					<Mail class="h-4 w-4 text-white" />
				</div>
				<span class="text-[15px] font-bold tracking-[-0.01em] text-(--c-fg)">{APP_NAME}</span>
			</a>

			<nav class="hidden items-center gap-1 md:flex">
				<a
					href={resolve('/inbox')}
					aria-disabled={navBusy}
					class="flex items-center gap-1.75 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors {pathname.startsWith(
						'/inbox'
					)
						? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
						: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)'} {navBusy
						? 'pointer-events-none opacity-60'
						: ''}"
				>
					<Inbox class="h-4 w-4 stroke-2" />
					Inbox
				</a>
				<a
					href={resolve('/outbox')}
					aria-disabled={navBusy}
					class="flex items-center gap-1.75 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors {pathname.startsWith(
						'/outbox'
					)
						? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
						: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)'} {navBusy
						? 'pointer-events-none opacity-60'
						: ''}"
				>
					<Send class="h-4 w-4 stroke-2" />
					Outbox
				</a>
			</nav>

			<div class="hidden items-center gap-2.5 text-(--c-fg-muted) md:flex">
				<button
					onclick={toggleTheme}
					class="flex h-8 w-8 items-center justify-center rounded-[10px] text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-3) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
					aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
					title={isDark ? 'Mode terang' : 'Mode gelap'}
				>
					{#if isDark}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>

				<div
					class="flex items-center gap-1.5 rounded-[10px] border border-(--c-border) bg-(--c-surface) py-1.5 pr-3 pl-1.5 transition-colors hover:border-(--c-accent)"
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-(--c-accent) to-(--c-accent-strong) text-xs font-bold text-white shadow-[0_4px_10px_-4px_rgba(14,122,74,0.5)]"
					>
						{initial}
					</div>
					<div class="leading-none">
						<p
							class="max-w-32.5 truncate text-[13px] font-semibold tracking-wider text-(--c-fg)"
							title={username}
						>
							{displayUsername}
						</p>
						{#if rules}
							<p
								class="mt-1 text-[10px] font-semibold tracking-wider text-(--c-accent-strong) uppercase"
							>
								{rules}
							</p>
						{/if}
					</div>
				</div>

				{#if !confirmLogout}
					<button
						onclick={openConfirm}
						disabled={navBusy}
						class="flex items-center gap-1.5 rounded-[10px] border border-(--c-border) px-3 py-2 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-fg) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
					>
						<LogOut class="h-3.5 w-3.5" />
						Keluar
					</button>
				{:else}
					<div class="flex items-center gap-1.5">
						<button
							onclick={confirmAndLogout}
							disabled={loggingOut || navBusy}
							class="flex items-center gap-1.5 rounded-[10px] border border-(--c-danger) bg-(--c-danger-bg) px-3 py-2 text-xs font-semibold text-(--c-danger) transition-colors hover:bg-(--c-danger-bg-2) disabled:opacity-60"
						>
							{#if loggingOut}
								<span
									class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-(--c-danger-bg-2) border-t-(--c-danger)"
								></span>
								Keluar...
							{:else}
								Yakin?
							{/if}
						</button>
						<button
							onclick={cancelConfirm}
							disabled={loggingOut || navBusy}
							class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-(--c-border) text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-fg) hover:text-(--c-fg) disabled:opacity-60"
							aria-label="Batal"
						>
							×
						</button>
					</div>
				{/if}
			</div>

			<!-- Mobile: hamburger -->
			<div class="flex items-center gap-2 md:hidden">
				<button
					onclick={toggleTheme}
					class="flex h-9 w-9 items-center justify-center rounded-[10px] text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-3) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
					aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
				>
					{#if isDark}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>
				<button
					bind:this={menuBtn}
					onclick={() => (menuOpen = !menuOpen)}
					class="flex h-9 w-9 items-center justify-center rounded-[10px] text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-3) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
					aria-label="Menu"
					aria-expanded={menuOpen}
				>
					{#if menuOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile dropdown menu -->
		{#if menuOpen}
			<div bind:this={menuPanel} class="border-t border-(--c-border) bg-(--c-surface) md:hidden">
				<div class="flex flex-col gap-1 px-4 py-3">
					<div class="mb-2 flex items-center gap-3">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-(--c-accent) to-(--c-accent-strong) text-sm font-bold text-white shadow-[0_4px_10px_-4px_rgba(14,122,74,0.5)]"
						>
							{initial}
						</div>
						<div class="min-w-0 leading-none">
							<p
								class="truncate text-sm font-semibold tracking-wider text-(--c-fg)"
								title={username}
							>
								{displayUsername}
							</p>
							{#if rules}
								<p
									class="mt-1 text-[10px] font-semibold tracking-wider text-(--c-accent-strong) uppercase"
								>
									{rules}
								</p>
							{/if}
						</div>
					</div>

					<a
						href={resolve('/inbox')}
						aria-disabled={navBusy}
						onclick={() => (menuOpen = false)}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {pathname.startsWith(
							'/inbox'
						)
							? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
							: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)'} {navBusy
							? 'pointer-events-none opacity-60'
							: ''}"
					>
						<Inbox class="h-4 w-4" />
						Inbox
					</a>
					<a
						href={resolve('/outbox')}
						aria-disabled={navBusy}
						onclick={() => (menuOpen = false)}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {pathname.startsWith(
							'/outbox'
						)
							? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
							: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)'} {navBusy
							? 'pointer-events-none opacity-60'
							: ''}"
					>
						<Send class="h-4 w-4" />
						Outbox
					</a>

					<div class="my-1 h-px bg-(--c-border)"></div>

					{#if !confirmLogout}
						<button
							onclick={openConfirm}
							disabled={navBusy}
							class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-3) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
						>
							<LogOut class="h-4 w-4" />
							Keluar
						</button>
					{:else}
						<div class="flex items-center gap-2 px-3 py-1">
							<button
								onclick={confirmAndLogout}
								disabled={loggingOut || navBusy}
								class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-(--c-danger) bg-(--c-danger-bg) px-3 py-2.5 text-sm font-semibold text-(--c-danger) transition-colors hover:bg-(--c-danger-bg-2) disabled:opacity-60"
							>
								{#if loggingOut}
									<span
										class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--c-danger-bg-2) border-t-(--c-danger)"
									></span>
									Keluar...
								{:else}
									Yakin?
								{/if}
							</button>
							<button
								onclick={cancelConfirm}
								disabled={loggingOut || navBusy}
								class="flex h-9 w-9 items-center justify-center rounded-lg border border-(--c-border) text-(--c-fg-muted) transition-colors hover:border-(--c-fg) hover:text-(--c-fg) disabled:opacity-60"
								aria-label="Batal"
							>
								×
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</header>

	<div id="app-scroll" class="min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
		{@render children()}
	</div>
</div>
