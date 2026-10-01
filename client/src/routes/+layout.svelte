<script lang="ts">
	import { theme } from '$lib/client/theme';
	import { session } from '$lib/client/session.svelte';
	import './layout.css';

	let { children } = $props();

	theme.init();
	session.init();
</script>

<svelte:head><link rel="icon" href="data:," /></svelte:head>

{@render children()}
