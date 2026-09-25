<script lang="ts">
	import MessageList from '$lib/components/MessageList.svelte';
	import { APP_NAME } from '$lib/config';
	import {
		OUTBOX_COLS,
		OUTBOX_FILTERS,
		OUTBOX_LABEL,
		OUTBOX_PATH,
		OUTBOX_STACK_KEY,
		OUTBOX_SUBTITLE
	} from '$lib/message/outboxConfig';
</script>

<svelte:head><title>Outbox - {APP_NAME}</title></svelte:head>

<MessageList
	path={OUTBOX_PATH}
	title={OUTBOX_LABEL}
	subtitle={OUTBOX_SUBTITLE}
	cols={OUTBOX_COLS}
	filters={OUTBOX_FILTERS}
	stackKey={OUTBOX_STACK_KEY}
/>
