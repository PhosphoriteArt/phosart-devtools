<script lang="ts">
	import { setNavbarOpen } from '$lib/navbarstate.svelte';
	import Page from './+page.svelte';
	import type { ComponentProps } from 'svelte';

	const props: ComponentProps<typeof Page> = $props();

	setNavbarOpen({ open: false });
</script>

<Page {...props} />
