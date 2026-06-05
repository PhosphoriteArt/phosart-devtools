<script lang="ts">
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
	import type { Snippet } from 'svelte';
	import { getNavbarOpen } from './navbarstate.svelte';
	import Breadcrumbs, { galleryBreadcrumbs } from './ui_from_template/Breadcrumbs.svelte';
	import { usePath } from './path.svelte';

	interface Props {
		title: string;
		children: Snippet;
		navRight?: Snippet;
		breadcrumbs?: boolean | string[];
	}

	const { title, children, navRight, breadcrumbs }: Props = $props();

	const autoPath = $derived.by(usePath);
	const fpath = $derived(Array.isArray(breadcrumbs) ? breadcrumbs : autoPath);
	const navbarOpen = getNavbarOpen();
</script>

<div
	class="flex min-h-15 justify-between border-surface-300-700 bg-surface-100-900/75 px-1 xl:grid xl:grid-cols-3 xl:grid-rows-1"
>
	<div class="flex items-center justify-start justify-self-start">
		<button
			class="ml-4 btn-icon preset-tonal-surface"
			onclick={() => void (navbarOpen.open = !navbarOpen.open)}
			aria-label="toggle sidebar"
		>
			{#if navbarOpen.open}
				<PanelLeftClose />
			{:else}
				<PanelLeftOpen />
			{/if}
		</button>
	</div>
	<div class="flex flex-col items-center justify-center">
		<div class="text-2xl font-light">{title}</div>
	</div>
	<div class="flex items-center justify-end">
		{@render navRight?.()}
	</div>
</div>

{#if breadcrumbs}
	<div class="relative z-10 h-0 bg-transparent">
		<div class="flex w-full justify-center">
			<div
				class="rounded-b-full bg-surface-400-600 px-6 text-surface-contrast-400-600 shadow-xs shadow-surface-100-900"
			>
				<Breadcrumbs path={galleryBreadcrumbs(fpath)} />
			</div>
		</div>
	</div>
{/if}

<div class="relative min-h-0 grow">
	<div class="h-full w-full overflow-scroll p-8 pt-10">
		{@render children()}
	</div>
</div>
