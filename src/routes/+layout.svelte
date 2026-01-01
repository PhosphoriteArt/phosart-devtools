<script lang="ts">
	import './layout.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import favicon from '$lib/assets/favicon.svg';
	import NavLink from '$lib/nav/NavLink.svelte';
	import { createSharedEpoch } from '$lib/epoch.svelte';
	import { createSharedGalleryOverrides } from '$lib/galleryoverride.svelte';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	let showPreview = $state(false);

	createSharedEpoch();
	createSharedGalleryOverrides();

	onMount(() => {
		if (!data.previewPort) return;

		const f = (k: KeyboardEvent) => {
			if (k.code === 'Escape') {
				showPreview = false;
			}
		};

		window.addEventListener('keypress', f, { capture: true });
		return () => {
			window.removeEventListener('keypress', f, { capture: true });
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.previewPort}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class:hidden={!showPreview}
		tabindex="-1"
		role="figure"
		class="fixed top-0 right-0 bottom-0 left-0 bg-[#777A]"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				showPreview = false;
			}
		}}
	>
		<div class="fixed top-20 right-20 bottom-20 left-20 overflow-hidden rounded-4xl bg-white">
			<iframe title="preview" class="h-full w-full" src="http://localhost:{data.previewPort}"
			></iframe>
		</div>
	</div>
{/if}
{#if data.previewPort}
	<div class="fixed right-4 bottom-4 z-50">
		<button
			onclick={() => void (showPreview = !showPreview)}
			title="Open/close Preview"
			class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-white hover:bg-gray-300 active:bg-gray-600"
		>
			<i class="fa-regular fa-eye"></i>
		</button>
	</div>
{/if}

<div class="flex w-full justify-center pt-4">
	<div class="container">
		<div
			class="flex min-h-10 w-full items-center justify-center rounded-xl bg-gray-100 py-2 select-none"
		>
			<NavLink href={data.redirectGallery ? `/gallery/${data.redirectGallery}` : `/`}
				>Galleries</NavLink
			>
			<NavLink href="/characters">Characters</NavLink>
			<NavLink href="/artists">Artists</NavLink>
			<NavLink href="/config">Config</NavLink>
		</div>

		{@render children()}
	</div>
</div>
