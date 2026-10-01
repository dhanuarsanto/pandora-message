import assert from 'node:assert/strict';
import test from 'node:test';
import { clampPage, pageCount, pageRange, pageWindow, sortRows } from '../src/lib/sortRows.ts';
import type { InboxItem } from '../src/lib/message/types.ts';

type Row = Pick<InboxItem, 'kode' | 'tgl_entri' | 'pengirim' | 'service_center'>;

function row(kode: number, extra: Partial<Row> = {}): Row {
	return {
		kode,
		tgl_entri: '2026-01-01 00:00:00',
		pengirim: 'SENDER',
		service_center: 'SC',
		...extra
	};
}

test('sortRows: tanpa kunci mengembalikan baris asli', () => {
	const items = [row(3), row(1), row(2)];
	assert.equal(sortRows(items, null, 'asc'), items);
});

test('sortRows: kunci angka urut secara numerik', () => {
	const items = [row(10), row(9), row(100), row(1)];
	assert.deepEqual(
		sortRows(items, 'kode', 'asc').map((r) => r.kode),
		[1, 9, 10, 100]
	);
	assert.deepEqual(
		sortRows(items, 'kode', 'desc').map((r) => r.kode),
		[100, 10, 9, 1]
	);
});

test('sortRows: teks mengabaikan huruf besar-kecil', () => {
	const items = [row(1, { pengirim: 'beta' }), row(2, { pengirim: 'Alpha' })];
	assert.deepEqual(
		sortRows(items, 'pengirim', 'asc').map((r) => r.pengirim),
		['Alpha', 'beta']
	);
});

test('sortRows: kolom tanggal urut berdasarkan isinya', () => {
	const items = [
		row(1, { tgl_entri: '2026-03-05 10:00:00' }),
		row(2, { tgl_entri: '2026-01-09 10:00:00' }),
		row(3, { tgl_entri: '2026-02-01 10:00:00' })
	];
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'asc').map((r) => r.kode),
		[2, 3, 1]
	);
});

test('sortRows: tanggal dengan milidetik tidak seragam tetap urut waktu', () => {
	const items = [
		row(1, { tgl_entri: '2026-09-19T17:42:29.025Z' }),
		row(2, { tgl_entri: '2026-09-19T15:27:08.42Z' }),
		row(3, { tgl_entri: '2026-09-19T14:44:08.74Z' }),
		row(4, { tgl_entri: '2026-08-25T18:12:19.65Z' }),
		row(5, { tgl_entri: '2026-08-25T18:12:17.42Z' }),
		row(6, { tgl_entri: '2026-08-25T18:12:12.4Z' }),
		row(7, { tgl_entri: '2026-08-25T17:38:02.98Z' }),
		row(8, { tgl_entri: '2026-08-11T14:37:07Z' })
	];
	const waktu = [8, 7, 6, 5, 4, 3, 2, 1];
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'asc', { date: true }).map((r) => r.kode),
		waktu,
		'harus sama dengan urutan waktu sebenarnya'
	);
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'desc', { date: true }).map((r) => r.kode),
		[...waktu].reverse(),
		'turun harus kebalikan dari naik'
	);
});

test('sortRows: nilai tanggal tetap monoton di kedua arah walau ada waktu kembar', () => {
	const items = [
		row(1, { tgl_entri: '2026-08-11T14:37:07Z' }),
		row(2, { tgl_entri: '2026-09-19T10:00:00.025Z' }),
		row(3, { tgl_entri: '2026-09-19T10:00:00.025Z' }),
		row(4, { tgl_entri: '2026-09-19T10:00:00.9Z' }),
		row(5, { tgl_entri: '2026-09-19T10:00:00.9Z' })
	];
	const waktu = (list: Row[]) => list.map((r) => Date.parse(r.tgl_entri));

	for (const dir of ['asc', 'desc'] as const) {
		const hasil = waktu(sortRows(items, 'tgl_entri', dir, { date: true }));
		for (let i = 1; i < hasil.length; i++) {
			if (dir === 'asc') {
				assert.ok(hasil[i] >= hasil[i - 1], `naik: posisi ${i} lebih kecil dari sebelumnya`);
			} else {
				assert.ok(hasil[i] <= hasil[i - 1], `turun: posisi ${i} lebih besar dari sebelumnya`);
			}
		}
	}
});

test('sortRows: waktu kembar tetap urut asal di kedua arah', () => {
	const items = [
		row(1, { tgl_entri: '2026-09-19T10:00:00.025Z' }),
		row(2, { tgl_entri: '2026-09-19T10:00:00.025Z' }),
		row(3, { tgl_entri: '2026-09-19T10:00:00.025Z' })
	];
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'asc', { date: true }).map((r) => r.kode),
		[1, 2, 3]
	);
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'desc', { date: true }).map((r) => r.kode),
		[1, 2, 3],
		'turun tidak membalik urutan asal di antara waktu yang sama'
	);
});

test('sortRows: detik milidetik yang menentukan urutan', () => {
	const items = [
		row(1, { tgl_entri: '2026-09-19T10:00:00.9Z' }),
		row(2, { tgl_entri: '2026-09-19T10:00:00.10Z' }),
		row(3, { tgl_entri: '2026-09-19T10:00:00.025Z' })
	];
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'asc', { date: true }).map((r) => r.kode),
		[3, 2, 1]
	);
});

test('sortRows: tanpa penanda date, banding huruf dipakai', () => {
	const items = [
		row(1, { tgl_entri: '2026-09-19T17:42:29.025Z' }),
		row(2, { tgl_entri: '2026-09-19T15:27:08.42Z' })
	];
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'asc').map((r) => r.kode),
		[2, 1]
	);
});

test('sortRows: tanggal tidak terbaca jatuh ke banding huruf', () => {
	const items = [row(1, { tgl_entri: 'bukan tanggal' }), row(2, { tgl_entri: 'juga bukan' })];
	assert.deepEqual(
		sortRows(items, 'tgl_entri', 'asc', { date: true }).map((r) => r.kode),
		[1, 2]
	);
});

test('sortRows: nilai kosong selalu di akhir, arah apa pun', () => {
	const items = [
		row(1, { service_center: '' }),
		row(2, { service_center: 'B' }),
		row(3, { service_center: 'A' })
	];
	assert.deepEqual(
		sortRows(items, 'service_center', 'asc').map((r) => r.kode),
		[3, 2, 1]
	);
	assert.deepEqual(
		sortRows(items, 'service_center', 'desc').map((r) => r.kode),
		[2, 3, 1]
	);
});

test('sortRows: tidak memutasi baris asal', () => {
	const items = [row(3), row(1), row(2)];
	const before = items.map((r) => r.kode);
	sortRows(items, 'kode', 'asc');
	assert.deepEqual(
		items.map((r) => r.kode),
		before
	);
});

test('sortRows: kunci sama mempertahankan urutan asal (stabil)', () => {
	const items = [
		row(1, { pengirim: 'SAMA' }),
		row(2, { pengirim: 'SAMA' }),
		row(3, { pengirim: 'SAMA' })
	];
	assert.deepEqual(
		sortRows(items, 'pengirim', 'desc').map((r) => r.kode),
		[1, 2, 3]
	);
});

test('pageCount: pembulatan ke atas, minimal satu', () => {
	assert.equal(pageCount(0, 25), 1);
	assert.equal(pageCount(1, 25), 1);
	assert.equal(pageCount(25, 25), 1);
	assert.equal(pageCount(26, 25), 2);
	assert.equal(pageCount(87, 25), 4);
	assert.equal(pageCount(100, 10), 10);
});

test('pageCount: ukuran tidak sah tetap aman', () => {
	assert.equal(pageCount(10, 0), 1);
	assert.equal(pageCount(10, -5), 1);
});

test('clampPage: dijepit ke rentang halaman yang ada', () => {
	assert.equal(clampPage(0, 87, 25), 1);
	assert.equal(clampPage(-3, 87, 25), 1);
	assert.equal(clampPage(2, 87, 25), 2);
	assert.equal(clampPage(4, 87, 25), 4);
	assert.equal(clampPage(9, 87, 25), 4);
	assert.equal(clampPage(1, 0, 25), 1);
	assert.equal(clampPage(Number.NaN, 87, 25), 1);
});

test('pageRange: rentang baris yang tampil di halaman itu', () => {
	assert.deepEqual(pageRange(1, 0, 25), { from: 0, to: 0 });
	assert.deepEqual(pageRange(1, 87, 25), { from: 1, to: 25 });
	assert.deepEqual(pageRange(4, 87, 25), { from: 76, to: 87 });
	assert.deepEqual(pageRange(1, 10, 25), { from: 1, to: 10 });
});

test('pageWindow: pendek menampilkan semua nomor tanpa cut', () => {
	assert.deepEqual(pageWindow(1, 7), [1, 2, 3, 4, 5, 6, 7]);
	assert.deepEqual(pageWindow(1, 1), [1]);
	assert.deepEqual(pageWindow(3, 0), []);
});

test('pageWindow: panjang memakai cut di tengah', () => {
	assert.deepEqual(pageWindow(6, 12), [1, -1, 5, 6, 7, -1, 12]);
	assert.deepEqual(pageWindow(1, 12), [1, 2, 3, 4, 5, -1, 12]);
	assert.deepEqual(pageWindow(12, 12), [1, -1, 8, 9, 10, 11, 12]);
});

test('pageWindow: nomor awal dan akhir selalu ada', () => {
	for (let p = 1; p <= 40; p += 1) {
		const w = pageWindow(p, 40);
		assert.equal(w[0], 1, `halaman ${p} harus mulai dari 1`);
		assert.equal(w[w.length - 1], 40, `halaman ${p} harus berakhir di 40`);
		assert.ok(w.includes(p), `halaman ${p} harus tampil`);
		const numbers = w.filter((n) => n !== -1);
		assert.equal(
			new Set(numbers).size,
			numbers.length,
			`halaman ${p} tidak boleh ada nomor kembar`
		);
		assert.ok(w.length <= 7, `halaman ${p} tidak boleh melebihi 7 slot`);
		assert.ok(
			w.every((n) => n === -1 || (n >= 1 && n <= 40)),
			`halaman ${p} tidak boleh punya nomor di luar rentang`
		);
	}
});
