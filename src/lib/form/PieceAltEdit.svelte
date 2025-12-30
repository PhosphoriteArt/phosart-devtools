<script lang="ts">
	import type { BaseArtPiece } from 'phosart-common/util';
	import TextInput from './TextInput.svelte';
	import TextBox from './TextBox.svelte';
	import ImageEdit from './ImageEdit.svelte';

	interface Props {
		pieceSlug: string;
		galleryPath: string;
		value: BaseArtPiece['alts'];
	}

	let { value = $bindable(), pieceSlug, galleryPath }: Props = $props();
</script>

<div>
	<div>ALTS</div>
	{#each value as alt, i (alt.name)}
		<div class="ml-4 border">
			<TextInput label="Name" bind:value={alt.name} />
			<TextBox
				label="Description"
				bind:value={alt.description}
				placeholder="appends to the main piece's description"
			/>
			<TextBox label="Alt Text" bind:value={alt.alt} placeholder="defaults to description" />

			<ImageEdit {galleryPath} {pieceSlug} alt={alt.name} bind:resource={value![i]} />

			<pre>{JSON.stringify(alt, null, 4)}</pre>
		</div>
	{/each}
</div>
