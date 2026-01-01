<script lang="ts">
	import { disableWindowDrag } from '$lib/dragutil.svelte';
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import { uploadImage, type BaseResource, type UploadPath } from '$lib/util';
	import Droppable from './Droppable.svelte';

	interface Props {
		resource: BaseResource;
		galleryPath: UploadPath;
		label?: string;
		disabled?: boolean;
	}

	let { resource = $bindable(), galleryPath, label, disabled }: Props = $props();

	const epoch = getEpoch();
	const overrides = getOverrides();
	const override = $derived(
		overrides.get(
			galleryPath,
			galleryPath.piece ?? 'character',
			galleryPath.alt,
			galleryPath.altIndex
		)
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
	const videoSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=false');
	const thumbSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=true');

	function makeDropHandler(
		set: (img: string, type: string) => void,
		setOverride: (url: string, type: string) => void
	): (files: File[]) => void {
		return (files) => {
			const f = files[0];
			if (!f) return;

			const newOverride = URL.createObjectURL(f);
			setOverride(newOverride, f.type);
			uploadImage(galleryPath, f, f.name).then(({ filename }) => {
				set(filename, f.type);
			});
		};
	}

	const border = $derived(disabled ? 'border border-dashed' : 'border');

	disableWindowDrag();
</script>

<div class="flex items-center">
	<span><pre class="w-40">{label ?? 'Image'}</pre></span>
	<div
		class="flex gap-x-2 rounded-2xl {resource.video ? 'overflow-scroll border p-2' : ''} {disabled
			? 'cursor-not-allowed grayscale'
			: ''}"
	>
		{#if resource.video}
			<div class="flex flex-col items-center">
				<div>Thumbnail</div>
				<Droppable
					onDrop={makeDropHandler(
						(img) => void (resource.video = { full: img, ...(resource.video ?? {}), thumb: img }),
						(img) => void overrides.setVideoThumb(galleryPath, img)
					)}
					class="h-64 max-h-64 w-64 max-w-64 overflow-hidden rounded-2xl {border} p-4"
				>
					<video loop controls muted autoplay src={thumbSrc} class="h-full w-full object-contain"
					></video>
				</Droppable>
			</div>
			<div class="flex flex-col items-center">
				<div>Full</div>
				<Droppable
					onDrop={makeDropHandler(
						(img) => void (resource.video = { thumb: img, ...(resource.video ?? {}), full: img }),
						(img) => void overrides.setVideoFull(galleryPath, img)
					)}
					class="h-64 max-h-64 w-64 max-w-64 overflow-hidden rounded-2xl {border} p-4"
				>
					<video loop controls muted autoplay src={videoSrc} class="h-full w-full object-contain"
					></video>
				</Droppable>
			</div>
		{/if}
		<div class="flex flex-col items-center">
			{#if resource.video}
				<div>Still Backdrop</div>
			{/if}
			<Droppable
				onDrop={makeDropHandler(
					(img) => void (resource.image = img),
					(img) => void overrides.setImage(galleryPath, img)
				)}
				class="h-64 max-h-64 w-64 max-w-64 overflow-hidden rounded-2xl {border} p-4"
			>
				<img {src} class="h-full w-full object-contain" alt="" />
			</Droppable>
		</div>
	</div>
</div>
