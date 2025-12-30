<script lang="ts">
	import type { BaseArtPiece } from 'phosart-common/util';
	import TextInput from './TextInput.svelte';
	import TextBox from './TextBox.svelte';
	import ImageEdit from './ImageEdit.svelte';
	import Collapsable from '$lib/Collapsable.svelte';
	import AddImageButton from '$lib/AddImageButton.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte';

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
		{#each value as alt, i (alt.name)}
			<Collapsable title={alt.name} class="my-2 border">
				<TextInput label="Name" bind:value={alt.name} />
				<TextBox label="Description" bind:value={alt.description} />
				<TextBox label="Alt Text" bind:value={alt.alt} />

				<ImageEdit {galleryPath} {pieceSlug} alt={alt.name} bind:resource={value![i]} />

				<pre>{JSON.stringify(alt, null, 4)}</pre>
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
					for (const datum of data) {
						overrides.setFromNew(galleryPath, pieceSlug, datum.piece.name, datum.file);
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
