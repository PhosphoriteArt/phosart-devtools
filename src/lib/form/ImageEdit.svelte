<script lang="ts">
	import { disableWindowDrag } from '$lib/dragutil.svelte';
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import { uploadImage, type BaseResource } from '$lib/util';

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
	const videoSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=false');
	const thumbSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=true');

	function makeDropHandler(
		set: (img: string, type: string) => void,
		setOverride: (url: string, type: string) => void
	): (dev: DragEvent) => void {
		return (dev) => {
			const dt = dev.dataTransfer?.items[0];
			const f = dt?.getAsFile();
			if (dt && f) {
				const newOverride = URL.createObjectURL(f);
				setOverride(newOverride, f.type);
				uploadImage(galleryPath, f).then((fpath) => {
					set(fpath, f.type);
				});
			}
		};
	}

	disableWindowDrag();
</script>

<div>
	<span>Drag an image over this to upload it</span>
	{#if resource.video}
		<div>THUMB</div>
		<div
			ondrop={makeDropHandler(
				(img) => void (resource.video = { full: img, ...(resource.video ?? {}), thumb: img }),
				(img) => void overrides.setVideoThumb(galleryPath, pieceSlug, alt, img)
			)}
			role="form"
			class="h-64 max-h-64 w-64 max-w-64 overflow-hidden rounded-2xl border p-4"
		>
			<video controls muted autoplay src={thumbSrc} class="h-full w-full object-contain"></video>
		</div>
		<div>FULL</div>
		<div
			ondrop={makeDropHandler(
				(img) => void (resource.video = { thumb: img, ...(resource.video ?? {}), full: img }),
				(img) => void overrides.setVideoFull(galleryPath, pieceSlug, alt, img)
			)}
			role="form"
			class="h-64 max-h-64 w-64 max-w-64 overflow-hidden rounded-2xl border p-4"
		>
			<video controls muted autoplay src={videoSrc} class="h-full w-full object-contain"></video>
		</div>
	{/if}
	<div>IMAGE</div>
	<div
		ondrop={makeDropHandler(
			(img) => void (resource.image = img),
			(img) => void overrides.setImage(galleryPath, pieceSlug, alt, img)
		)}
		role="form"
		class="h-64 max-h-64 w-64 max-w-64 overflow-hidden rounded-2xl border p-4"
	>
		<img {src} class="h-full w-full object-contain" alt="" />
	</div>
</div>
