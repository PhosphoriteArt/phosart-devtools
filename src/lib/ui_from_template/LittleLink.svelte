<script lang="ts" generics="T extends RouteId | Pathname">
	import { resolve } from '$app/paths';
	import type { Pathname, RouteId } from '$app/types';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		href: Parameters<typeof resolve<T>>;
		class?: string;
	}

	const { children, href, class: cls }: Props = $props();
</script>

<div class="mb-2 flex w-full justify-center text-center text-xl">
	<a
		class="text-understated-link underline decoration-dashed hover:text-understated-link-hover hover:decoration-solid active:text-understated-link-active {cls}"
		href={resolve<T>(...href)}
	>
		{@render children?.()}
	</a>
</div>
