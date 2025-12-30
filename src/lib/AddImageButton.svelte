<script lang="ts">
	import type { BaseArtPiece } from 'phosart-common/util';
	import { createNewPiece } from './galleryutil';
	import { disableWindowDrag } from './dragutil.svelte';
	import { uploadImage } from './util';
	import Droppable from './form/Droppable.svelte';

	interface PieceData {
		file: File;
		piece: BaseArtPiece;
	}

	interface Props {
		existingIdentifiers: Array<string>;
		galleryPath: string;
		onUpload: (pieces: PieceData[]) => void;

		title?: string;
		class?: string;
	}

	const { existingIdentifiers, galleryPath, onUpload, title, class: cls }: Props = $props();

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
					const fpath = await uploadImage(galleryPath, file);
					if (!fpath) {
						return null;
					}

					const piece = createNewPiece(file, fpath, cur, existingIdentifiers);
					return { piece, file: file };
				})()
			);
			extra++;
		}

		try {
			onUpload((await Promise.all(promises)).filter((v): v is PieceData => !!v));
		} finally {
			numLoading--;
		}
	}

	disableWindowDrag();
</script>

<Droppable
	bind:over
	class="block grow cursor-copy rounded-2xl border p-4 text-left select-none {cls}"
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
