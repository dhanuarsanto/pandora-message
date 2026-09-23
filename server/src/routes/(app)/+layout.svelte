<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { appBusy } from '$lib/appBusy.svelte.js';
	import LogoutControl from '$lib/components/LogoutControl.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import UserChip from '$lib/components/UserChip.svelte';
	import { APP_NAME, RULES } from '$lib/config';
	import { theme } from '$lib/theme';
	import { cn } from '$lib/utils';
	import { Inbox, Mail, Menu, Send, X } from '@lucide/svelte';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);
	let confirmLogout = $state(false);
	let loggingOut = $state(false);
	let menuOpen = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;
	let menuBtn = $state<HTMLButtonElement | null>(null);
	let menuPanel = $state<HTMLElement | null>(null);

	const navBusy = $derived(appBusy.value);

	let isDark = $derived((page.data.theme ?? $theme) === 'dark');
	let username = $derived(page.data.username ?? 'admin');
	let displayUsername = $derived(username.slice(0, 1).toUpperCase() + username.slice(1) || 'User');
	let initial = $derived(username.slice(0, 1).toUpperCase() || 'U');
	let rules = $derived(formatRules(page.data.rules));

	$effect(() => {
		if (pathname) menuOpen = false;
	});

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
				class={cn('mr-auto flex items-center gap-2.5', navBusy && 'pointer-events-none')}
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
					class={cn(
						'flex items-center gap-1.75 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors',
						pathname.startsWith('/inbox')
							? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
							: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)',
						navBusy && 'pointer-events-none'
					)}
				>
					<Inbox class="h-4 w-4 stroke-2" />
					Inbox
				</a>
				<a
					href={resolve('/outbox')}
					aria-disabled={navBusy}
					class={cn(
						'flex items-center gap-1.75 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors',
						pathname.startsWith('/outbox')
							? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
							: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)',
						navBusy && 'pointer-events-none'
					)}
				>
					<Send class="h-4 w-4 stroke-2" />
					Outbox
				</a>
			</nav>

			<div class="hidden items-center gap-2.5 text-(--c-fg-muted) md:flex">
				<ThemeToggle {isDark} />
				<UserChip {initial} name={displayUsername} titleName={username} {rules} />
				<LogoutControl
					size="md"
					confirm={confirmLogout}
					busy={navBusy}
					loading={loggingOut}
					onOpen={openConfirm}
					onCancel={cancelConfirm}
					onConfirm={confirmAndLogout}
				/>
			</div>

			<div class="flex items-center gap-2 md:hidden">
				<ThemeToggle {isDark} size="lg" />
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

		{#if menuOpen}
			<div bind:this={menuPanel} class="border-t border-(--c-border) bg-(--c-surface) md:hidden">
				<div class="flex flex-col gap-1 px-4 py-3">
					<UserChip {initial} name={displayUsername} titleName={username} {rules} size="lg" />
					<a
						href={resolve('/inbox')}
						aria-disabled={navBusy}
						onclick={() => (menuOpen = false)}
						class={cn(
							'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
							pathname.startsWith('/inbox')
								? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
								: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)',
							navBusy && 'pointer-events-none'
						)}
					>
						<Inbox class="h-4 w-4" />
						Inbox
					</a>
					<a
						href={resolve('/outbox')}
						aria-disabled={navBusy}
						onclick={() => (menuOpen = false)}
						class={cn(
							'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
							pathname.startsWith('/outbox')
								? 'bg-(--c-accent-soft) text-(--c-accent-strong)'
								: 'text-(--c-fg-muted) hover:bg-(--c-surface-3) hover:text-(--c-fg)',
							navBusy && 'pointer-events-none'
						)}
					>
						<Send class="h-4 w-4" />
						Outbox
					</a>

					<div class="my-1 h-px bg-(--c-border)"></div>

					<LogoutControl
						size="lg"
						confirm={confirmLogout}
						busy={navBusy}
						loading={loggingOut}
						onOpen={openConfirm}
						onCancel={cancelConfirm}
						onConfirm={confirmAndLogout}
					/>
				</div>
			</div>
		{/if}
	</header>

	<div id="app-scroll" class="min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
		{@render children()}
	</div>
</div>
