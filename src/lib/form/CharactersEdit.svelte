<script lang="ts">
	import {
		normalizeCharacter,
		useArtists,
		useCharacters,
		type CharacterRef
	} from 'phosart-common/util';
	import { arrAsObject } from './search/SearchResults.svelte';
	import ControlledChippedInput from './chipped/ControlledChippedInput.svelte';

	interface Props {
		characters: CharacterRef[];
		allCharacters: Record<string, CharacterRef>;
	}

	let { characters: pieceCharacters = $bindable(), allCharacters }: Props = $props();

	const fullCharacters = useCharacters();
	const allArtists = useArtists();
	let search = $state('');
	let manualArtistOptions = $derived(
		arrAsObject(
			Object.keys(allArtists)
				.map((a) => ({ name: search.split(' by')[0], from: a }))
				.filter((ch) => !(`${ch.name} by ${ch.from}` in allCharacters)),
			(a) => `[new] ${a.name} by ${a.from}`
		)
	);
	let options = $derived({ ...allCharacters, ...manualArtistOptions });
</script>

<ControlledChippedInput
	label="Characters"
	{options}
	onSelect={(k, v) => {
		if (!v) {
			k = k.replaceAll(/^\[new\]\s*/g, '');
			const arr = k.split(' by ');
			if (arr.length == 2) {
				v = { from: arr[1], name: arr[0] };
			} else {
				v = arr[0];
			}
		}

		pieceCharacters = [...pieceCharacters, v];
		search = '';
	}}
	onRemove={(_, i) => {
		pieceCharacters = [...pieceCharacters.slice(0, i), ...pieceCharacters.slice(i + 1)];
	}}
	bind:search
	value={pieceCharacters}
>
	{#snippet renderChip(ch)}
		{@const nch = normalizeCharacter(ch, fullCharacters)}
		<div>
			{#if !nch.from}
				{#if nch.info}
					{nch.info.name}
				{:else}
					{nch.name}
				{/if}
			{:else}
				{nch.name} by {nch.from}
			{/if}
		</div>
	{/snippet}
</ControlledChippedInput>
