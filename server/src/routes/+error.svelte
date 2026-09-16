<script lang="ts">
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/config';
	import { theme } from '$lib/theme';
	import {
		CircleAlert,
		Clock,
		Lock,
		Mail,
		Search,
		Server,
		ServerCrash,
		ShieldCheck,
		TriangleAlert,
		Unplug,
		type LucideIcon
	} from '@lucide/svelte';
	import './layout.css';

	theme.init();

	let { error } = $props<{ error: { message: string } }>();

	interface CodeConfig {
		label: string;
		title: string;
		desc: string;
		icon: LucideIcon;
	}

	const codes: Record<string, CodeConfig> = {
		400: {
			label: 'Bad Request',
			title: 'Permintaan Tidak Valid',
			desc: 'Format permintaan yang dikirim tidak dikenali server. Periksa ulang data yang Anda isi.',
			icon: TriangleAlert
		},
		401: {
			label: 'Unauthorized',
			title: 'Belum Masuk',
			desc: 'Sesi Anda telah berakhir atau Anda belum masuk. Silakan masuk kembali untuk melanjutkan.',
			icon: Lock
		},
		403: {
			label: 'Forbidden',
			title: 'Akses Ditolak',
			desc: 'Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika menurut Anda ini kesalahan.',
			icon: ShieldCheck
		},
		404: {
			label: 'Not Found',
			title: 'Halaman Tidak Ditemukan',
			desc: 'Konten yang Anda cari tidak tersedia atau telah dipindahkan. Periksa kembali alamat halaman yang dituju.',
			icon: Search
		},
		429: {
			label: 'Rate Limited',
			title: 'Terlalu Banyak Permintaan',
			desc: 'Anda melakukan terlalu banyak permintaan dalam waktu singkat. Tunggu beberapa saat lalu coba kembali.',
			icon: Clock
		},
		500: {
			label: 'Internal Error',
			title: 'Kesalahan Server',
			desc: 'Terjadi kesalahan di sisi server. Tim kami telah menerima laporan ini dan sedang menanganinya.',
			icon: Server
		},
		502: {
			label: 'Bad Gateway',
			title: 'Gateway Tidak Merespons',
			desc: 'Server perantara tidak menerima respons valid dari server tujuan. Coba lagi beberapa saat kemudian.',
			icon: ServerCrash
		},
		503: {
			label: 'Unavailable',
			title: 'Layanan Sedang Gangguan',
			desc: 'Layanan sedang dalam pemeliharaan atau sementara tidak tersedia. Silakan kembali dalam beberapa menit.',
			icon: Unplug
		}
	};

	const GENERIC: CodeConfig = {
		label: 'Unexpected Error',
		title: 'Terjadi Kesalahan',
		desc: 'Kesalahan yang tidak terduga telah terjadi. Silakan muat ulang halaman atau coba beberapa saat lagi.',
		icon: CircleAlert
	};

	const pageStatus = $derived(page.status);
	const config = $derived(codes[String(pageStatus)] ?? GENERIC);
	const codeStr = $derived(String(pageStatus));
	const pageMessage = $derived(error?.message ?? config.desc);
</script>

<svelte:head><title>{config.title} — {APP_NAME}</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-(--c-bg) p-[clamp(16px,4vw,40px)]">
	<div
		class="w-full max-w-140 overflow-hidden rounded-3xl border border-(--c-border) bg-(--c-surface) shadow-[0_2px_4px_rgba(20,32,26,0.05),0_16px_40px_-10px_rgba(20,32,26,0.12)]"
	>
		<div class="flex items-center justify-between border-b border-(--c-border) px-8 py-6">
			<div class="flex items-center gap-2.5">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-[11px] bg-linear-to-br from-(--c-accent) to-(--c-accent-strong) shadow-[0_6px_14px_-6px_rgba(14,122,74,0.5)]"
				>
					<Mail class="h-4.75 w-4.75 text-white" />
				</div>
				<span class="text-base font-bold tracking-[-0.01em] text-(--c-fg)">{APP_NAME}</span>
			</div>
			<span
				class="rounded-lg border border-(--c-border) bg-(--c-surface-2) px-2.5 py-1 font-mono text-[11px] text-(--c-fg-soft)"
				>ERR_{codeStr}</span
			>
		</div>

		<div class="flex flex-col items-center px-9 py-[clamp(40px,7vw,60px)] text-center">
			<div
				class="mb-6.5 flex h-18 w-18 items-center justify-center rounded-[22px] bg-(--c-accent-soft)"
			>
				<config.icon class="h-8.5 w-8.5 text-(--c-accent-strong)" />
			</div>

			<div class="flex items-baseline justify-center gap-3.5">
				<span
					class="text-[clamp(50px,8vw,76px)] leading-none font-bold tracking-[-0.04em] text-(--c-fg)"
				>
					{codeStr[0]}<span class="text-(--c-accent)">{codeStr[1] ?? ''}</span>{codeStr[2] ?? ''}
				</span>
				{#if pageStatus}
					<span class="block h-8 w-0.75 self-center rounded-xs bg-(--c-accent)"></span>
					<span class="text-xs font-semibold tracking-[0.16em] text-(--c-accent-strong) uppercase"
						>{config.label}</span
					>
				{/if}
			</div>

			<h1 class="mt-5 text-[clamp(20px,3vw,24px)] font-bold tracking-[-0.02em] text-(--c-fg)">
				{config.title}
			</h1>
			<p class="mt-2.5 max-w-100 text-sm leading-[1.65] text-(--c-fg-muted)">
				{pageMessage}
			</p>
		</div>

		<div
			class="mt-2 flex items-center justify-center gap-2.5 border-t border-(--c-border) px-8 py-5 text-[11px] tracking-[0.14em] text-(--c-fg-soft) uppercase"
		>
			<span class="inline-block h-1.75 w-1.75 rounded-full bg-(--c-accent)"></span>
			{APP_NAME} &copy; 2026
		</div>
	</div>
</div>
