<script lang="ts">
	import './layout.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import favicon from '$lib/assets/favicon.svg';
	import NavLink from '$lib/nav/NavLink.svelte';
	import { createSharedEpoch } from '$lib/epoch.svelte';
	import { createSharedGalleryOverrides } from '$lib/galleryoverride.svelte';

	let { children, data } = $props();

	createSharedEpoch();
	createSharedGalleryOverrides();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

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
