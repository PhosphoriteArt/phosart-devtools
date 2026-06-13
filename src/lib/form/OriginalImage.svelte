<script lang="ts">
	import { resolve } from '$app/paths';
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
				resolve('/api/gallery/[...gallerypath]/[piece]/original-image', {
					gallerypath: galleryPath.gallery,
					piece: galleryPath.piece
				}) +
					'?' +
					String(
						new URLSearchParams({
							alt: galleryPath.alt ?? '',
							altIndex: String(galleryPath.altIndex ?? ''),
							epoch: String(epoch.epoch)
						})
					)
			);
		} else {
			return (
				resolve('/api/characters/[charactername]/[type]/original-image', {
					charactername: galleryPath.character,
					type: galleryPath.for
				}) +
				'?' +
				String(
					new URLSearchParams({
						epoch: String(epoch.epoch)
					})
				)
			);
		}
	});
	const thumbSrc = $derived(override?.videoThumb ?? src + '&video=true&thumb=true');
</script>

{#if isVideo}
	<video loop controls muted autoplay src={thumbSrc} class="h-full w-full {cls || 'object-contain'}"
	></video>
{:else}
	<img {src} class="h-full w-full {cls || 'object-contain'}" alt="" />
{/if}
