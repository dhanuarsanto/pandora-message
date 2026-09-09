<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let toastMessage = $state('');

	let showPassword = $state(false);

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => {
			toastMessage = '';
		}, 3500);
	}

	function clearToast() {
		toastMessage = '';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!username.trim() || !password) {
			showToast('Lengkapi username dan password.');
			return;
		}
		if (loading) return;

		clearToast();
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
				showToast(data.message || 'Username atau password salah.');
			}
		} catch {
			showToast('Terjadi kesalahan, coba lagi.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Masuk — Pandora</title></svelte:head>

<div class="grid min-h-screen grid-cols-1 lg:grid-cols-2">
	<!-- Kiri: Visual -->
	<div class="relative flex flex-col justify-between overflow-hidden bg-white p-10 lg:flex">
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,122,74,0.06),transparent_55%)]"
		></div>
		<div class="absolute right-0 bottom-0 left-0 h-px bg-[#dfe4df]"></div>

		<div class="relative flex items-center gap-3">
			<div
				class="flex h-11 w-11 items-center justify-center rounded-[10px] bg-linear-to-br from-[#0e7a4a] to-[#0a5f3a] text-lg font-bold text-white"
			>
				P
			</div>
			<span class="text-[17px] font-bold text-[#14211b]">Pandora</span>
		</div>

		<div class="relative">
			<h1
				class="text-[clamp(40px,5vw,68px)] leading-[0.94] font-bold tracking-[-0.04em] text-[#14211b]"
			>
				Sistem<br />Internal<span class="text-[#0e7a4a]">.</span>
			</h1>
		</div>

		<div class="relative mt-6 flex items-center gap-4">
			<span class="text-[11px] font-medium tracking-[0.18em] text-[#89968d] uppercase"
				>Akses pesan masuk &amp; keluar</span
			>
			<span class="h-px flex-1 bg-[#dfe4df]"></span>
		</div>
	</div>

	<!-- Kanan: Form -->
	<div class="relative flex items-center justify-center bg-[#0c1510] p-8 lg:p-10">
		{#if toastMessage}
			<div
				class="absolute top-5 right-6 left-6 z-10 flex items-start gap-2.5 rounded-r-lg border-l-[3px] border-[#ef4444] bg-[#1a2e22] p-3 text-[13px] leading-normal text-[#fca5a5]"
				style="animation: toastIn 0.3s ease"
			>
				<svg
					class="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg
				>
				<span>{toastMessage}</span>
				<button
					onclick={clearToast}
					class="ml-auto shrink-0 bg-transparent text-[16px] leading-none text-[#fca5a5] opacity-60 hover:opacity-100"
					>×</button
				>
			</div>
		{/if}

		<div class="w-full max-w-85">
			<div class="mb-4 text-[11px] font-semibold tracking-[0.22em] text-[#0e7a4a] uppercase">
				Auth / Pandora
			</div>
			<h2 class="mb-8 text-[26px] font-bold tracking-[-0.02em] text-white">Masuk</h2>

			<form onsubmit={handleSubmit} class="flex flex-col gap-5">
				<div>
					<label
						for="username"
						class="mb-2 block text-[11px] font-semibold tracking-[0.08em] text-[#8ba392] uppercase"
						>Username</label
					>
					<div class="relative">
						<svg
							class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4c5e53]"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.8"
							><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg
						>
						<input
							type="text"
							id="username"
							placeholder="Masukkan username"
							autocomplete="username"
							disabled={loading}
							bind:value={username}
							oninput={clearToast}
							class="h-11.5 w-full rounded-lg border border-[#2b3d32] bg-white/6 px-9.5 pr-3.5 font-[15px] text-white placeholder-[#4c5e53] transition-colors focus:border-[#0e7a4a] focus:bg-white/9 focus:outline-none disabled:opacity-50"
						/>
					</div>
				</div>

				<div>
					<label
						for="password"
						class="mb-2 block text-[11px] font-semibold tracking-[0.08em] text-[#8ba392] uppercase"
						>Password</label
					>
					<div class="relative">
						<svg
							class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4c5e53]"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.8"
							><path d="M12 15a2 2 0 100-4 2 2 0 000 4z" /><path
								d="M17 11V8a5 5 0 00-10 0v3"
							/><path d="M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z" /></svg
						>
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							placeholder="Masukkan password"
							autocomplete="current-password"
							disabled={loading}
							bind:value={password}
							oninput={clearToast}
							class="h-11.5 w-full rounded-lg border border-[#2b3d32] bg-white/6 px-9.5 pr-9 font-[15px] text-white placeholder-[#4c5e53] transition-colors focus:border-[#0e7a4a] focus:bg-white/9 focus:outline-none disabled:opacity-50"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
							class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[#4c5e53] transition-colors hover:text-white"
						>
							{#if showPassword}
								<svg
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="1.8"
									><path
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
									/></svg
								>
							{:else}
								<svg
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="1.8"
									><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/></svg
								>
							{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="mt-1 h-12 rounded-lg bg-[#0e7a4a] text-[14px] font-semibold tracking-widest text-white uppercase transition-all hover:bg-[#0a5f3a] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<span
							class="inline-block h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/30 border-t-white align-middle"
						></span>
					{:else}
						Masuk
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>

<style>
	@keyframes toastIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
