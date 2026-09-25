<script lang="ts">
	import { theme } from '$lib/client/theme';
	import './layout.css';

	let { children } = $props();

	theme.init();
</script>

<svelte:head><link rel="icon" href="data:," /></svelte:head>

{@render children()}
