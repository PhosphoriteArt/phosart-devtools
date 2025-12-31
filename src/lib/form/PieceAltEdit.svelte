<script lang="ts">
	import type { BaseArtPiece } from 'phosart-common/util';
	import TextInput from './TextInput.svelte';
	import TextBox from './TextBox.svelte';
	import ImageEdit from './ImageEdit.svelte';
	import Collapsable from '$lib/Collapsable.svelte';
	import AddImageButton from '$lib/AddImageButton.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';
	import OriginalImage from './OriginalImage.svelte';

	interface Props {
		pieceSlug: string;
		galleryPath: string;
		value: BaseArtPiece['alts'];
	}

	let { value = $bindable(), pieceSlug, galleryPath }: Props = $props();
	const overrides = getOverrides();
</script>

<div>
	<div>Alternatives:</div>
	<div class="ml-4">
		{#each value as alt, i (`${i}-${value?.length}`)}
			<Collapsable title={alt.name} class="my-2 border">
				{#snippet collapsedRight()}
					<div class="h-16 max-h-16 w-16 max-w-16">
						<OriginalImage {galleryPath} {pieceSlug} resource={alt} alt={alt.name} altIndex={i} />
					</div>
				{/snippet}

				<TextInput label="Name" bind:value={alt.name} />
				<TextBox label="Description" bind:value={alt.description} />
				<TextBox label="Alt Text" bind:value={alt.alt} />

				<ImageEdit
					{galleryPath}
					{pieceSlug}
					alt={alt.name}
					altIndex={i}
					bind:resource={value![i]}
				/>
				<div>
					<button
						onclick={() => {
							if (!value) return;

							value = [...value.slice(0, i), ...value.slice(i + 1)];
						}}
						class="cursor-pointer rounded-2xl border p-3">Delete</button
					>
				</div>
			</Collapsable>
		{/each}
		<div class="flex">
			<AddImageButton
				title="Drag image to add a new alt"
				existingIdentifiers={value?.map((p) => p.name) ?? []}
				{galleryPath}
				onUpload={(data) => {
					if (!value) {
						value = [];
					}
					for (let i = 0; i < data.length; i++) {
						overrides.setFromNew(
							galleryPath,
							pieceSlug,
							data[i].piece.name,
							value.length + i,
							data[i].file
						);
					}
					value = [
						...value,
						...data
							.map((p) => p.piece)
							.map(
								(p) =>
									({
										alt: p.alt,
										image: p.image,
										name: p.name,
										description: p.description,
										video: p.video
									}) satisfies NonNullable<BaseArtPiece['alts']>[number]
							)
					];
				}}
			/>
		</div>
	</div>
</div>
