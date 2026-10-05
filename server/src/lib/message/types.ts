export type ColSpec<T = MessageItem> = {
	key: string;
	label: string;
	mono?: boolean;
	badge?: boolean;
	strong?: boolean;
	muted?: boolean;
	date?: boolean;
	status?: boolean;
	wrap?: boolean;
	render?: (item: T) => string;
	width?: string;
	minWidth?: string;
};

export type FilterField =
	| { type: 'date'; param: string; label: string }
	| { type: 'text'; param: string; label: string; placeholder?: string }
	| { type: 'number'; param: string; label: string; placeholder?: string }
	| { type: 'terminal'; param: string; label: string }
	| { type: 'status'; param: string; label: string }
	| { type: 'tipe'; param: string; label: string; source: Record<string, string> }
	| { type: 'reseller'; param: string; label: string }
	| { type: 'checkbox'; param: string; label: string; defaultChecked?: boolean };

export type FooterMeta = {
	has_next_page: boolean;
	has_prev_page: boolean;
	next_cursor: number | null;
};

export type OutboxItem = {
	tgl_entri: string;
	penerima: string;
	tipe_penerima: string;
	pesan: string;
	status: number;
	tgl_status: string;
	kode_transaksi: number;
	kode_reseller: string;
	nama_reseller?: string;
};

export type InboxItem = {
	kode: number;
	tgl_entri: string;
	pengirim: string;
	pesan: string;
	status: number;
	kode_terminal: number;
	tgl_status: string;
	kode_reseller: string;
	kode_transaksi: number;
	service_center: string;
	nama_reseller?: string;
};

export type InboxResponse = {
	status: string;
	data: { items: InboxItem[]; meta: FooterMeta; trace_id: string };
};

export type OutboxResponse = {
	status: string;
	data: { items: OutboxItem[]; meta: FooterMeta; trace_id: string };
};

export type MessageItem = InboxItem | OutboxItem;
