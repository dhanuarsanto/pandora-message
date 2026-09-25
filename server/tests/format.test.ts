import assert from 'node:assert/strict';
import test from 'node:test';
import { cellClass, cellText, formatDate, formatRules, statusClasses } from '../src/lib/format.ts';

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
	assert.equal(statusClasses(50), 'bg-(--c-warning-bg) text-(--c-warning)');
	assert.equal(statusClasses(69), 'bg-(--c-warning-bg) text-(--c-warning)');
	assert.equal(statusClasses(0), 'bg-(--c-surface-2) text-(--c-fg-muted)');
	assert.equal(statusClasses('foo'), 'bg-(--c-surface-2) text-(--c-fg-muted)');
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
		'border-b border-(--c-border) px-3.5 py-3 text-[12px]'
	);
	assert.equal(
		cellClass({ key: 'a', label: 'a', mono: true, strong: true, muted: true }),
		'border-b border-(--c-border) px-3.5 py-3 font-mono text-[11px] whitespace-nowrap font-semibold text-(--c-fg-soft)'
	);
});
