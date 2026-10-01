export const BULAN = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember'
];

export const BULAN_PENDEK = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'Mei',
	'Jun',
	'Jul',
	'Agu',
	'Sep',
	'Okt',
	'Nov',
	'Des'
];

export const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function toISODate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function parseISODate(v: string | undefined | null): Date | null {
	if (!v) return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
	if (!m) return null;
	const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return Number.isNaN(d.getTime()) ? null : d;
}

export function todayDate(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

export function todayISO(): string {
	return toISODate(todayDate());
}

export function addDaysISO(days: number): string {
	const d = todayDate();
	d.setDate(d.getDate() + days);
	return toISODate(d);
}

export function firstOfMonthISO(offset: number): string {
	const t = todayDate();
	return toISODate(new Date(t.getFullYear(), t.getMonth() + offset, 1));
}

export function monthCells(year: number, month: number): { d: number | null; iso: string }[] {
	const firstDow = new Date(year, month, 1).getDay();
	const offset = firstDow === 0 ? 6 : firstDow - 1;
	const days = new Date(year, month + 1, 0).getDate();
	const out: { d: number | null; iso: string }[] = [];
	for (let i = 0; i < offset; i++) out.push({ d: null, iso: '' });
	for (let d = 1; d <= days; d++) out.push({ d, iso: toISODate(new Date(year, month, d)) });
	return out;
}
