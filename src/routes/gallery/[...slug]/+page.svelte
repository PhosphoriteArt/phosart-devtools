<script lang="ts">
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
	import { useArtistsContext, useCharacterContext, type RawGallery } from 'phosart-common/util';
	import { onMount } from 'svelte';

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
			await fetch(`/api/gallery/${data.galPath}/save`, {
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

	// TODO FACTOR OUT
	onMount(() => {
		const f = (e: DragEvent) => {
			if ([...(e.dataTransfer?.items ?? [])].some((item) => item.kind === 'file')) {
				e.preventDefault();
			}
		};
		window.addEventListener('drop', f);
		window.addEventListener('dragover', f);
		return () => {
			window.removeEventListener('drop', f);
			window.removeEventListener('dragover', f);
		};
	});
</script>

{#if '$extends' in g}
	<ExtendsEdit bind:value={g.$extends} allGalleries={data.allGalleries} />
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
							galleryPath={data.galPath}
							pieceSlug={piece.slug}
						/>
					</div>
				</div>
				<div>
					<div>Advanced</div>
					<PieceAltEdit bind:value={piece.alts} pieceSlug={piece.slug} galleryPath={data.galPath} />

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
	<div
		ondrop={async (dev) => {
			if (!dev.dataTransfer) return;
			loadingAdd = true;
			let extra = g.pieces.length;
			const promises: Array<Promise<void>> = [];
			for (const item of dev.dataTransfer.items) {
				const f = item.getAsFile();
				if (!f) continue;

				const cur = extra;
				promises.push(
					(async () => {
						// TODO: Factor out
						const formData = new FormData();
						formData.append('file', f);
						formData.append('filename', f.name);
						formData.append('filetype', f.type);

						const fpath = await fetch(`/api/gallery/${data.galPath}/upload-image`, {
							method: 'POST',
							body: formData
						})
							.then((res) => res.json())
							.then((t) => {
								if (typeof t === 'object' && 'fname' in t && typeof t.fname === 'string') {
									return t.fname;
								}
								return null;
							});

						if (!fpath) {
							return;
						}

						let id = f.name.replaceAll(/[^A-Za-z0-9]/g, '-') + '-' + cur;
						while (g.pieces.find((p) => p.slug === id || p.id === id)) {
							id += ' copy';
						}
						const durl = URL.createObjectURL(f);
						if (f.type.startsWith('video')) {
							overrides.setVideoFull(data.galPath, id, undefined, durl);
							overrides.setVideoThumb(data.galPath, id, undefined, durl);
						} else {
							overrides.setImage(data.galPath, id, undefined, durl);
						}

						g.pieces.push({
							id,
							alt: '',
							characters: [],
							date: new Date(f.lastModified),
							name: f.name,
							image: fpath,
							slug: id,
							tags: [],
							alts: [],
							artist: undefined,
							description: '',
							position: undefined,
							video: undefined
						});
					})()
				);
				extra++;
			}

			try {
				await Promise.all(promises);
			} finally {
				loadingAdd = false;
			}
		}}
		role="form"
		class="cursor-pointer rounded-sm border p-3"
	>
		{#if loadingAdd}
			ADDING...
		{:else}
			DROP IMAGE(S) HERE TO CREATE NEW
		{/if}
	</div>
{/if}
