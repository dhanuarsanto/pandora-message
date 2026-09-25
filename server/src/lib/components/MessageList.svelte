<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import { appBusy } from '$lib/client/appBusy.svelte';
	import { clearColPrefs, loadColPrefs, saveColPrefs, visibleOf } from '$lib/client/colPrefs';
	import type { ColSpec, FilterField, FooterMeta } from '$lib/message/types';
	import type { ResellerResponse } from '$lib/references/types';
	import { paramsEqual } from '$lib/params';
	import { buildQuery, initFilterFromUrl, initStack } from '$lib/utils';
	import { todayISO } from '$lib/date';
	import {
		applyDateDefaults,
		calcSkeletonCount,
		normalizeMessageBody,
		popStackCursor,
		pushStackCursor,
		rebuildStack,
		saveCursorStack,
		shouldFetch,
		statusOptionsFor,
		type MessageBody,
		type MessageData
	} from '$lib/messageQuery';
	import { navigate } from '$lib/client/navigation';
	import { Columns3, SlidersHorizontal } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ColumnPanel from './ColumnPanel.svelte';
	import MessageFilters from './MessageFilters.svelte';
	import MessageTable from './MessageTable.svelte';

	let {
		path,
		title,
		subtitle,
		cols,
		filters,
		stackKey
	}: {
		path: '/inbox' | '/outbox';
		title: string;
		subtitle: string;
		cols: ColSpec[];
		filters: FilterField[];
		stackKey: string;
	} = $props();

	let resellers = $state<ResellerResponse | null>(null);

	let cursorStack = $state<(number | null)[]>(untrack(() => initStack(stackKey)));

	function initialQuery(): Record<string, string> {
		const u = applyDateDefaults(new SvelteURLSearchParams(page.url.searchParams), 'today');
		return initFilterFromUrl(filters, u);
	}

	let dateScope = $state<'today' | 'all'>('today');
	let query = $state<Record<string, string>>(initialQuery());
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

	let messageData = $state<MessageData | null>(null);
	let loadError = $state<string | null>(null);
	let loadErrorCause = $state<string | null>(null);
	let retryTick = $state(0);
	let loading = $state(true);
	let lastFetchKey = '';
	let lastRetryTick = 0;

	const endpoint = $derived('/api/messages' + path);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const params = applyDateDefaults(new SvelteURLSearchParams(page.url.searchParams), dateScope);
		const qs = params.toString();
		void retryTick;

		const key = endpoint + (qs ? '?' + qs : '');
		if (!shouldFetch(lastFetchKey, lastRetryTick, key, retryTick)) {
			loading = false;
			loadError = null;
			return;
		}
		lastFetchKey = key;
		lastRetryTick = retryTick;

		loading = true;
		loadError = null;
		loadErrorCause = null;

		fetch(endpoint + (qs ? '?' + qs : ''))
			.then((res) => {
				if (res.redirected && res.url.includes('/login')) {
					goto(resolve('/login'));
					throw new Error('Sesi berakhir.');
				}
				return res.json() as Promise<MessageBody>;
			})
			.then((body) => {
				if (lastFetchKey !== key) return;
				const r = normalizeMessageBody(body);
				messageData = r.data;
				loadError = r.error;
				loadErrorCause = r.cause;
			})
			.catch(() => {
				if (lastFetchKey !== key) return;
				messageData = null;
				loadError = 'Gagal memuat data.';
			})
			.finally(() => {
				if (lastFetchKey === key) loading = false;
			});
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		let active = true;
		fetch('/api/references/resellers')
			.then((res) => res.json() as Promise<{ status: string; data?: ResellerResponse }>)
			.then((body) => {
				if (active) resellers = body.status === 'sukses' && body.data ? body.data : null;
			})
			.catch(() => {
				if (active) resellers = null;
			});

		return () => {
			active = false;
		};
	});

	const controlsDisabled = $derived(loading || navigating.type !== null);
	const busy = $derived(navigating.type !== null);

	$effect(() => {
		appBusy.value = loading;
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(min-width: 640px)');
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
		const u = applyDateDefaults(new SvelteURLSearchParams(page.url.searchParams), dateScope);
		query = initFilterFromUrl(filters, u);
		if (nav && nav.type === 'popstate') {
			const raw = page.url.searchParams.get('cursor');
			const cur = raw === null ? null : Number(raw);
			cursorStack = rebuildStack(cursorStack, cur);
			saveCursorStack(stackKey, cursorStack);
		}
	});

	const statusOptions = $derived(statusOptionsFor(path));
	const limitN = $derived(Number(query['limit']));
	const pageSizeN = $derived(Number(pageSize));
	const skeletonCount = $derived(calcSkeletonCount(limitN, pageSizeN));
	const skeletonRows = $derived(Array.from({ length: skeletonCount }, (_, i) => i));

	function goNext(meta: FooterMeta) {
		if (!meta.has_next_page || busy) return;
		saveScroll();
		cursorStack = pushStackCursor(cursorStack, meta.next_cursor);
		saveCursorStack(stackKey, cursorStack);
		navigate(path, buildQuery(query, pageSize, meta.next_cursor).toString());
	}

	function goPrev(meta: FooterMeta) {
		if (!meta.has_prev_page || busy) return;
		saveScroll();
		const r = popStackCursor(cursorStack);
		cursorStack = r.stack;
		saveCursorStack(stackKey, cursorStack);
		navigate(path, buildQuery(query, pageSize, r.prev).toString());
	}

	function applyFilter(): boolean {
		if (busy || loading) return false;
		const hasAnyDate = !!(query['startDate'] || query['endDate']);
		if (!hasAnyDate && dateScope !== 'all') {
			dateScope = 'all';
		} else if (hasAnyDate && dateScope !== 'today') {
			dateScope = 'today';
		}
		if (query['startDate'] && !query['endDate']) {
			query['endDate'] = todayISO();
		}
		const next = buildQuery(query, pageSize, null);
		if (paramsEqual(next, page.url.searchParams)) return false;
		cursorStack = [null];
		saveCursorStack(stackKey, cursorStack);
		navigate(path, next.toString());
		return true;
	}

	function resetFilters() {
		query = { startDate: todayISO(), endDate: todayISO() };
		dateScope = 'today';
		cursorStack = [null];
		saveCursorStack(stackKey, cursorStack);
		navigate(path, buildQuery(query, pageSize, null).toString());
	}

	function changePageSize(value: string) {
		pageSize = value;
		applyFilter();
	}

	function retryLoad() {
		retryTick += 1;
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
					if (loading) return;
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
		data={messageData}
		{loading}
		error={loadError}
		errorDetail={loadErrorCause}
		cols={visibleCols}
		{skeletonRows}
		{pageSize}
		{busy}
		onPageSizeChange={changePageSize}
		onGoNext={goNext}
		onGoPrev={goPrev}
		onReorderColumns={reorderFromVisible}
		onRetry={retryLoad}
		reloadPath={path}
	/>
</main>
