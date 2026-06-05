<script lang="ts" module>
	export interface Breadcrumb {
		href: string;
		label: string;
	}

	export function galleryBreadcrumbs(galleryPath: string[]): Breadcrumb[] {
		return galleryPath.map((p, i) => ({
			label: p,
			href:
				resolve('/') +
				'?' +
				String(new URLSearchParams({ path: galleryPath.slice(0, i + 1).join('/') }))
		}));
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		path: Breadcrumb[];
	}

	const { path }: Props = $props();
</script>

<nav class="flex w-full justify-center font-light select-none" aria-label="Breadcrumb">
	<div class="flex flex-wrap items-center gap-2">
		<a class="hover:underline" href={resolve('/')}>Home</a>
		{#if path.length > 0}
			<span class="opacity-60">/</span>
		{/if}
		{#each path as crumb, i (i)}
			{#if i < path.length - 1}
				<a class="hover:underline" href={crumb.href}>{crumb.label}</a>
				<span class="opacity-60">/</span>
			{:else}
				<span>{crumb.label}</span>
			{/if}
		{/each}
	</div>
</nav>
