<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { resolve } from '$app/paths';
	import { disableWindowDrag } from '$lib/dragutil.svelte';
	import { getEpoch } from '$lib/epoch.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import { uploadImage, type BaseResource, type UploadPath } from '$lib/util';
	import Droppable from './Droppable.svelte';
	import { Check, Eye, EyeOff, X } from '@lucide/svelte';
	import Modal from '$lib/Modal.svelte';
	import PieceAltEdit from './PieceAltEdit.svelte';
	import type { BaseArtPiece } from '@phosart/common/util';
	import TextBox from './TextBox.svelte';

	interface Props {
		resource: BaseResource;
		alt: string;
		isDeindexed: boolean | undefined | null;
		isNsfw: boolean | undefined | null;
		isComic: boolean | undefined | null;
		alts: BaseArtPiece['alts'] | undefined | null;
		galleryPath: UploadPath;
		disabled?: boolean;
		class?: string;
	}

	let {
		resource = $bindable(),
		alt = $bindable(),
		isDeindexed = $bindable(),
		isNsfw = $bindable(),
		isComic = $bindable(),
		alts = $bindable(),
		galleryPath,
		disabled,
		class: cls
	}: Props = $props();

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

	disableWindowDrag();
</script>

{#snippet main()}
	{#if resource?.video}
		<div class="flex flex-col items-center">
			<div>Full-res</div>
			<Droppable
				onDrop={makeDropHandler(
					(img) => void (resource.video = { thumb: img, ...(resource.video ?? {}), full: img }),
					(img) => void overrides.setVideoFull(galleryPath, img)
				)}
				class="h-full max-h-64 w-full  max-w-64"
			>
				<video
					loop
					controls
					muted
					autoplay
					src={videoSrc}
					class="h-full w-full object-contain {cls}"
				></video>
			</Droppable>
		</div>
	{:else}
		<Droppable
			onDrop={makeDropHandler(
				(img) => void (resource.image = img),
				(img) => void overrides.setImage(galleryPath, img)
			)}
			class="h-full max-h-64 w-full"
		>
			<img {src} class="h-full max-h-64 w-full object-contain {cls}" alt="" />
		</Droppable>
	{/if}
{/snippet}

{#snippet extras()}
	{#if resource?.video}
		<div class="flex flex-row justify-around">
			<div class="flex flex-col items-center">
				<div>Thumbnail Video</div>
				<Droppable
					{disabled}
					onDrop={makeDropHandler(
						(img) => void (resource.video = { full: img, ...(resource.video ?? {}), thumb: img }),
						(img) => void overrides.setVideoThumb(galleryPath, img)
					)}
					class="h-full max-h-32 w-full max-w-32"
				>
					<video
						loop
						controls
						muted
						autoplay
						src={thumbSrc}
						class="h-full w-full object-contain {cls}"
					></video>
				</Droppable>
			</div>

			<div class="flex flex-col items-center">
				<div>Thumbnail Still</div>
				<Droppable
					onDrop={makeDropHandler(
						(img) => void (resource.image = img),
						(img) => void overrides.setImage(galleryPath, img)
					)}
					class="h-full max-h-32 w-full  max-w-32"
				>
					<img {src} class="h-full w-full object-contain {cls}" alt="" />
				</Droppable>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet controls()}
	<div class="flex w-full justify-center">
		<div class="grid grid-cols-2 gap-2 p-3" style="grid-template-rows: auto 1fr 1ft;">
			<div class="col-span-2">
				<TextBox bind:value={alt} label="Alt Text" />
			</div>
			<div>
				{#if isNsfw !== null}
					<Switch
						{disabled}
						checked={isNsfw}
						onCheckedChange={(details) => void (isNsfw = details.checked)}
					>
						<Switch.Control
							class="preset-filled-primary-50-950 data-[state=checked]:preset-filled-primary-300-700"
						>
							<Switch.Thumb>
								<Switch.Context>
									{#snippet children(ctx)}
										{#if ctx().checked}
											<Check class="size-3" />
										{:else}
											<X class="size-3" />
										{/if}
									{/snippet}
								</Switch.Context>
							</Switch.Thumb>
						</Switch.Control>
						<Switch.Label>NSFW</Switch.Label>
						<Switch.HiddenInput />
					</Switch>
				{/if}
			</div>
			<div>
				{#if isDeindexed !== null}
					<Switch
						{disabled}
						checked={isDeindexed}
						onCheckedChange={(details) => void (isDeindexed = details.checked)}
					>
						<Switch.Control
							class="preset-filled-primary-50-950 data-[state=checked]:preset-filled-primary-300-700"
						>
							<Switch.Thumb>
								<Switch.Context>
									{#snippet children(ctx)}
										{#if ctx().checked}
											<EyeOff class="size-3" />
										{:else}
											<Eye class="size-3" />
										{/if}
									{/snippet}
								</Switch.Context>
							</Switch.Thumb>
						</Switch.Control>
						<Switch.Label>Hidden</Switch.Label>
						<Switch.HiddenInput />
					</Switch>
				{/if}
			</div>
			<div>
				{#if isComic !== null}
					<Switch
						{disabled}
						checked={isComic}
						onCheckedChange={(details) => void (isComic = details.checked)}
					>
						<Switch.Control
							class="preset-filled-primary-50-950 data-[state=checked]:preset-filled-primary-300-700"
						>
							<Switch.Thumb>
								<Switch.Context>
									{#snippet children(ctx)}
										{#if ctx().checked}
											<Check class="size-3" />
										{:else}
											<X class="size-3" />
										{/if}
									{/snippet}
								</Switch.Context>
							</Switch.Thumb>
						</Switch.Control>
						<Switch.Label>Comic Mode</Switch.Label>
						<Switch.HiddenInput />
					</Switch>
				{/if}
			</div>
			<div>
				{#if alts !== null && !('character' in galleryPath)}
					<Modal
						{disabled}
						title={isComic ? 'Pages...' : 'Alts...'}
						class="btn preset-tonal-primary"
					>
						<PieceAltEdit
							label={isComic ? 'Extra Pages' : 'Alternatives'}
							shortLabel={isComic ? 'page' : 'alt'}
							bind:value={alts}
							{galleryPath}
						/>
					</Modal>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<div class="relative flex h-full w-full flex-col p-1">
	{@render main()}
	{@render extras()}
	{@render controls()}
</div>
