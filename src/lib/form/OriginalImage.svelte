<script lang="ts">
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import { type BaseResource } from '$lib/util';

	interface Props {
		resource: BaseResource;
		pieceSlug: string;
		galleryPath: string;
		alt?: string;
	}

	let { resource = $bindable(), galleryPath, alt, pieceSlug }: Props = $props();

	const epoch = getEpoch();
	const overrides = getOverrides();
	const override = $derived(overrides.get(galleryPath, pieceSlug, alt));
	const src = $derived(
		override?.videoFull ??
			override?.image ??
			`/api/gallery/${galleryPath}/${pieceSlug}/original-image?alt=${alt ?? ''}&epoch=${epoch.epoch}`
	);
	const thumbSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=true');
</script>

{#if resource.video}
	<video loop controls muted autoplay src={thumbSrc} class="h-full w-full object-contain"></video>
{:else}
	<img {src} class="h-full w-full object-contain" alt="" />
{/if}
