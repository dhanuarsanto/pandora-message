export type ResellerOption = {
	kode: string;
	nama: string;
};

export type ResellerResponse = {
	status: string;
	data: { items: ResellerOption[]; trace_id: string };
};
