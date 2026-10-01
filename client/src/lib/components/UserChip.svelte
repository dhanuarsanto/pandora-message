<script lang="ts">
	let {
		initial,
		name,
		titleName,
		rules,
		size = 'md'
	}: {
		initial: string;
		name: string;
		titleName: string;
		rules: string | null;
		size?: 'md' | 'lg';
	} = $props();
</script>

{#if size === 'md'}
	<div
		class="flex items-center gap-1.5 rounded-[10px] border border-(--c-border) bg-(--c-surface) py-1.5 pr-3 pl-1.5 transition-colors hover:border-(--c-accent)"
	>
		<div
			class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-(--c-accent) to-(--c-accent-strong) text-xs font-bold text-white shadow-[0_4px_10px_-4px_rgba(14,122,74,0.5)]"
		>
			{initial}
		</div>
		<div class="leading-none">
			<p
				class="max-w-32.5 truncate text-[13px] font-semibold tracking-wider text-(--c-fg)"
				title={titleName}
			>
				{name}
			</p>
			{#if rules}
				<p class="mt-1 text-[10px] font-semibold tracking-wider text-(--c-accent-strong) uppercase">
					{rules}
				</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-(--c-accent) to-(--c-accent-strong) text-sm font-bold text-white shadow-[0_4px_10px_-4px_rgba(14,122,74,0.5)]"
		>
			{initial}
		</div>
		<div class="min-w-0 leading-none">
			<p class="truncate text-sm font-semibold tracking-wider text-(--c-fg)" title={titleName}>
				{name}
			</p>
			{#if rules}
				<p class="mt-1 text-[10px] font-semibold tracking-wider text-(--c-accent-strong) uppercase">
					{rules}
				</p>
			{/if}
		</div>
	</div>
{/if}
