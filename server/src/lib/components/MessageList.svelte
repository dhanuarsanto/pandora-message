<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { appBusy } from '$lib/appBusy.svelte.js';
	import { clearColPrefs, loadColPrefs, saveColPrefs, visibleOf } from '$lib/colPrefs';
	import { INBOX_STATUS, OUTBOX_STATUS } from '$lib/config';
	import type {
		ColSpec,
		FilterField,
		FooterMeta,
		MessageItem,
		ResellerResponse,
		UnauthorizedFlag
	} from '$lib/types';
	import { buildQuery, initFilterFromUrl, initStack, navigate } from '$lib/utils';
	import { Columns3, SlidersHorizontal } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import ColumnPanel from './ColumnPanel.svelte';
	import MessageFilters from './MessageFilters.svelte';
	import MessageTable from './MessageTable.svelte';

	type MessagePage = {
		data: {
			items: MessageItem[];
			meta: FooterMeta;
		};
	};

	type LoadResult = MessagePage | UnauthorizedFlag;

	let {
		load,
		resellers,
		path,
		title,
		subtitle,
		cols,
		filters,
		stackKey
	}: {
		load: LoadResult | Promise<LoadResult>;
		resellers: Promise<ResellerResponse | null | UnauthorizedFlag>;
		path: '/inbox' | '/outbox';
		title: string;
		subtitle: string;
		cols: ColSpec[];
		filters: FilterField[];
		stackKey: string;
	} = $props();

	let cursorStack = $state<(number | null)[]>(untrack(() => initStack(stackKey)));

	function saveStack() {
		if (cursorStack.length === 1 && cursorStack[0] === null) {
			sessionStorage.removeItem(stackKey);
		} else {
			sessionStorage.setItem(stackKey, JSON.stringify(cursorStack));
		}
	}

	let query = $state<Record<string, string>>({});
	let pageSize = $state(page.url.searchParams.get('pageSize') ?? '');
	let showFilter = $state(false);
	let showColumns = $state(false);

	const colKey = $derived(stackKey.replace('-cursor-stack', '-cols'));

	let colPrefs = $state<ReturnType<typeof loadColPrefs>>(untrack(() => loadColPrefs(colKey, cols)));
	let columnsRef = $state<HTMLElement | null>(null);
	let columnsBtn = $state<HTMLButtonElement | null>(null);

	const orderedCols = $derived(
		colPrefs.order.map((k) => cols.find((c) => c.key === k)).filter((c): c is ColSpec => !!c)
	);
	const visibleCols = $derived(visibleOf(orderedCols, colPrefs.hidden));

	$effect(() => {
		if (typeof window === 'undefined' || !showColumns) return;
		const onPointer = (e: PointerEvent) => {
			const target = e.target as Node;
			if (columnsRef && !columnsRef.contains(target)) showColumns = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') showColumns = false;
		};
		window.addEventListener('pointerdown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.removeEventListener('keydown', onKey);
			columnsBtn?.focus();
		};
	});

	function setColPrefs(next: typeof colPrefs) {
		colPrefs = next;
		saveColPrefs(colKey, next);
	}

	function toggleCol(key: string) {
		const isHidden = colPrefs.hidden.includes(key);
		if (!isHidden && visibleCols.length <= 1) return;
		setColPrefs({
			...colPrefs,
			hidden: isHidden ? colPrefs.hidden.filter((h) => h !== key) : [...colPrefs.hidden, key]
		});
	}

	function reorderFromVisible(visibleKeys: string[]) {
		const hiddenKeys = colPrefs.order.filter((k) => colPrefs.hidden.includes(k));
		setColPrefs({ ...colPrefs, order: [...visibleKeys, ...hiddenKeys] });
	}

	function resetColumns() {
		clearColPrefs(colKey);
		colPrefs = loadColPrefs(colKey, cols);
	}

	let dataReady = $state(false);

	$effect(() => {
		dataReady = false;
		const p = load;
		Promise.resolve(p).then(
			() => (dataReady = true),
			() => (dataReady = true)
		);
	});

	let authHandled = $state(false);

	function forceLogout() {
		if (authHandled) return;
		authHandled = true;
		fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
			goto(resolve('/login'));
		});
	}

	const isUnauthorized = (r: unknown): r is UnauthorizedFlag =>
		typeof r === 'object' && r !== null && '__unauthorized' in r;

	$effect(() => {
		Promise.resolve(load).then((r) => {
			if (isUnauthorized(r)) forceLogout();
		});
	});

	const safeLoad = $derived(
		Promise.resolve(load).then((r) =>
			isUnauthorized(r) ? new Promise<never>(() => {}) : (r as MessagePage)
		)
	);

	$effect(() => {
		appBusy.value = !dataReady;
	});

	const controlsDisabled = $derived(!dataReady || navigating.type !== null);
	const busy = $derived(navigating.type !== null);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(min-width: 768px)');
		showFilter = mq.matches;
		const onChange = () => (showFilter = mq.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const scrollKey = $derived(stackKey.replace('-cursor-stack', '-scroll'));

	function saveScroll() {
		const el = document.getElementById('app-scroll');
		if (el) sessionStorage.setItem(scrollKey, String(el.scrollTop));
	}

	function restoreScroll() {
		const el = document.getElementById('app-scroll');
		const pos = Number(sessionStorage.getItem(scrollKey) ?? 0);
		if (!el || !pos) return;
		requestAnimationFrame(() => {
			el.scrollTop = pos;
			setTimeout(() => (el.scrollTop = pos), 80);
		});
	}

	afterNavigate((nav) => {
		restoreScroll();
		pageSize = page.url.searchParams.get('pageSize') ?? '';
		query = initFilterFromUrl(filters, page.url.searchParams);
		if (nav && nav.type === 'popstate') {
			const raw = page.url.searchParams.get('cursor');
			const cur = raw === null ? null : Number(raw);
			const idx = cursorStack.findIndex((x) => x === cur);
			cursorStack = idx >= 0 ? cursorStack.slice(0, idx + 1) : [cur];
			saveStack();
		}
	});

	const statusOptions = $derived(Object.entries(path === '/outbox' ? OUTBOX_STATUS : INBOX_STATUS));
	const limitN = $derived(Number(query['limit']));
	const pageSizeN = $derived(Number(pageSize));
	const skeletonCount = $derived(
		Math.min(limitN || pageSizeN || 10, pageSizeN || limitN || 10, 15)
	);
	const skeletonRows = $derived(Array.from({ length: skeletonCount }, (_, i) => i));

	function goNext(meta: FooterMeta) {
		if (!meta.has_next_page || busy) return;
		saveScroll();
		cursorStack.push(meta.next_cursor);
		saveStack();
		navigate(path, buildQuery(query, pageSize, meta.next_cursor).toString());
	}

	function goPrev(meta: FooterMeta) {
		if (!meta.has_prev_page || busy) return;
		saveScroll();
		cursorStack.pop();
		const prev = cursorStack[cursorStack.length - 1] ?? null;
		saveStack();
		navigate(path, buildQuery(query, pageSize, prev).toString());
	}

	function applyFilter() {
		if (busy) return;
		cursorStack = [null];
		saveStack();
		navigate(path, buildQuery(query, pageSize, null).toString());
	}

	function resetFilters() {
		query = {};
		cursorStack = [null];
		saveStack();
		navigate(path, buildQuery(query, pageSize, null).toString());
	}

	function changePageSize(value: string) {
		pageSize = value;
		applyFilter();
	}
</script>

<main class="mx-auto flex min-h-full w-full max-w-375 flex-col px-4 py-4 sm:px-7 md:h-full">
	<div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{title}</h1>
			<p class="mt-0.5 text-[13px] text-(--c-fg-muted)">{subtitle}</p>
		</div>
		<div class="relative flex flex-wrap items-center gap-3" bind:this={columnsRef}>
			<button
				bind:this={columnsBtn}
				onclick={() => {
					if (!dataReady) return;
					showColumns = !showColumns;
				}}
				class="flex items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 py-1.5 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent)"
			>
				<Columns3 class="h-3.5 w-3.5" />
				Kolom
			</button>
			{#if showColumns}
				<ColumnPanel
					cols={orderedCols}
					order={colPrefs.order}
					hidden={colPrefs.hidden}
					onReorder={(keys) => {
						setColPrefs({ ...colPrefs, order: keys });
					}}
					onToggle={toggleCol}
					onReset={resetColumns}
				/>
			{/if}
			<button
				onclick={() => (showFilter = !showFilter)}
				class="flex items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 py-1.5 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent)"
			>
				<SlidersHorizontal class="h-3.5 w-3.5" />
				{showFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
			</button>
		</div>
	</div>

	{#if showFilter}
		<MessageFilters
			bind:query
			{filters}
			{statusOptions}
			{resellers}
			{controlsDisabled}
			onReset={resetFilters}
			onApply={applyFilter}
		/>
	{/if}

	<MessageTable
		load={safeLoad}
		cols={visibleCols}
		{skeletonRows}
		{pageSize}
		{busy}
		onPageSizeChange={changePageSize}
		onGoNext={goNext}
		onGoPrev={goPrev}
		onReorderColumns={reorderFromVisible}
		reloadPath={path}
	/>
</main>
