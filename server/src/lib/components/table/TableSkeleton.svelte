<script lang="ts">
	import type { ColSpec } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		cols,
		skeletonRows
	}: {
		cols: ColSpec[];
		skeletonRows: number[];
	} = $props();

	function barPct(i: number): number {
		return 60 + ((i * 37) % 35);
	}
</script>

<tbody>
	{#each skeletonRows as r (r)}
		<tr class={cn('animate-pulse border-b border-(--c-border)', r % 2 && 'bg-(--c-surface-2)')}>
			{#each cols, ci (ci)}
				<td
					class="border-b border-(--c-border) px-3.5 py-3"
					style={cols[ci].width
						? `width: ${cols[ci].width}px; min-width: ${cols[ci].width}px; max-width: ${cols[ci].width}px`
						: undefined}
				>
					<div class="h-3.5 rounded bg-(--c-surface-2)" style="width: {barPct(ci)}%"></div>
				</td>
			{/each}
		</tr>
	{/each}
</tbody>
