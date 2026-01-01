<script lang="ts" module>
	export async function persistGallery(galleryPath: string, gallery: RawGallery) {
		try {
			await fetch(`/api/gallery/${galleryPath}/save`, {
				method: 'POST',
				body: JSON.stringify(gallery),
				headers: { 'Content-Type': 'application/json' }
			});
		} finally {
			await invalidateAll();
		}
	}
</script>

<script lang="ts">
	import AddImageButton from '$lib/AddImageButton.svelte';
	import Collapsable from '$lib/Collapsable.svelte';
	import { getEpoch } from '$lib/epoch.svelte.js';
	import ArtistEdit from '$lib/form/ArtistEdit.svelte';
	import CharactersEdit from '$lib/form/CharactersEdit.svelte';
	import DateEdit from '$lib/form/DateEdit.svelte';
	import ExtendsEdit from '$lib/form/ExtendsEdit.svelte';
	import ImageEdit from '$lib/form/ImageEdit.svelte';
	import OptionalInput from '$lib/form/OptionalInput.svelte';
	import OriginalImage from '$lib/form/OriginalImage.svelte';
	import PieceAltEdit from '$lib/form/PieceAltEdit.svelte';
	import TagEdit from '$lib/form/TagEdit.svelte';
	import TextBox from '$lib/form/TextBox.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte.js';
	import { isBaseGallery, isExtendsGallery } from '$lib/galleryutil.js';
	import Modal from '$lib/Modal.svelte';
	import {
		useArtistsContext,
		useCharacterContext,
		type BaseArtPiece,
		type RawGallery
	} from 'phosart-common/util';
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	const g: RawGallery = $state(data.rawGallery);

	const sorted: (readonly [BaseArtPiece, number])[] = $derived(
		g && isBaseGallery(g)
			? g.pieces
					.map((v, i) => [v, i] as const)
					.toSorted(([a], [b]) => b.date.getTime() - a.date.getTime())
			: []
	);

	// svelte-ignore state_referenced_locally
	useArtistsContext(data.allArtists);
	// svelte-ignore state_referenced_locally
	useCharacterContext(data.allCharacters);

	let refs: Record<string, TextInput> = $state({});

	let loading = $state(false);
	let error: string | null = $state(null);

	const overrides = getOverrides();
	let epoch = getEpoch();

	let shiftDown = $state(false);

	onMount(() => {
		const f = (ev: KeyboardEvent) => {
			shiftDown = ev.shiftKey;
		};
		window.addEventListener('keydown', f);
		window.addEventListener('keyup', f);
		return () => {
			window.removeEventListener('keydown', f);
			window.removeEventListener('keyup', f);
		};
	});

	async function save() {
		loading = true;
		try {
			await persistGallery(data.galleryPath, g);
			epoch.epoch += 1;
			overrides.reset();
		} finally {
			loading = false;
		}
	}
</script>

{#if isExtendsGallery(g)}
	<ExtendsEdit bind:value={g.$extends} allGalleries={data.allGalleryRelpaths} />
{:else}
	{#snippet addButton()}
		<div class="flex items-center">
			<div class="grow">
				<AddImageButton
					class="m-2"
					defaultArtist={data.config?.defaultArtist ?? null}
					existingIdentifiers={g?.pieces?.map((p) => p.slug) ?? []}
					galleryPath={{ gallery: data.galleryPath, piece: '' }}
					onUpload={(additionalPieces) => {
						for (const piece of additionalPieces) {
							overrides.setFromNew(
								{ gallery: data.galleryPath, piece: piece.piece.slug },
								piece.file
							);
						}
						g.pieces = [...g.pieces, ...additionalPieces.map((p) => p.piece)];
					}}
				/>
			</div>
			<div>
				<a
					href={resolve('/gallery/[...gallerypath]/bluesky', { gallerypath: data.galleryPath })}
					class="block grow cursor-pointer rounded-2xl border border-blue-400 p-4 text-left text-blue-600 select-none hover:bg-blue-100 active:bg-blue-200"
				>
					<i class="fa-brands fa-bluesky"></i>
					Import from Bluesky
				</a>
			</div>
		</div>
	{/snippet}

	{@render addButton()}

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
		{#each sorted as [piece, i] (piece.slug)}
			<Modal
				title={piece.name}
				subtitle={DateTime.fromJSDate(piece.date).toFormat('f')}
				class="m-2 rounded-2xl border"
			>
				{#snippet right()}
					<div class="h-16 max-h-16 w-16 max-w-16">
						<OriginalImage
							galleryPath={{ gallery: data.galleryPath, piece: piece.slug }}
							isVideo={!!piece.video}
						/>
					</div>
				{/snippet}
				{#snippet modalRight()}
					<div class="flex items-stretch gap-x-3 py-1">
						<div>
							<button
								onclick={(ev) => {
									if (!ev.shiftKey) return;

									g.pieces = [...g.pieces.slice(0, i), ...g.pieces.slice(i + 1)];

									save();
								}}
								class="w-40 rounded-2xl border p-3 text-center"
								class:hover:bg-gray-300={shiftDown}
								class:active:bg-gray-500={shiftDown}
								class:cursor-pointer={shiftDown}
								class:hover:font-bold={!shiftDown}
								class:cursor-not-allowed={!shiftDown}
								style="line-height: 1;"
							>
								<div>
									<i class="fa-solid fa-trash"></i>
									<span class="font-normal">Delete</span>
								</div>
								<div class="text-[8pt]">(requires shift-click)</div>
							</button>
						</div>
						<div>
							{#if !loading}
								<button
									onclick={() => void save()}
									class="h-full cursor-pointer rounded-2xl border p-3 hover:bg-gray-300 active:bg-gray-500"
								>
									<i class="fa-regular fa-save"></i>
									<span>Save</span>
								</button>
							{:else}
								<div class="h-full cursor-pointer rounded-2xl border p-3">Saving...</div>
							{/if}
							{#if error}
								<div class="h-full">ERROR: {error}</div>
							{/if}
						</div>
					</div>
				{/snippet}
				<div>
					<TextInput label="Name" bind:value={piece.name} />
					<ArtistEdit bind:artists={piece.artist} />
					<DateEdit bind:date={piece.date} />
					<TagEdit bind:value={piece.tags} possibleTags={data.allTags} prefix="#" />
					<CharactersEdit
						bind:characters={piece.characters}
						allCharacters={data.allCharacterRefs}
					/>
					<TextBox
						label="Description"
						bind:value={() => piece.description ?? '', (v) => void (piece.description = v)}
					/>
					<TextBox label="Alt Text" bind:value={piece.alt} />
					<ImageEdit
						bind:resource={g.pieces[i]}
						galleryPath={{ gallery: data.galleryPath, piece: piece.slug }}
					/>
					<div>
						<Collapsable title="Advanced" class="my-3">
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

							<PieceAltEdit
								bind:value={piece.alts}
								galleryPath={{ gallery: data.galleryPath, piece: piece.slug }}
							/>
							<Collapsable
								title="JSON"
								class="mt-2 overflow-scroll border-t border-gray-300 text-gray-400"
							>
								<pre class="text-gray-900">{JSON.stringify(piece, null, 4)}</pre>
							</Collapsable>
						</Collapsable>
					</div>
				</div>
			</Modal>
		{/each}
	</div>
	{@render addButton()}
{/if}
