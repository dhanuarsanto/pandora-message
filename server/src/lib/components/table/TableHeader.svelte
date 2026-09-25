<script lang="ts">
	import { reorderKeys } from '$lib/client/colPrefs';
	import type { ColSpec } from '$lib/message/types';
	import { cn } from '$lib/utils';

	let {
		cols,
		onReorderColumns
	}: {
		cols: ColSpec[];
		onReorderColumns: (keys: string[]) => void;
	} = $props();

	let dragKey = $state<string | null>(null);
	let dropInfo = $state<{ key: string; side: 'before' | 'after' } | null>(null);

	function onHeaderDragStart(key: string, e: DragEvent) {
		if (cols.length < 2) return;
		dragKey = key;
		dropInfo = null;
		e.dataTransfer!.effectAllowed = 'move';
	}

	function onHeaderDragOver(key: string, e: DragEvent) {
		if (!dragKey || dragKey === key) return;
		e.preventDefault();
		const el = e.currentTarget as HTMLTableCellElement;
		const rect = el.getBoundingClientRect();
		dropInfo = { key, side: e.clientX < rect.left + rect.width / 2 ? 'before' : 'after' };
	}

	function onHeaderDrop(e: DragEvent) {
		e.preventDefault();
		if (!dragKey || !dropInfo) {
			onHeaderDragEnd();
			return;
		}
		const visibleKeys = cols.map((c) => c.key);
		onReorderColumns(reorderKeys(visibleKeys, dragKey, dropInfo.key, dropInfo.side));
		onHeaderDragEnd();
	}

	function onHeaderDragEnd() {
		dragKey = null;
		dropInfo = null;
	}

	function focusHeader(key: string) {
		requestAnimationFrame(() => {
			document.querySelector<HTMLElement>(`th[data-key='${key}']`)?.focus();
		});
	}

	function moveColumn(key: string, dir: -1 | 1) {
		const keys = cols.map((c) => c.key);
		const i = keys.indexOf(key);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= keys.length) return;
		const arr = keys.slice();
		arr.splice(i, 1);
		arr.splice(j, 0, key);
		onReorderColumns(arr);
		focusHeader(key);
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		const onCapture = (e: KeyboardEvent) => {
			if (!e.altKey) return;
			if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
			const t = e.target as Element | null;
			if (t && t.closest('table')) e.preventDefault();
		};
		window.addEventListener('keydown', onCapture, true);
		return () => window.removeEventListener('keydown', onCapture, true);
	});

	function onHeaderKeydown(key: string, e: KeyboardEvent) {
		if (!e.altKey) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			moveColumn(key, -1);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			moveColumn(key, 1);
		}
	}
</script>

<thead>
	<tr>
		{#each cols as c (c.key)}
			<th
				scope="col"
				data-key={c.key}
				class={cn(
					'sticky top-0 z-2 border-b border-(--c-border) bg-(--c-table-head) px-3.5 py-2.5 text-left text-[11px] font-semibold tracking-widest whitespace-nowrap text-(--c-fg-soft) uppercase select-none',
					c.key === dropInfo?.key &&
						dropInfo.side === 'before' &&
						'shadow-[-3px_0_0_0_var(--c-accent)]',
					c.key === dropInfo?.key &&
						dropInfo.side === 'after' &&
						'shadow-[3px_0_0_0_var(--c-accent)]'
				)}
				draggable={cols.length > 1}
				tabindex={cols.length > 1 ? 0 : undefined}
				title={cols.length > 1 ? 'Seret, atau Alt+←/→ untuk memindahkan kolom' : undefined}
				ondragstart={(e) => onHeaderDragStart(c.key, e)}
				ondragover={(e) => onHeaderDragOver(c.key, e)}
				ondrop={(e) => onHeaderDrop(e)}
				ondragend={() => onHeaderDragEnd()}
				onkeydown={(e) => onHeaderKeydown(c.key, e)}>{c.label}</th
			>
		{/each}
	</tr>
</thead>
