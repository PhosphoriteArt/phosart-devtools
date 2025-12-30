<script lang="ts">
	import { disableWindowDrag } from '$lib/dragutil.svelte.js';
	import { getEpoch } from '$lib/epoch.svelte.js';
	import ArtistEdit from '$lib/form/ArtistEdit.svelte';
	import CharactersEdit from '$lib/form/CharactersEdit.svelte';
	import DateEdit from '$lib/form/DateEdit.svelte';
	import ExtendsEdit from '$lib/form/ExtendsEdit.svelte';
	import ImageEdit from '$lib/form/ImageEdit.svelte';
	import OptionalInput from '$lib/form/OptionalInput.svelte';
	import PieceAltEdit from '$lib/form/PieceAltEdit.svelte';
	import TagEdit from '$lib/form/TagEdit.svelte';
	import TextBox from '$lib/form/TextBox.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte.js';
	import { createNewPiece, isBaseGallery, isExtendsGallery } from '$lib/galleryutil.js';
	import { uploadImage } from '$lib/util.js';
	import { useArtistsContext, useCharacterContext, type RawGallery } from 'phosart-common/util';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	const g: RawGallery = $state(data.rawGallery);

	// svelte-ignore state_referenced_locally
	useArtistsContext(Object.values(data.allArtists));
	// svelte-ignore state_referenced_locally
	useCharacterContext(Object.values(data.allCharacters));

	let refs: Record<string, TextInput> = $state({});

	let loadingAdd = $state(false);
	let loading = $state(false);
	let error: string | null = $state(null);

	const overrides = getOverrides();
	let epoch = getEpoch();

	async function save() {
		loading = true;
		try {
			await fetch(`/api/gallery/${data.galleryPath}/save`, {
				method: 'POST',
				body: JSON.stringify(g),
				headers: { 'Content-Type': 'application/json' }
			});
			epoch.epoch += 1;
			overrides.reset();
		} finally {
			loading = false;
		}
	}

	async function onDrop(dev: DragEvent): Promise<void> {
		if (!dev.dataTransfer || !isBaseGallery(g)) return;
		loadingAdd = true;
		let extra = g.pieces.length;
		const promises: Array<Promise<void>> = [];
		for (const item of dev.dataTransfer.items) {
			const f = item.getAsFile();
			if (!f) continue;

			const cur = extra;
			promises.push(
				(async () => {
					const fpath = await uploadImage(data.galleryPath, f);
					if (!fpath) {
						return;
					}

					const piece = createNewPiece(f, fpath, cur, g.pieces);
					overrides.setFromNew(data.galleryPath, piece.slug, undefined, f);
					g.pieces.push(piece);
				})()
			);
			extra++;
		}

		try {
			await Promise.all(promises);
		} finally {
			loadingAdd = false;
		}
	}

	disableWindowDrag();
</script>

{#if isExtendsGallery(g)}
	<ExtendsEdit bind:value={g.$extends} allGalleries={data.allGalleryRelpaths} />
{:else}
	<div>--GALLERY--</div>
	{#each g.pieces as piece, i (piece.slug)}
		<div class="m-2 rounded-md border p-2">
			<div>
				<div>
					<div>General</div>
					<div>
						<TextInput label="Name" bind:value={piece.name} />
						<ArtistEdit bind:artists={piece.artist} />
						<DateEdit bind:date={piece.date} />
						<TagEdit bind:value={piece.tags} possibleTags={data.allTags} prefix="#" />
						<CharactersEdit
							bind:characters={piece.characters}
							allCharacters={data.allCharacterRefs}
						/>
						<TextBox label="Description" bind:value={piece.description} />
						<TextBox
							label="Alt Text"
							bind:value={piece.alt}
							placeholder="defaults to description"
						/>
						<ImageEdit
							bind:resource={g.pieces[i]}
							galleryPath={data.galleryPath}
							pieceSlug={piece.slug}
						/>
					</div>
				</div>
				<div>
					<div>Advanced</div>
					<PieceAltEdit
						bind:value={piece.alts}
						pieceSlug={piece.slug}
						galleryPath={data.galleryPath}
					/>

					<div>
						<OptionalInput bind:value={piece.id} empty="">
							{#snippet control(enabled, value)}
								<TextInput
									label="id"
									bind:this={refs[piece.slug]}
									bind:value={() => value, (v) => void (piece.id = v)}
									disabled={!enabled}
									onclick={() => {
										piece.id = value;
										refs[piece.slug]?.focus();
									}}
								/>
							{/snippet}
						</OptionalInput>
					</div>
				</div>
			</div>
			<div class="mt-2 border-t border-gray-300">
				<pre>{JSON.stringify(piece, null, 4)}</pre>
			</div>

			{#if !loading}
				<button onclick={() => void save()} class="cursor-pointer rounded-sm border p-3"
					>Save</button
				>
			{:else}
				<div class="cursor-pointer rounded-sm border p-3">Saving...</div>
			{/if}
			{#if error}
				<div>ERROR: {error}</div>
			{/if}
		</div>
	{/each}
	<div ondrop={onDrop} role="form" class="cursor-pointer rounded-sm border p-3">
		{#if loadingAdd}
			ADDING...
		{:else}
			DROP IMAGE(S) HERE TO CREATE NEW
		{/if}
	</div>
{/if}
