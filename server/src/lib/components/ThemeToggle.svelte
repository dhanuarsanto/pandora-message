<script lang="ts">
	import { theme } from '$lib/theme';
	import { Moon, Sun } from '@lucide/svelte';

	let { isDark, size = 'md' }: { isDark: boolean; size?: 'md' | 'lg' } = $props();

	const box = $derived(size === 'lg' ? 'h-9 w-9' : 'h-8 w-8');
</script>

<button
	onclick={() => theme.toggle()}
	class="flex {box} items-center justify-center rounded-[10px] text-(--c-fg-muted) transition-colors hover:bg-(--c-surface-3) hover:text-(--c-fg) disabled:cursor-not-allowed disabled:opacity-60"
	aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
	title={isDark ? 'Mode terang' : 'Mode gelap'}
>
	{#if isDark}
		<Sun class="h-4 w-4" />
	{:else}
		<Moon class="h-4 w-4" />
	{/if}
</button>
