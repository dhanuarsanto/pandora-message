import assert from 'node:assert/strict';
import test from 'node:test';
import {
	cellBodyClass,
	cellClass,
	cellText,
	cellTextFor,
	formatDate,
	formatRules,
	rowKeyOf,
	statusClasses
} from '../src/lib/format.ts';

test('formatDate parsing lengkap', () => {
	assert.equal(formatDate('2026-09-22T10:05:30'), '22 Sep 2026 10:05:30');
	assert.equal(formatDate('2026-09-22T10:05'), '22 Sep 2026 10:05');
	assert.equal(formatDate('2026-09-22 10:05:30'), '22 Sep 2026 10:05:30');
});

test('formatDate edge', () => {
	assert.equal(formatDate(undefined), '-');
	assert.equal(formatDate(null as unknown as string), '-');
	assert.equal(formatDate(''), '-');
	assert.equal(formatDate('bukan tanggal'), 'bukan tanggal');
	assert.equal(formatDate(0), '0');
});

test('statusClasses mapping', () => {
	assert.equal(statusClasses(20), 'bg-(--c-success-bg) text-(--c-success)');
	assert.equal(statusClasses(40), 'bg-(--c-danger-bg) text-(--c-danger)');
	assert.equal(statusClasses(49), 'bg-(--c-danger-bg) text-(--c-danger)');
	assert.equal(statusClasses(50), 'bg-(--c-danger-bg) text-(--c-danger)');
	assert.equal(statusClasses(69), 'bg-(--c-danger-bg) text-(--c-danger)');
	assert.equal(statusClasses(0), 'bg-(--c-success-bg) text-(--c-success)');
	assert.equal(statusClasses('foo'), 'bg-(--c-success-bg) text-(--c-success)');
});

test('formatRules: mapping label, trim, lower, fallback', () => {
	assert.equal(formatRules('sa'), 'Super Admin');
	assert.equal(formatRules(' SA '), 'Super Admin');
	assert.equal(formatRules('OP'), 'Operator');
	assert.equal(formatRules('apa'), 'apa');
	assert.equal(formatRules(null), null);
	assert.equal(formatRules(''), null);
});

test('cellText', () => {
	assert.equal(cellText(123), '123');
	assert.equal(cellText('abc'), 'abc');
	assert.equal(cellText(undefined), '-');
	assert.equal(cellText(null as unknown as string), '-');
});

test('cellClass kombinasi flag', () => {
	assert.equal(
		cellClass({ key: 'a', label: 'a' }),
		'border-b border-(--c-table-line) px-3.5 py-3 text-[13px] whitespace-nowrap'
	);
	assert.equal(
		cellClass({ key: 'a', label: 'a', mono: true, strong: true, muted: true }),
		'border-b border-(--c-table-line) px-3.5 py-3 font-mono text-[12px] whitespace-nowrap font-semibold text-(--c-fg-soft)'
	);
	assert.equal(
		cellClass({ key: 'a', label: 'a', wrap: true }),
		'border-b border-(--c-table-line) px-3.5 py-3 text-[13px] align-top',
		'kolom wrap tidak boleh whitespace-nowrap, hanya rata atas'
	);
});

test('cellClass kolom tanggal memakai angka rata lebar', () => {
	assert.equal(
		cellClass({ key: 'a', label: 'a', date: true }),
		'border-b border-(--c-table-line) px-3.5 py-3 text-[13px] tabular-nums whitespace-nowrap'
	);
});

test('cellBodyClass: hanya kolom wrap yang dibungkus', () => {
	assert.equal(cellBodyClass({ key: 'a', label: 'a' }), '');
	assert.equal(cellBodyClass({ key: 'a', label: 'a', mono: true }), '');
	assert.equal(
		cellBodyClass({ key: 'a', label: 'a', wrap: true }),
		'block min-w-[15rem] sm:min-w-[20rem] max-w-[40rem] whitespace-normal break-words text-pretty leading-[1.6]',
		'isi penuh dibungkus rapi, min-w responsive, text-pretty hindari orphan'
	);
});

test('cellTextFor: kolom tanggal diformat, kolom lain apa adanya', () => {
	assert.equal(cellTextFor({ key: 'a', label: 'a' }, 123), '123');
	assert.equal(cellTextFor({ key: 'a', label: 'a', date: true }, undefined), '-');
	assert.equal(
		cellTextFor({ key: 'a', label: 'a', date: true }, '2026-09-22T10:05:30'),
		'22 Sep 2026 10:05:30'
	);
});

test('rowKeyOf: unik per baris', () => {
	const item = { tgl_entri: '2026-10-01 08:00:00' };
	assert.equal(rowKeyOf(item, 0), '2026-10-01 08:00:00-0');
	assert.notEqual(rowKeyOf(item, 0), rowKeyOf(item, 1));
});
