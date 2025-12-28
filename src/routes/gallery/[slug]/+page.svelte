<script lang="ts">
	import ArtistEdit from '$lib/form/ArtistEdit.svelte';
	import CharactersEdit from '$lib/form/CharactersEdit.svelte';
	import DateEdit from '$lib/form/DateEdit.svelte';
	import ExtendsEdit from '$lib/form/ExtendsEdit.svelte';
	import OptionalInput from '$lib/form/OptionalInput.svelte';
	import PieceAltEdit from '$lib/form/PieceAltEdit.svelte';
	import TagEdit from '$lib/form/TagEdit.svelte';
	import TextBox from '$lib/form/TextBox.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import { type RawGallery } from 'phosart-common/util';
	const { data } = $props();
	const g: RawGallery = $state(data.rawGallery);
</script>

{#if '$extends' in g}
	<ExtendsEdit bind:value={g.$extends} />
{:else}
	<div>--GALLERY--</div>
	{#each g.pieces as piece (piece.id)}
		<div class="m-2 rounded-md border p-2">
			<div>
				<div>
					<div>General</div>
					<div>
						<TextInput label="Name" bind:value={piece.name} />
						<ArtistEdit bind:value={piece.artist} />
						<DateEdit label="Date" bind:value={piece.date} />
						<TagEdit label="Tags" bind:value={piece.tags} possibleTags={data.allTags} prefix="#" />
						<CharactersEdit bind:value={piece.characters} />
						<TextBox label="Alt Text" bind:value={piece.alt} />
						<TextBox label="Description" bind:value={piece.description} />
						<PieceAltEdit bind:value={piece.alts} />
					</div>
				</div>
				<div>
					<div>Advanced</div>
					<div>
						<OptionalInput bind:value={piece.id}>
							{#snippet control(disabled: boolean)}
								<TextInput label="id" bind:value={piece.id} {disabled} />
							{/snippet}
						</OptionalInput>
					</div>
				</div>
			</div>
			<div class="mt-2 border-t border-gray-300">
				<pre>{JSON.stringify(piece, null, 4)}</pre>
			</div>
		</div>
	{/each}
{/if}
