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
	class="mx-4 cursor-pointer rounded-xl px-8 py-2 select-none"
	class:bg-gray-300={path == href}
	class:bg-gray-200={path != href}
	class:hover:bg-gray-400={path != href}
	class:active:bg-gray-500={path != href}
	class:cursor-default={path == href}
>
	{@render children?.()}
</a>
