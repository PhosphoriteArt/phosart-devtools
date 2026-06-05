<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	let { href, children }: { href: string; children?: Snippet } = $props();
	let path = $derived(page.route.id);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const asAny = $derived(href as any);
</script>

<a
	href={resolve(asAny)}
	class="btn"
	class:preset-tonal={path != href.replace(/#.*$/, '')}
	class:text-surface-contrast-light={path != href.replace(/#.*$/, '')}
	class:preset-filled={path == href.replace(/#.*$/, '')}
>
	{@render children?.()}
</a>
