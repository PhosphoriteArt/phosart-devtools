<script lang="ts">
	import type { BaseArtPiece } from 'phosart-common/util';
	import { createNewPiece } from './galleryutil';
	import { disableWindowDrag } from './dragutil.svelte';
	import { uploadImage, type UploadPath } from './util';
	import Droppable from './form/Droppable.svelte';

	interface PieceData {
		file: File;
		piece: BaseArtPiece;
	}

	interface Props {
		existingIdentifiers: Array<string>;
		galleryPath: UploadPath;
		onUpload: (pieces: PieceData[]) => void;

		title?: string;
		class?: string;
		defaultArtist?: string | null;
	}

	const {
		existingIdentifiers,
		galleryPath,
		onUpload,
		title,
		class: cls,
		defaultArtist
	}: Props = $props();

	let numLoading = $state(0);
	let over = $state(false);

	async function onDrop(files: File[]): Promise<void> {
		numLoading++;
		let extra = existingIdentifiers.length;
		const promises: Array<Promise<PieceData | null>> = [];
		for (const file of files) {
			const cur = extra;
			promises.push(
				(async () => {
					const { filename: fpath, thumbnail } = await uploadImage(galleryPath, file);
					if (!fpath) {
						return null;
					}

					const piece = createNewPiece(file, fpath, cur, existingIdentifiers, thumbnail);
					if (defaultArtist) {
						piece.artist = defaultArtist;
					}
					return { piece, file: file };
				})()
			);
			extra++;
		}

		try {
			onUpload((await Promise.all(promises)).filter((v): v is PieceData => !!v));
		} finally {
			numLoading--;
			over = false;
		}
	}

	disableWindowDrag();
</script>

<Droppable
	bind:over
	class="block grow cursor-copy rounded-2xl border p-4 text-left select-none {over
		? ''
		: 'border-dashed'} {cls}"
	{onDrop}
>
	{#if numLoading === 0}
		<i class="fa-solid fa-plus"></i>
		<span>
			{#if over}
				Drop your image to add it!
			{:else}
				{title ?? 'Drag an image to add it'}
			{/if}
		</span>
	{:else}
		<i class="fa-solid fa-loading"></i>
		<span> Adding... </span>
	{/if}
</Droppable>
