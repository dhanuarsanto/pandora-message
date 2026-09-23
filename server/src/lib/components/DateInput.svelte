<script lang="ts">
	import { Calendar } from '@lucide/svelte';

	let {
		value = $bindable(),
		id,
		disabled
	}: {
		value?: string;
		id: string;
		disabled: boolean;
	} = $props();
</script>

<div class="relative">
	<Calendar
		class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-(--c-fg-faint)"
	/>
	<input
		{id}
		type="date"
		bind:value
		{disabled}
		class="h-9 w-full rounded-lg border border-(--c-border) bg-(--c-surface) py-0 pr-2 pl-8 text-[13px] text-(--c-fg) outline-none focus:border-(--c-accent) disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
	/>
</div>
