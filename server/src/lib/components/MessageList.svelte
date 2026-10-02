<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import { appBusy } from '$lib/client/appBusy.svelte';
	import { clearColPrefs, loadColPrefs, saveColPrefs, visibleOf } from '$lib/client/colPrefs';
	import type { ColSpec, FilterField } from '$lib/message/types';
	import type { ResellerResponse } from '$lib/references/types';
	import { paramsEqual } from '$lib/params';
	import { buildQuery, cn, initFilterFromUrl, sortedParamsString } from '$lib/utils';
	import { todayISO } from '$lib/date';
	import {
		applyCheckboxDefaults,
		applyDateDefaults,
		applyLimitDefault,
		autoRefreshMs,
		calcSkeletonCount,
		canAutoRefresh,
		DEFAULT_AUTO_REFRESH,
		normalizeMessageBody,
		planFetch,
		statusOptionsFor,
		type FetchTrigger,
		type MessageBody,
		type MessageData
	} from '$lib/messageQuery';
	import { navigate } from '$lib/client/navigation';
	import { clampPage, sortRows, type SortDir } from '$lib/sortRows';
	import { Columns3, RefreshCw, RotateCcw, SlidersHorizontal } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ColumnPanel from './ColumnPanel.svelte';
	import MessageFilters from './MessageFilters.svelte';
	import MessageTable from './MessageTable.svelte';
	import PresetMenu from './PresetMenu.svelte';

	let {
		path,
		title,
		subtitle,
		cols,
		filters
	}: {
		path: '/inbox' | '/outbox';
		title: string;
		subtitle: string;
		cols: ColSpec[];
		filters: FilterField[];
	} = $props();

	let resellers = $state<ResellerResponse | null>(null);
	let resellersLoaded = $state(false);

	function initialQuery(): Record<string, string> {
		const u = applyLimitDefault(
			applyCheckboxDefaults(
				applyDateDefaults(new SvelteURLSearchParams(page.url.searchParams), 'today'),
				filters
			)
		);
		return initFilterFromUrl(filters, u);
	}

	let dateScope = $state<'today' | 'all'>('today');
	let query = $state<Record<string, string>>(initialQuery());
	let showFilter = $state(false);
	let showColumns = $state(false);

	const username = $derived(page.data.username ?? '');
	const colsRoute = $derived(path === '/outbox' ? 'outbox' : 'inbox');

	let colPrefs = $state<ReturnType<typeof loadColPrefs>>(
		untrack(() => loadColPrefs(username, colsRoute, cols))
	);
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
		saveColPrefs(username, colsRoute, next);
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
		clearColPrefs(username, colsRoute, cols);
		colPrefs = loadColPrefs(username, colsRoute, cols);
	}

	let messageData = $state<MessageData | null>(null);
	let loadError = $state<string | null>(null);
	let loadErrorCause = $state<string | null>(null);
	let retryTick = $state(0);
	let refreshTick = $state(0);
	let loading = $state(true);
	let lastFetch: FetchTrigger = { key: '', retry: 0, refresh: 0 };

	let autoRefresh = $state(false);
	let refreshSeconds = $state(DEFAULT_AUTO_REFRESH);

	let sortKey = $state<string | null>(null);
	let sortDir = $state<SortDir>('asc');
	let currentPage = $state(1);
	let pageSize = $state(10);

	const endpoint = $derived('/api/messages' + path);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const params = applyLimitDefault(
			applyCheckboxDefaults(
				applyDateDefaults(new SvelteURLSearchParams(page.url.searchParams), dateScope),
				filters
			)
		);
		params.delete('cursor');
		params.delete('pageSize');
		const qs = sortedParamsString(params);
		void retryTick;
		void refreshTick;

		const current: FetchTrigger = {
			key: endpoint + (qs ? '?' + qs : ''),
			retry: retryTick,
			refresh: refreshTick
		};
		const plan = planFetch(lastFetch, current);
		if (!plan.run) {
			loading = false;
			loadError = null;
			return;
		}
		lastFetch = current;

		if (!plan.silent) {
			loading = true;
			loadError = null;
			loadErrorCause = null;
		}

		fetch(current.key)
			.then((res) => {
				if (res.redirected && res.url.includes('/login')) {
					goto(resolve('/login'));
					throw new Error('Sesi berakhir.');
				}
				return res.json() as Promise<MessageBody>;
			})
			.then((body) => {
				if (lastFetch !== current) return;
				const r = normalizeMessageBody(body);
				messageData = r.data;
				loadError = r.error;
				loadErrorCause = r.cause;
				if (!plan.silent) currentPage = 1;
			})
			.catch(() => {
				if (lastFetch !== current || plan.silent) return;
				messageData = null;
				loadError = 'Gagal memuat data.';
			})
			.finally(() => {
				if (lastFetch === current) loading = false;
			});
	});

	$effect(() => {
		if (!autoRefresh) return;
		const tick = () => {
			if (typeof document === 'undefined') return;
			if (!canAutoRefresh(autoRefresh, document.hidden, loading)) return;
			refreshTick += 1;
		};
		const handle = setInterval(tick, autoRefreshMs(refreshSeconds));
		document.addEventListener('visibilitychange', tick);
		return () => {
			clearInterval(handle);
			document.removeEventListener('visibilitychange', tick);
		};
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		let active = true;
		resellersLoaded = false;
		fetch('/api/references/resellers')
			.then((res) => res.json() as Promise<{ status: string; data?: ResellerResponse }>)
			.then((body) => {
				if (active) {
					resellers = body.status === 'sukses' && body.data ? body.data : null;
					resellersLoaded = true;
				}
			})
			.catch(() => {
				if (active) {
					resellers = null;
					resellersLoaded = true;
				}
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

	afterNavigate(() => {
		const raw = new SvelteURLSearchParams(page.url.searchParams);
		raw.delete('cursor');
		raw.delete('pageSize');
		const hasAnyDate = !!(raw.get('startDate') || raw.get('endDate'));
		dateScope = raw.size === 0 || hasAnyDate ? 'today' : 'all';
		const u = applyLimitDefault(applyDateDefaults(raw, dateScope));
		query = initFilterFromUrl(filters, u);
	});

	const statusOptions = $derived(statusOptionsFor(path));
	const limitN = $derived(Number(query['limit']));
	const skeletonCount = $derived(calcSkeletonCount(limitN));
	const skeletonRows = $derived(Array.from({ length: skeletonCount }, (_, i) => i));

	const resellerNames = $derived(
		new Map((resellers?.data.items ?? []).map((r) => [r.kode, r.nama]))
	);

	const enrichedItems = $derived(
		messageData
			? messageData.items.map((item) => ({
					...item,
					nama_reseller: resellerNames.get(item.kode_reseller) ?? item.kode_reseller
				}))
			: []
	);

	const sortSpec = $derived(sortKey === null ? undefined : cols.find((c) => c.key === sortKey));
	const sortedItems = $derived(sortRows(enrichedItems, sortKey, sortDir, sortSpec));
	const total = $derived(sortedItems.length);

	$effect(() => {
		const p = clampPage(currentPage, total, pageSize);
		if (p !== currentPage) currentPage = p;
	});

	const visibleItems = $derived(
		sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	const enrichedData = $derived(
		messageData ? { items: visibleItems, meta: messageData.meta } : null
	);

	function sortBy(key: string) {
		if (sortKey === key) {
			if (sortDir === 'asc') sortDir = 'desc';
			else {
				sortKey = null;
				sortDir = 'asc';
			}
			return;
		}
		sortKey = key;
		sortDir = 'asc';
	}

	function goToPage(next: number) {
		currentPage = next;
	}

	function changePageSize(size: number) {
		pageSize = size;
		currentPage = 1;
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
		const next = buildQuery(query);
		if (paramsEqual(next, page.url.searchParams)) return false;
		navigate(path, next.toString());
		return true;
	}

	function resetFilters() {
		query = { startDate: todayISO(), endDate: todayISO(), limit: '20' };
		dateScope = 'today';
		navigate(path, buildQuery(query).toString());
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
			<PresetMenu bind:query {filters} {controlsDisabled} onApply={applyFilter} />
			<button
				onclick={retryLoad}
				disabled={controlsDisabled}
				class="flex items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 py-1.5 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-accent) hover:text-(--c-accent) disabled:pointer-events-none disabled:opacity-50"
			>
				<RefreshCw class={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
				Refresh
			</button>
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
			<button
				onclick={resetFilters}
				disabled={controlsDisabled}
				class="flex items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-surface) px-3 py-1.5 text-xs font-medium text-(--c-fg-muted) transition-colors hover:border-(--c-danger) hover:bg-(--c-danger-bg) hover:text-(--c-danger) disabled:pointer-events-none disabled:opacity-50"
			>
				<RotateCcw class="h-3.5 w-3.5" />
				Reset filter
			</button>
		</div>
	</div>

	{#if showFilter}
		<MessageFilters
			bind:query
			{filters}
			{statusOptions}
			{resellers}
			{resellersLoaded}
			{controlsDisabled}
			bind:autoRefresh
			bind:refreshSeconds
			onApply={applyFilter}
		/>
	{/if}

	<MessageTable
		data={enrichedData}
		{loading}
		error={loadError}
		errorDetail={loadErrorCause}
		cols={visibleCols}
		{skeletonRows}
		page={currentPage}
		{total}
		{pageSize}
		{sortKey}
		{sortDir}
		pagerDisabled={controlsDisabled}
		onSort={sortBy}
		onPage={goToPage}
		onPageSizeChange={changePageSize}
		onReorderColumns={reorderFromVisible}
		onRetry={retryLoad}
		reloadPath={path}
	/>
</main>
