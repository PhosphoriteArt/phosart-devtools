<script lang="ts">
	import Breadcrumbs, { type Breadcrumb } from './Breadcrumbs.svelte';

	interface Props {
		title: string;
		subtitle?: string;
		breadcrumb?: Breadcrumb[];
	}

	const { title, subtitle, breadcrumb }: Props = $props();
</script>

<div class="mt-8 mb-12 flex w-full flex-col items-center text-4xl">
	<h1 class="text-5xl font-extralight">{title}</h1>
	<h2 class="text-xl font-extralight italic">{subtitle || ' '}</h2>
</div>

{#if Array.isArray(breadcrumb)}
	<Breadcrumbs path={breadcrumb} />
{/if}
