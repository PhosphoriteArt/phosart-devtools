<script lang="ts">
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import { type BaseResource, type UploadPath } from '$lib/util';

	interface Props {
		resource: BaseResource;
		pieceSlug: string;
		galleryPath: UploadPath;
		alt?: string;
		altIndex?: number;
	}

	let { resource = $bindable(), galleryPath, alt, altIndex, pieceSlug }: Props = $props();

	const epoch = getEpoch();
	const overrides = getOverrides();
	const override = $derived(overrides.get(galleryPath, pieceSlug, alt));
	const src = $derived.by(() => {
		if (galleryPath.gallery !== undefined) {
			return (
				override?.videoFull ??
				override?.image ??
				`/api/gallery/${galleryPath.gallery}/${pieceSlug}/original-image?alt=${alt ?? ''}&altIndex=${altIndex ?? ''}&epoch=${epoch.epoch}`
			);
		} else {
			return `/api/characters/${galleryPath.character}/${galleryPath.for}/original-image?epoch=${epoch.epoch}`;
		}
	});
	const thumbSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=true');
</script>

{#if resource.video}
	<video loop controls muted autoplay src={thumbSrc} class="h-full w-full object-contain"></video>
{:else}
	<img {src} class="h-full w-full object-contain" alt="" />
{/if}
