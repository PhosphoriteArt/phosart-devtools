<script lang="ts" module>
	export async function persistGallery(
		galleryPath: string,
		gallery: RawGallery,
		invalidate = true
	) {
		try {
			await fetch(resolve('/api/gallery/[...gallerypath]/save', { gallerypath: galleryPath }), {
				method: 'POST',
				body: JSON.stringify(gallery),
				headers: { 'Content-Type': 'application/json' }
			});
		} finally {
			if (invalidate) {
				await invalidateAll();
			}
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
	import { copyPieces, createNewPiece, isBaseGallery, isExtendsGallery } from '$lib/galleryutil.js';
	import Modal from '$lib/Modal.svelte';
	import {
		normalizeArtist,
		normalizeCharacter,
		useArtistsContext,
		useCharacterContext,
		type BaseArtist,
		type BaseArtPiece,
		type CharacterRef,
		type RawGallery
	} from '@phosart/common/util';
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import { goto as go, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ActionButton from '$lib/ActionButton.svelte';
	import ScreenSentinel from '$lib/ScreenSentinel.svelte';
	import Checkbox from '$lib/form/Checkbox.svelte';
	import { truthy, uploadImage } from '$lib/util.js';
	import { cloneDeep } from 'es-toolkit';

	const { data } = $props();
	const rawGallery = $derived(data.galleries[data.galleryPath]);
	// svelte-ignore state_referenced_locally
	let g: RawGallery = $state(cloneDeep(rawGallery));

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
	let limit = $state(9);

	let bulkEnabled = $state(false);
	let bulkSelected: string[] = $state([]);
	let lastTouched: string | null = $state(null);
	let completingBulk = $state(false);

	interface BulkModsEls {
		artists: BaseArtist | BaseArtist[];
		characters: CharacterRef[];
		tags: string[];
	}
	interface BulkMods {
		add: BulkModsEls;
		remove: BulkModsEls;
		isDeindexed: boolean | null | undefined;
		isNsfw: boolean | null | undefined;
	}
	let bulkModifications: BulkMods = $state({
		add: { artists: [], characters: [], tags: [] },
		remove: { artists: [], characters: [], tags: [] },
		isDeindexed: null,
		isNsfw: null
	});

	function toggleBulkPiece(slug: string, set?: boolean) {
		if (set === undefined) {
			set = !bulkSelected.includes(slug);
		}
		if (set) {
			bulkSelected.push(slug);
		} else {
			bulkSelected = bulkSelected.filter((p) => p !== slug);
		}
		lastTouched = slug;
	}

	function enterBulk() {
		exitBulk();
		bulkEnabled = true;
	}

	function exitBulk() {
		bulkEnabled = false;
		bulkSelected = [];
		lastTouched = null;
		completingBulk = false;
		copyPath = '';
		bulkModifications = {
			add: { artists: [], characters: [], tags: [] },
			isDeindexed: null,
			isNsfw: null,
			remove: { artists: [], characters: [], tags: [] }
		};
	}

	function startCompleteBulk() {
		completingBulk = true;
	}
	function completeBulk() {
		const gallery = g;
		if (!isBaseGallery(gallery)) {
			exitBulk();
			return;
		}
		const affectedPieces = bulkSelected
			.map((p) => gallery.pieces.find((gp) => gp.slug === p))
			.filter((v): v is BaseArtPiece => !!v);

		for (const piece of affectedPieces) {
			if (typeof bulkModifications.isDeindexed === 'boolean') {
				piece.deindexed = bulkModifications.isDeindexed || undefined;
			}
			if (typeof bulkModifications.isNsfw === 'boolean') {
				piece.nsfw = bulkModifications.isNsfw || undefined;
			}
			if (!piece.artist) {
				piece.artist = [];
			}
			if (!Array.isArray(piece.artist)) {
				piece.artist = [piece.artist];
			}
			const curra = normalizeArtist(piece.artist);
			for (const aa of normalizeArtist(bulkModifications.add.artists)) {
				if (!curra.find((ca) => ca.name === aa.name)) {
					piece.artist.push(aa.name);
				}
			}

			const currc = normalizeCharacter(piece.characters);
			for (const ac of bulkModifications.add.characters) {
				const nac = normalizeCharacter(ac);
				if (
					!currc.find(
						(cc) => cc.name === nac.name && (cc.from === nac.from || (!cc.from && nac.from))
					)
				) {
					piece.characters.push(ac);
				}
			}
			for (const at of bulkModifications.add.tags) {
				if (!piece.tags.includes(at)) {
					piece.tags.push(at);
				}
			}

			for (const ra of normalizeArtist(bulkModifications.remove.artists)) {
				piece.artist = (piece.artist as BaseArtist[]).filter(
					(ca) => normalizeArtist(ca)[0].name !== ra.name
				);
			}
			for (const rc of bulkModifications.remove.characters) {
				const nrc = normalizeCharacter(rc);
				piece.characters = piece.characters.filter(
					(cc) =>
						normalizeCharacter(cc).name !== nrc.name || normalizeCharacter(cc).from !== nrc.from
				);
			}
			for (const rt of bulkModifications.remove.tags) {
				piece.tags = piece.tags.filter((ct) => ct !== rt);
			}
		}

		save().then(() => {
			exitBulk();
		});
	}

	function extendLimit() {
		limit += 9;
	}

	onMount(() => {
		const f = (ev: KeyboardEvent) => {
			shiftDown = ev.shiftKey;
		};
		const cf = (ev: ClipboardEvent) => {
			if (!isBaseGallery(g)) return;

			for (const item of ev.clipboardData?.items ?? []) {
				const f = item.getAsFile();
				if (f?.type?.startsWith('image/')) {
					(async () => {
						const { filename: fpath } = await uploadImage(
							{ gallery: data.galleryPath, piece: '' },
							f,
							f.name || ''
						);
						if (!fpath) {
							return null;
						}

						const piece = createNewPiece(
							f,
							fpath,
							g.pieces.length,
							g.pieces.map((p) => p.slug)
						);
						if (data.config.defaultArtist) {
							piece.artist = data.config.defaultArtist;
						}

						g.pieces.push(piece);
						await save();
					})();

					break;
				}
			}
		};
		window.addEventListener('keydown', f);
		window.addEventListener('keyup', f);
		window.addEventListener('paste', cf);
		return () => {
			window.removeEventListener('keydown', f);
			window.removeEventListener('keyup', f);
			window.removeEventListener('paste', cf);
		};
	});

	async function save() {
		loading = true;
		try {
			await persistGallery(data.galleryPath, g, /* invalidate = */ false);
			epoch.epoch += 1;
			overrides.reset();
			await invalidateAll();
			g = rawGallery;
		} finally {
			loading = false;
		}
	}

	let selectedPieceData: [piece: BaseArtPiece, origIndex: number, sortedIndex: number] | null =
		$state(null);

	let copyPath = $state('');
</script>

<svelte:head>
	<title>{data.galleryPath} | Art Site Editor</title>
</svelte:head>

{#if isExtendsGallery(g)}
	<div class="flex flex-col">
		<ExtendsEdit bind:value={g.$extends} allGalleries={data.allGalleryRelpaths} />
		<ActionButton action={save}>Save</ActionButton>
	</div>
{:else}
	{#snippet addButton()}
		<div class="m-2 flex items-center gap-x-2">
			<div class="flex grow">
				{#if bulkEnabled}
					<button
						onclick={() => {
							startCompleteBulk();
						}}
						class="block grow cursor-pointer rounded-2xl border border-black p-4 text-left select-none hover:bg-gray-100 active:bg-gray-200"
					>
						<i class="fa-solid fa-circle-chevron-right"></i>
						Complete Bulk
					</button>
				{:else}
					<AddImageButton
						title="Drag (or paste) an image to add it"
						defaultArtist={data.config?.defaultArtist ?? null}
						existingIdentifiers={isBaseGallery(g) ? (g?.pieces?.map((p) => p.slug) ?? []) : []}
						galleryPath={{ gallery: data.galleryPath, piece: '' }}
						onUpload={(additionalPieces) => {
							if (!isBaseGallery(g)) return;

							for (const piece of additionalPieces) {
								overrides.setFromNew(
									{ gallery: data.galleryPath, piece: piece.piece.slug },
									piece.file
								);
							}
							g.pieces = [...g.pieces, ...additionalPieces.map((p) => p.piece)];

							save();
						}}
					/>
				{/if}
			</div>
			<div>
				<button
					onclick={() => {
						if (bulkEnabled) {
							exitBulk();
						} else {
							enterBulk();
						}
					}}
					class="block grow cursor-pointer rounded-2xl border {bulkEnabled
						? 'border-red-400'
						: 'border-gray-400'} p-4 text-left text-gray-600 select-none hover:bg-gray-100 active:bg-gray-200"
				>
					<i class={bulkEnabled ? 'fa-solid fa-circle-xmark' : 'fa-regular fa-square-check'}></i>
					{#if bulkEnabled}
						Cancel Bulk
					{:else}
						Bulk Edit
					{/if}
				</button>
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
		{#each sorted.slice(0, limit) as [piece, i], sortedIndex (piece.slug)}
			<div class="flex items-center">
				{#if bulkEnabled}
					<Checkbox
						label=""
						bind:checked={
							() => bulkSelected.includes(piece.slug),
							(v) => {
								toggleBulkPiece(piece.slug, v);
							}
						}
					/>
				{/if}

				<Modal
					overrideOnClick={bulkEnabled
						? (ev) => {
								if (ev.shiftKey) {
									const lastIndex = sorted.findIndex(([p]) => p.slug === lastTouched);
									const i1 = Math.min(lastIndex, sortedIndex);
									const i2 = Math.max(lastIndex, sortedIndex);

									if (i1 >= 0 && i2 >= 0) {
										let isSet = bulkSelected.includes(piece.slug);
										for (let setIndex = i1; setIndex <= i2; setIndex++) {
											toggleBulkPiece(sorted[setIndex][0].slug, !isSet);
										}
									}
								} else {
									toggleBulkPiece(piece.slug);
								}
							}
						: () => {
								selectedPieceData = [piece, i, sortedIndex];
							}}
					title={piece.name}
					subtitle={DateTime.fromJSDate(piece.date).toFormat('f')}
					class="m-2 grow rounded-2xl border {piece.deindexed ? 'bg-gray-200' : ''} {piece.nsfw
						? 'outline-2 outline-amber-600'
						: ''}"
				>
					{#snippet right()}
						<div class="h-16 max-h-16 w-16 max-w-16">
							<OriginalImage
								galleryPath={{ gallery: data.galleryPath, piece: piece.slug }}
								isVideo={!!piece.video}
								class={piece.nsfw
									? 'duration-300ms blur-sm transition-[filter] hover:blur-none hover:duration-[3s]'
									: ''}
							/>
						</div>
					{/snippet}
				</Modal>
			</div>
		{/each}
	</div>
	<ScreenSentinel onObservable={extendLimit} tickMs={150} />
	{#if g?.pieces.length > 0}
		{@render addButton()}
	{/if}
	<div class="flex justify-stretch pl-2">
		<Collapsable title="Advanced" class="w-full">
			<ActionButton
				disabled={!shiftDown}
				class="{shiftDown
					? 'border-red-500 text-red-800 hover:bg-red-200'
					: 'cursor-not-allowed font-bold'} w-full text-center "
				action={async () => {
					await fetch(
						resolve('/api/gallery/[...gallerypath]/save', { gallerypath: data.galleryPath }),
						{ method: 'DELETE' }
					);
					await go(resolve('/'));
					await invalidateAll();
				}}
			>
				<div class="font-normal">
					<i class="fa-solid fa-trash"></i>
					Delete Gallery
				</div>
				<div class="text-[8pt]">(requires shift-click)</div>
			</ActionButton>
			<Collapsable
				title="JSON"
				class="mt-2 no-scrollbar overflow-scroll border-t border-gray-300 text-gray-400"
			>
				<pre class="text-gray-900">{JSON.stringify(g, null, 4)}</pre>
			</Collapsable>
		</Collapsable>
	</div>
{/if}

{#if isBaseGallery(g) && limit < g?.pieces.length}
	<div class="h-screen"></div>
{/if}

<Modal headless title="Complete Bulk" bind:open={completingBulk}>
	<div>
		Editing {bulkSelected.length} entries:
	</div>

	<div class="flex items-stretch">
		<div class="flex w-20 items-center">Add:</div>
		<div class="m-4 w-2 border border-r-0"></div>
		<div class="flex flex-col">
			<ArtistEdit bind:artists={bulkModifications.add.artists} />
			<TagEdit bind:value={bulkModifications.add.tags} possibleTags={data.allTags} prefix="#" />
			<CharactersEdit
				bind:characters={bulkModifications.add.characters}
				allCharacters={data.allCharacterRefs}
			/>
		</div>
	</div>

	<div class="m-2 w-full border-t border-dashed border-gray-300"></div>

	<div class="flex items-stretch">
		<div class="flex w-20 items-center">Remove:</div>
		<div class="m-4 w-2 border border-r-0"></div>
		<div class="flex flex-col">
			<ArtistEdit bind:artists={bulkModifications.remove.artists} />
			<TagEdit bind:value={bulkModifications.remove.tags} possibleTags={data.allTags} prefix="#" />
			<CharactersEdit
				bind:characters={bulkModifications.remove.characters}
				allCharacters={data.allCharacterRefs}
			/>
		</div>
	</div>

	<div class="m-2 w-full border-t border-dashed border-gray-300"></div>

	<Collapsable title="Advanced">
		<OptionalInput label="Set?" bind:value={bulkModifications.isDeindexed} empty={false}>
			{#snippet control(v)}
				<Checkbox
					label="Deindexed?"
					right
					bind:checked={() => v, (v) => (bulkModifications.isDeindexed = v)}
				/>
			{/snippet}
		</OptionalInput>
		<div class="my-4"></div>
		<OptionalInput label="Set?" bind:value={bulkModifications.isNsfw} empty={false}>
			{#snippet control(v)}
				<Checkbox
					label="NSFW?"
					right
					bind:checked={() => v, (v) => (bulkModifications.isNsfw = v)}
				/>
			{/snippet}
		</OptionalInput>
		<div class="my-4"></div>

		<div class="flex gap-x-3">
			<TextInput
				label="Copy To..."
				bind:value={copyPath}
				options={Object.keys(data.galleries).filter((k) => isBaseGallery(data.galleries[k]))}
				noReportValidation
				validationError={copyPath !== '' && !data.galleries[copyPath]
					? 'Select a valid path'
					: undefined}
			/>

			<ActionButton
				disabled={!data.galleries[copyPath] || !isBaseGallery(g)}
				action={async () => {
					const target = data.galleries[copyPath];
					const src = g;
					if (!isBaseGallery(src) || !target || !isBaseGallery(target)) return;

					const newPieces = await copyPieces(
						bulkSelected
							.map((k) => {
								return src.pieces.find((g) => g.slug === k);
							})
							.filter(truthy),
						data.galleryPath,
						copyPath
					);
					target.pieces = [...target.pieces, ...newPieces];
					await fetch(resolve('/api/gallery/[...gallerypath]/save', { gallerypath: copyPath }), {
						method: 'POST',
						body: JSON.stringify(target),
						headers: { 'Content-Type': 'application/json' }
					});

					copyPath = '';
				}}
			>
				{#snippet loadingContent()}
					Copying...
				{/snippet}
				Copy
			</ActionButton>
		</div>
	</Collapsable>

	{#snippet modalRight()}
		<div class="flex items-stretch gap-x-3 py-1">
			<div>
				{#if !loading}
					<button
						onclick={completeBulk}
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
</Modal>

{#if selectedPieceData && isBaseGallery(g)}
	{@const [piece, i] = selectedPieceData}
	<Modal
		headless
		bind:open={
			() => true,
			(v) => {
				if (!v) {
					selectedPieceData = null;
					copyPath = '';
				}
			}
		}
		title={piece.name}
	>
		{#snippet modalRight()}
			<div class="flex items-stretch gap-x-3 py-1">
				<div>
					<button
						onclick={(ev) => {
							if (!ev.shiftKey || !isBaseGallery(g)) return;

							g.pieces = [...g.pieces.slice(0, i), ...g.pieces.slice(i + 1)];

							save();

							selectedPieceData = null;
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
			<CharactersEdit bind:characters={piece.characters} allCharacters={data.allCharacterRefs} />
			<TextBox
				label="Description"
				bind:value={() => piece.description ?? '', (v) => void (piece.description = v)}
			/>
			<TextBox label="Alt Text" bind:value={piece.alt} />
			<ImageEdit
				bind:resource={g.pieces[i]}
				galleryPath={{ gallery: data.galleryPath, piece: piece.slug }}
				class={piece.nsfw
					? 'duration-300ms blur-lg transition-[filter] hover:blur-none hover:duration-[3s]'
					: ''}
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

					<div class="mt-4"></div>

					<Checkbox
						label="NSFW?"
						bind:checked={() => !!piece.nsfw, (v) => void (piece.nsfw = v || undefined)}
					/>

					<div class="mt-4"></div>

					<Checkbox
						label="Deindexed?"
						bind:checked={() => !!piece.deindexed, (v) => void (piece.deindexed = v || undefined)}
					/>

					<div class="mt-4"></div>

					<div class="flex gap-x-3">
						<TextInput
							label="Copy To..."
							bind:value={copyPath}
							options={Object.keys(data.galleries).filter((k) => isBaseGallery(data.galleries[k]))}
							noReportValidation
							validationError={copyPath !== '' && !data.galleries[copyPath]
								? 'Select a valid path'
								: undefined}
						/>

						<ActionButton
							disabled={!data.galleries[copyPath] || !isBaseGallery(g)}
							action={async () => {
								const target = data.galleries[copyPath];
								if (!target || !isBaseGallery(target)) return;

								const newPieces = await copyPieces([piece], data.galleryPath, copyPath);
								target.pieces = [...target.pieces, ...newPieces];
								await fetch(
									resolve('/api/gallery/[...gallerypath]/save', { gallerypath: copyPath }),
									{
										method: 'POST',
										body: JSON.stringify(target),
										headers: { 'Content-Type': 'application/json' }
									}
								);

								copyPath = '';
							}}
						>
							{#snippet loadingContent()}
								Copying...
							{/snippet}
							Copy
						</ActionButton>
					</div>

					<div class="mt-4"></div>

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
{/if}
