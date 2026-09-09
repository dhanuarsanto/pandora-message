<script lang="ts">
	import { page } from '$app/state';
	import './layout.css';

	let { error } = $props<{ error: { message: string } }>();

	interface CodeConfig {
		label: string;
		title: string;
		desc: string;
		accent: string;
		gradient: string;
	}

	const codes: Record<string, CodeConfig> = {
		400: {
			label: 'Bad Request',
			title: 'Salah Permintaan',
			desc: 'Format permintaan tidak valid. Periksa kembali dan coba lagi.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		},
		401: {
			label: 'Unauthorized',
			title: 'Belum Masuk',
			desc: 'Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		},
		403: {
			label: 'Forbidden',
			title: 'Akses Ditolak',
			desc: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		},
		404: {
			label: 'Not Found',
			title: 'Halaman Tidak Ditemukan',
			desc: 'Konten yang Anda cari tidak tersedia atau telah dipindahkan.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		},
		429: {
			label: 'Too Many Requests',
			title: 'Terlalu Banyak Permintaan',
			desc: 'Anda melakukan terlalu banyak permintaan. Silakan tunggu sejenak lalu coba lagi.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		},
		500: {
			label: 'Internal Server Error',
			title: 'Kesalahan Server',
			desc: 'Terjadi kesalahan di sisi server. Tim kami telah menerima laporan ini.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		},
		502: {
			label: 'Bad Gateway',
			title: 'Gateway Tidak Valid',
			desc: 'Server sementara tidak merespons. Silakan coba lagi beberapa saat lagi.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		},
		503: {
			label: 'Service Unavailable',
			title: 'Layanan Tidak Tersedia',
			desc: 'Layanan sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi.',
			accent: '#0e7a4a',
			gradient: '#0a5f3a'
		}
	};

	const GENERIC: CodeConfig = {
		label: 'Error',
		title: 'Terjadi Kesalahan',
		desc: 'Kesalahan yang tidak terduga telah terjadi. Silakan coba lagi.',
		accent: '#0e7a4a',
		gradient: '#0a5f3a'
	};

	const pageStatus = $derived(page.status);
	const config = $derived(codes[String(pageStatus)] ?? GENERIC);
	const codeStr = $derived(pageStatus ? String(pageStatus) : '?');
	const pageLabel = $derived(config.label);
	const pageMessage = $derived(error?.message ?? config.desc);
</script>

<svelte:head><title>{pageStatus} — Pandora</title></svelte:head>

<div class="flex min-h-screen flex-col bg-[#f2f4f2] p-12" style="color: #14211b">
	<div class="flex items-center gap-3">
		<div
			class="flex h-11 w-11 items-center justify-center rounded-[10px] text-lg font-bold text-white"
			style="background: linear-gradient(135deg, {config.accent}, {config.gradient})"
		>
			P
		</div>
		<span class="text-[17px] font-bold" style="color: #14211b">Pandora</span>
	</div>

	<div class="flex flex-1 items-center justify-center py-8">
		<div class="flex max-w-160 flex-col items-center gap-4 text-center">
			<div
				class="text-[clamp(72px,10vw,128px)] leading-none font-bold tracking-tighter"
				style="color: #14211b"
			>
				{codeStr[0]}<span style="color: {config.accent}">{codeStr[1] ?? ''}</span>{codeStr[2] ?? ''}
			</div>
			<span
				class="inline-block rounded-[3px] border px-2.5 py-1 text-[11px] font-semibold tracking-[0.22em] uppercase"
				style="border-color: {config.accent}; color: {config.accent}"
			>
				{pageLabel}
			</span>
			<div>
				<h1 class="text-2xl font-bold tracking-[-0.02em]" style="color: #14211b">{config.title}</h1>
				<p class="mt-2 max-w-95 text-sm leading-relaxed" style="color: #5f6670">
					{pageMessage}
				</p>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-4">
		<span class="text-[11px] font-medium tracking-[0.18em] uppercase" style="color: #9aa1ab"
			>ERR_{pageStatus || 'UNKNOWN'}</span
		>
		<span class="h-px flex-1 bg-[#d8d8d4]"></span>
	</div>
</div>
