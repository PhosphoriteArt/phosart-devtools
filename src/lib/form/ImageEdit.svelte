<script lang="ts">
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import type { BaseArtPiece } from 'phosart-common/util';
	import { onMount } from 'svelte';

	interface Props {
		resource: { image: BaseArtPiece['image']; video?: BaseArtPiece['video'] };
		pieceSlug: string;
		galleryPath: string;
		alt?: string;
	}

	let { resource = $bindable(), galleryPath, alt, pieceSlug }: Props = $props();

	const { image, video } = $derived(resource);
	const epoch = getEpoch();
	const overrides = getOverrides();
	const override = $derived(overrides.get(galleryPath, pieceSlug, alt));
	const src = $derived(
		override?.videoFull ??
			override?.image ??
			`/api/gallery/${galleryPath}/${pieceSlug}/original-image?alt=${alt ?? ''}&epoch=${epoch.epoch}`
	);
	const thumbSrc = $derived(override?.videoThumb ?? src + '&thumb=true');

	function makeDropHandler(
		set: (img: string, type: string) => void,
		setOverride: (url: string, type: string) => void
	): (dev: DragEvent) => void {
		return (dev) => {
			const dt = dev.dataTransfer?.items[0];
			const f = dt?.getAsFile();
			if (dt && f) {
				if (override?.image) {
					URL.revokeObjectURL(override.image);
				}
				if (override?.videoFull) {
					URL.revokeObjectURL(override.videoFull);
				}
				if (override?.videoThumb) {
					URL.revokeObjectURL(override.videoThumb);
				}
				const newOverride = URL.createObjectURL(f);
				setOverride(newOverride, f.type);
				const formData = new FormData();
				formData.append('file', f);
				formData.append('filename', f.name);
				formData.append('filetype', f.type);

				fetch(`/api/gallery/${galleryPath}/upload-image`, {
					method: 'POST',
					body: formData
				})
					.then((res) => res.json())
					.then((t) => {
						console.log('RESULT', t);
						if (typeof t === 'object' && 'fname' in t && typeof t.fname === 'string') {
							set(t.fname, f.type);
						}
					});
			}
		};
	}

	onMount(() => {
		const f = (e: DragEvent) => {
			if ([...(e.dataTransfer?.items ?? [])].some((item) => item.kind === 'file')) {
				e.preventDefault();
			}
		};
		window.addEventListener('drop', f);
		window.addEventListener('dragover', f);
		return () => {
			window.removeEventListener('drop', f);
			window.removeEventListener('dragover', f);
		};
	});
</script>

<div>
	<span>Drag an image over this to upload it</span>
	{#if video}
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
			<video controls muted autoplay {src} class="h-full w-full object-contain"></video>
		</div>
	{:else if image}
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
	{:else}
		<div
			ondrop={makeDropHandler(
				(img, typ) => {
					if (typ.startsWith('video')) {
						resource.video = { full: img, thumb: img };
					} else {
						resource.image = img;
					}
				},
				(img, typ) => {
					if (typ.startsWith('video')) {
						overrides.setVideoFull(galleryPath, pieceSlug, alt, img);
						overrides.setVideoThumb(galleryPath, pieceSlug, alt, img);
					} else {
						overrides.setImage(galleryPath, pieceSlug, alt, img);
					}
				}
			)}
			role="form"
			class="h-64 max-h-64 w-64 max-w-64 overflow-hidden rounded-2xl border p-4"
		></div>
	{/if}
</div>
