<script lang="ts">
	import MessageList from '$lib/components/MessageList.svelte';
	import { APP_NAME } from '$lib/config';
	import {
		INBOX_COLS,
		INBOX_FILTERS,
		INBOX_LABEL,
		INBOX_PATH,
		INBOX_STACK_KEY,
		INBOX_SUBTITLE
	} from '$lib/message/inboxConfig';
</script>

<svelte:head><title>Inbox - {APP_NAME}</title></svelte:head>

<MessageList
	path={INBOX_PATH}
	title={INBOX_LABEL}
	subtitle={INBOX_SUBTITLE}
	cols={INBOX_COLS}
	filters={INBOX_FILTERS}
	stackKey={INBOX_STACK_KEY}
/>
