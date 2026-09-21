<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { APP_NAME } from '$lib/config';
	import { ArrowRight, CircleAlert, Clock, Eye, EyeOff, Lock, Mail, User } from '@lucide/svelte';

	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let showPassword = $state(false);
	let alertMessage = $state('');
	let alertTimer: ReturnType<typeof setTimeout> | null = null;

	function showAlert(msg: string) {
		alertMessage = msg;
		if (alertTimer) clearTimeout(alertTimer);
		alertTimer = setTimeout(() => (alertMessage = ''), 4000);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!username.trim() || !password) {
			showAlert('Lengkapi username dan password.');
			return;
		}
		if (loading) return;

		alertMessage = '';
		loading = true;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), password })
			});
			const data = await res.json();

			if (data.status === 'sukses') {
				goto(resolve('/inbox'));
			} else {
				showAlert(data.message || 'Username atau password salah.');
			}
		} catch {
			showAlert('Terjadi kesalahan, coba lagi.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Masuk — {APP_NAME}</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-(--c-bg) p-[clamp(16px,4vw,40px)]">
	<div
		class="grid min-h-160 w-full max-w-260 grid-cols-1 overflow-hidden rounded-3xl border border-(--c-border) bg-(--c-surface) shadow-[0_2px_4px_rgba(20,32,26,0.04),0_16px_40px_-8px_rgba(20,32,26,0.14)] lg:min-h-0 lg:grid-cols-[1.05fr_1fr]"
	>
		<!-- Panel kiri (visual) -->
		<div class="relative hidden overflow-hidden text-white lg:block">
			<div class="absolute inset-0 bg-[linear-gradient(160deg,#0c1613,#10201a_55%,#0f2e20)]"></div>
			<div
				class="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(14,122,74,0.35),transparent_60%),radial-gradient(50%_40%_at_100%_100%,rgba(255,255,255,0.05),transparent_60%)]"
			></div>
			<div
				class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[42px_42px] opacity-5"
			></div>

			<div class="relative flex h-full flex-col justify-between p-9 lg:p-11">
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-[11px] bg-linear-to-br from-[#16a34a] to-[#0a5f3a] shadow-[0_8px_20px_-6px_rgba(14,122,74,0.6)]"
					>
						<Mail class="h-5 w-5 text-white" />
					</div>
					<span class="text-base font-bold tracking-[-0.01em]">{APP_NAME}</span>
				</div>

				<div class="flex flex-1 flex-col justify-center py-6">
					<span
						class="mb-5 inline-flex w-max items-center gap-2 rounded-full border border-[rgba(127,212,168,0.25)] px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#7fd4a8] uppercase"
					>
						<Clock class="h-3 w-3 text-[#7fd4a8]" />
						Internal System
					</span>
					<h1 class="text-[clamp(38px,4.4vw,56px)] leading-[1.02] font-bold tracking-[-0.035em]">
						Sistem Internal.
					</h1>
					<p class="mt-4 max-w-85 text-[15px] leading-[1.6] text-white/65">
						Kelola semua pesan masuk dan keluar dalam satu dashboard yang aman.
					</p>
				</div>

				<div
					class="flex items-center gap-3.5 text-[11px] tracking-[0.18em] text-white/40 uppercase"
				>
					{APP_NAME} &copy; 2026
					<span class="h-px flex-1 bg-white/10"></span>
				</div>
			</div>
		</div>

		<!-- Panel kanan (form) -->
		<div class="flex items-center justify-center p-[clamp(28px,5vw,56px)]">
			<div class="w-full max-w-92.5">
				<div class="mb-7 flex items-center gap-2.5 lg:hidden">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#16a34a] to-[#0a5f3a] shadow-[0_8px_18px_-6px_rgba(14,122,74,0.45)]"
					>
						<Mail class="h-5 w-5 text-white" />
					</div>
					<span class="text-[17px] font-bold tracking-[-0.01em] text-(--c-fg)">{APP_NAME}</span>
				</div>

				<div
					class="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-(--c-fg-faint) uppercase"
				>
					<Lock class="h-3 w-3 text-(--c-accent)" />
					Autentikasi
				</div>
				<h1 class="text-[28px] leading-[1.1] font-bold tracking-[-0.02em] text-(--c-fg)">
					Masuk ke dashboard
				</h1>
				<p class="mt-1.5 mb-7 text-sm text-(--c-fg-muted)">
					Gunakan akun yang telah terdaftar untuk mengakses dashboard.
				</p>

				{#if alertMessage}
					<div
						class="mb-4 flex animate-[slideDown_0.25s_ease] items-start gap-2.5 rounded-[11px] border border-(--c-danger-bg-2) bg-(--c-danger-bg) p-3 text-[13px] leading-normal text-(--c-danger)"
					>
						<CircleAlert class="mt-0.5 h-4.5 w-4.5 shrink-0 text-(--c-danger)" />
						<span>{alertMessage}</span>
					</div>
				{/if}

				<form onsubmit={handleSubmit}>
					<div class="mb-4.5">
						<label
							for="username"
							class="mb-2 block text-xs font-semibold tracking-[0.06em] text-(--c-fg-muted) uppercase"
							>Username</label
						>
						<div class="group relative">
							<User
								class="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-(--c-fg-faint) transition-[color] duration-200 group-focus-within:text-(--c-accent)"
							/>
							<input
								type="text"
								id="username"
								placeholder="Masukkan username"
								autocomplete="username"
								bind:value={username}
								disabled={loading}
								oninput={() => (alertMessage = '')}
								class="h-12 w-full rounded-xl border border-(--c-border) bg-(--c-surface-2) pr-3 pl-10.5 text-[15px] text-(--c-fg) transition-[border-color,box-shadow,background] duration-200 placeholder:text-(--c-fg-faint) focus:border-(--c-accent) focus:bg-(--c-surface) focus:shadow-[0_0_0_4px_var(--c-focus)] focus:outline-none"
							/>
						</div>
					</div>

					<div class="mb-4.5">
						<label
							for="password"
							class="mb-2 block text-xs font-semibold tracking-[0.06em] text-(--c-fg-muted) uppercase"
							>Password</label
						>
						<div class="group relative">
							<Lock
								class="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-(--c-fg-faint) transition-[color] duration-200 group-focus-within:text-(--c-accent)"
							/>
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								placeholder="Masukkan password"
								autocomplete="current-password"
								bind:value={password}
								disabled={loading}
								oninput={() => (alertMessage = '')}
								class="h-12 w-full rounded-xl border border-(--c-border) bg-(--c-surface-2) pr-12 pl-10.5 text-[15px] text-(--c-fg) transition-[border-color,box-shadow,background] duration-200 placeholder:text-(--c-fg-faint) focus:border-(--c-accent) focus:bg-(--c-surface) focus:shadow-[0_0_0_4px_var(--c-focus)] focus:outline-none"
							/>
							<button
								type="button"
								class="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-(--c-fg-faint) transition-[color,background] duration-200 hover:bg-(--c-surface-3) hover:text-(--c-fg)"
								onclick={() => (showPassword = !showPassword)}
								aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
							>
								{#if showPassword}
									<EyeOff class="h-4.75 w-4.75" />
								{:else}
									<Eye class="h-4.75 w-4.75" />
								{/if}
							</button>
						</div>
					</div>

					<button
						type="submit"
						class="mt-1.5 flex h-12.5 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-none bg-linear-to-br from-[#10965a] to-[#0a5f3a] text-[15px] font-semibold tracking-[0.02em] text-white shadow-[0_10px_24px_-10px_rgba(14,122,74,0.55)] transition-[transform,box-shadow,filter] duration-200 hover:shadow-[0_14px_30px_-10px_rgba(14,122,74,0.6)] hover:brightness-105 active:translate-y-px active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-75"
						disabled={loading}
					>
						{#if loading}
							<span
								class="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/35 border-t-white"
							></span>
							<span>Memproses...</span>
						{:else}
							<ArrowRight class="h-4.5 w-4.5 text-white" />
							<span>Masuk</span>
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
