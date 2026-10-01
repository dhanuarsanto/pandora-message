import {
	CircleAlert,
	Clock,
	Lock,
	Search,
	Server,
	ServerCrash,
	ShieldCheck,
	TriangleAlert,
	Unplug,
	type LucideIcon
} from '@lucide/svelte';

export type CodeConfig = {
	label: string;
	title: string;
	desc: string;
	icon: LucideIcon;
};

export const ERROR_CODES: Record<string, CodeConfig> = {
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

export const ERROR_GENERIC: CodeConfig = {
	label: 'Unexpected Error',
	title: 'Terjadi Kesalahan',
	desc: 'Kesalahan yang tidak terduga telah terjadi. Silakan muat ulang halaman atau coba beberapa saat lagi.',
	icon: CircleAlert
};
