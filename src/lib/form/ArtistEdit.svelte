<script lang="ts">
	import { normalizeArtist, useArtists, type BaseArtist } from '@phosart/common/util';
	import ChippedInput from './chipped/ChippedInput.svelte';
	import { addKey, arrAsObject } from './search/SearchResults.svelte';

	interface Props {
		artists?: BaseArtist | BaseArtist[];
	}

	let { artists: pieceArtists = $bindable() }: Props = $props();

	const allArtists = useArtists();
	const normalizedAll = $derived(normalizeArtist(Object.keys(allArtists), allArtists));
	const normalized = $derived(normalizeArtist(pieceArtists, allArtists));
	const options = $derived(
		arrAsObject(
			addKey(normalizedAll, (na) => `@${na.info!.handle} (${na.info!.name})`),
			(s) => s.info!.handle
		)
	);
</script>

<ChippedInput
	label="Artists"
	{options}
	bind:value={() => normalized, (v) => void (pieceArtists = v.map((v) => v.name))}
	prefix="@"
	onAddUnknown={(s) => {
		return { name: s, anonymous: false, info: null };
	}}
>
	{#snippet renderChip(na)}
		@{na.name}
	{/snippet}
</ChippedInput>
