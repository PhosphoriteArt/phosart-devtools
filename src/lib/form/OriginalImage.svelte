<script lang="ts">
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import { type UploadPath } from '$lib/util';

	interface Props {
		isVideo?: boolean;
		galleryPath: UploadPath;
		class?: string;
	}

	let { isVideo, galleryPath, class: cls }: Props = $props();

	const epoch = getEpoch();
	const overrides = getOverrides();
	const override = $derived(
		overrides.get(galleryPath, galleryPath.piece ?? 'character', galleryPath.alt)
	);
	const src = $derived.by(() => {
		if (galleryPath.gallery !== undefined) {
			return (
				override?.videoFull ??
				override?.image ??
				`/api/gallery/${galleryPath.gallery}/${galleryPath.piece}/original-image?alt=${galleryPath.alt ?? ''}&altIndex=${galleryPath.altIndex ?? ''}&epoch=${epoch.epoch}`
			);
		} else {
			return `/api/characters/${galleryPath.character}/${galleryPath.for}/original-image?epoch=${epoch.epoch}`;
		}
	});
	const thumbSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=true');
</script>

{#if isVideo}
	<video loop controls muted autoplay src={thumbSrc} class="h-full w-full object-contain {cls}"
	></video>
{:else}
	<img {src} class="h-full w-full object-contain {cls}" alt="" />
{/if}
