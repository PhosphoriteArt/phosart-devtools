<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Collapsable from '$lib/Collapsable.svelte';
	import { getEpoch } from '$lib/epoch.svelte.js';
	import ImageEdit from '$lib/form/ImageEdit.svelte';
	import OriginalImage from '$lib/form/OriginalImage.svelte';
	import SearchInput from '$lib/form/search/SearchInput.svelte';
	import TextBox from '$lib/form/TextBox.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte.js';
	import Modal from '$lib/Modal.svelte';
	import { markdown, type BaseCharacter } from '@phosart/common/util';
	import { onMount } from 'svelte';
	import fz from 'fuzzysort';
	import Layout from '$lib/Layout.svelte';
	import {
		ChevronDown,
		ChevronUp,
		CirclePlus,
		ImageIcon,
		ImageOff,
		Pencil,
		SaveIcon,
		TrashIcon
	} from '@lucide/svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import AddImageButton from '$lib/AddImageButton.svelte';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	let characters = $state(Object.values(data.characters));
	// svelte-ignore state_referenced_locally
	let originalNames = $state(new WeakMap(Object.values(characters).map((ch) => [ch, ch.name])));

	let shiftDown = $state(false);
	let loading = $state(false);
	let error: string | null = $state(null);

	let newCharacterName = $state('');

	let fullViewStored = $state<boolean | null>(null);
	const fullView = $derived(fullViewStored ?? true);

	const overrides = getOverrides();
	const epoch = getEpoch();

	$effect(() => {
		if (fullViewStored === false) {
			window.localStorage.setItem('is-character-view-partial', 'true');
		} else if (fullViewStored === true) {
			window.localStorage.removeItem('is-character-view-partial');
		}
	});

	onMount(() => {
		if (window.localStorage.getItem('is-character-view-partial')) {
			fullViewStored = false;
		}

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
			await fetch(resolve('/api/characters/save'), {
				method: 'POST',
				body: JSON.stringify(characters),
				headers: { 'Content-Type': 'application/json' }
			});
			epoch.epoch += 1;
			overrides.reset();
			originalNames = new WeakMap(Object.values(characters).map((ch) => [ch, ch.name]));
		} finally {
			loading = false;
			invalidateAll();
		}
	}

	const id = $props.id();
	let search = $state('');
	let selectedCharacter: [BaseCharacter, number] | null = $state(null);

	const filteredCharacters = $derived.by(() => {
		if (!search) {
			return characters.map((ch, i) => [ch, i] as const);
		}
		return fz
			.go(search, characters, {
				keys: ['name', 'short_description', 'description']
			})
			.map((character) => {
				const i = characters.findIndex((v) => v.name === character.obj.name);
				return [character.obj, i] as const;
			});
	});
</script>

<svelte:head>
	<title>Character Editor | Art Site Editor</title>
</svelte:head>

<Layout title="Characters">
	{#snippet navRight()}
		<div class="flex items-center gap-2">
			<div class="my-4 flex w-64 grow items-center gap-x-2 pr-4">
				<label for="{id}-search-box">
					<i class="fa-solid fa-search"></i>
				</label>
				<div class="relative flex grow overflow-visible">
					<SearchInput
						id="{id}-search-box"
						autoFocus
						bind:search
						class="input h-8 w-0 grow"
						noReportValidation
						acceptSuggestionOnEnter
						options={data.characters}
						onSelect={(_s, ch) => {
							if (ch) {
								const i = characters.findIndex((v) => v.name === ch.name);
								selectedCharacter = [ch, i];
							}
						}}
					/>
				</div>
			</div>
			<div class="btn-group preset-outlined-surface-200-800">
				<Tooltip tooltip="hide character portraits" placement="bottom">
					{#snippet children(attach)}
						<button
							{@attach attach}
							class="btn-icon btn"
							class:preset-filled={!fullView}
							onclick={() => void (fullViewStored = false)}
						>
							<ImageOff />
						</button>
					{/snippet}
				</Tooltip>
				<Tooltip tooltip="show character portraits" placement="bottom">
					{#snippet children(attach)}
						<button
							{@attach attach}
							class="btn-icon btn"
							class:preset-filled={fullView}
							onclick={() => void (fullViewStored = true)}
						>
							<ImageIcon />
						</button>
					{/snippet}
				</Tooltip>
			</div>
		</div>
	{/snippet}

	<div class="absolute right-3 bottom-2 z-10">
		<Modal
			title="New Character"
			class="preset-filled-primary-50-950"
			onClose={() => void (newCharacterName = '')}
		>
			{#snippet icon()}
				<CirclePlus size="8pt" />
			{/snippet}
			{#snippet children(close)}
				<div class="m-4 min-w-100">
					<TextInput bind:value={newCharacterName} label="Character name" />

					{#if !newCharacterName}
						<div class="text-center text-warning-500">Character name required</div>
					{:else if characters.find((ch) => ch.name === newCharacterName)}
						<div class="text-center text-warning-500">
							A character already exists with that name
						</div>
					{:else}
						<AddImageButton
							title={`Drag a character image here to add ${newCharacterName}!`}
							class="m-2"
							galleryPath={{ character: '', for: 'full' }}
							existingIdentifiers={[]}
							onUpload={(additionalPieces) => {
								characters = [
									...additionalPieces.map(
										(p, i) =>
											({
												description: '',
												index: characters.length + i,
												name: i === 0 ? newCharacterName : p.file.name,
												picture: {
													alt: '',
													image: p.piece.image
												},
												pronouns: '',
												type: 'Character',
												short_description: undefined,
												thumbnail: undefined
											}) satisfies (typeof characters)[number]
									),
									...characters
								];

								save();
								close();
							}}
						/>
						<div class="mx-5 mb-8 flex max-w-100 flex-row items-center">
							<i class="fa-solid fa-info-circle mr-2 text-blue-300"></i>
							<div class="text-surface-contrast-300-700 italic">
								Note that this image will represent the character on the Character page, but is not
								added to any gallery!
							</div>
						</div>
					{/if}
				</div>
			{/snippet}
		</Modal>
	</div>

	<div class="flex flex-col overflow-hidden text-surface-contrast-50-950">
		{#each filteredCharacters as [character, i] (`${i}-${characters.length}`)}
			{@const originalName = originalNames.get(character) ?? character.name}

			<div class="my-8 flex">
				{#if fullView}
					<div class="mr-2 h-128 w-128 shrink-0 max-xl:h-64 max-xl:w-64">
						<OriginalImage
							galleryPath={{
								character: originalName,
								for: 'full'
							}}
						/>
					</div>
				{/if}
				<div class="flex grow flex-col items-stretch">
					<div class="flex items-center gap-3 border-b border-surface-600-400 pb-3">
						<div
							class="mr-4 flex h-24 min-h-24 w-24 min-w-24 items-center justify-center overflow-hidden rounded-full border border-surface-600-400 max-xl:h-16 max-xl:min-h-16 max-xl:w-16 max-xl:min-w-16"
						>
							{#if character.thumbnail || !fullView}
								<OriginalImage
									class="object-cover object-center"
									galleryPath={{
										character: originalName,
										for: fullView ? 'thumb' : character.thumbnail ? 'thumb' : 'full'
									}}
								/>
							{:else}
								<ImageOff />
							{/if}
						</div>
						<div class="pb-2 text-6xl font-extralight max-xl:text-3xl">
							{character.name}
						</div>
						<div
							class="px-2 pb-2 text-6xl font-extralight max-xl:text-3xl"
							style="transform: scaleX(0.1);"
						>
							|
						</div>
						<div class="pt-3 pb-2 text-xl font-light text-surface-800-200">
							{character.pronouns}
						</div>
						<div class="grow"></div>
						<div class="flex flex-col justify-around gap-2">
							{#if i > 0}
								<button
									title="move up"
									class="btn-icon preset-tonal"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										characters = [
											...characters.slice(0, i - 1),
											character,
											characters[i - 1],
											...characters.slice(i + 1)
										];
										save();
									}}
								>
									<ChevronUp />
								</button>
							{/if}
							{#if i < characters.length - 1}
								<button
									title="move down"
									class="btn-icon preset-tonal"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										characters = [
											...characters.slice(0, i),
											characters[i + 1],
											character,
											...characters.slice(i + 2)
										];
										save();
									}}
								>
									<ChevronDown />
								</button>
							{/if}
						</div>
						<div>
							<button
								class="btn preset-filled-primary-200-800"
								onclick={() => void (selectedCharacter = [character, i])}
							>
								<Pencil />
								Edit
							</button>
						</div>
					</div>
					{#if character.short_description}
						<div
							class="mx-3 mt-3 border-l-3 border-l-primary-200-800 pl-3 text-xl font-extralight italic max-xl:text-lg"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html markdown(character.short_description)}
						</div>
					{/if}
					<div class="mx-3 mt-3 max-h-80 min-w-0 shrink overflow-x-auto overflow-y-scroll">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html markdown(character.description)}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if selectedCharacter}
		{@const [character, i] = selectedCharacter}
		{@const originalName = originalNames.get(character) ?? character.name}
		<Modal
			headless
			title="Edit {character.name}"
			bind:open={
				() => true,
				(v) => {
					if (!v) {
						selectedCharacter = null;
						search = '';
					}
				}
			}
		>
			{#snippet modalRight(close)}
				<div class="flex items-center gap-x-3 py-1 pr-4">
					<div>
						<button
							onclick={(ev) => {
								if (!ev.shiftKey) return;
								characters = [...characters.slice(0, i), ...characters.slice(i + 1)];

								save();
								close();
							}}
							class="btn flex flex-col items-center preset-filled-error-50-950 p-3"
							disabled={!shiftDown}
							class:cursor-pointer={shiftDown}
							class:cursor-not-allowed={!shiftDown}
							style="line-height: 1;"
						>
							<div class="flex items-center">
								<TrashIcon size={16} />
								<span class="font-normal">Delete</span>
							</div>
							<div class="text-[8pt]">(requires shift-click)</div>
						</button>
					</div>
					<div>
						{#if !loading}
							<button onclick={() => void save()} class="btn preset-filled-primary-50-950 p-3">
								<SaveIcon size={16} />
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
			<div class="min-h-[75vh] min-w-[50vw] p-3">
				<div class="grid grid-cols-2 grid-rows-1">
					<div>
						<TextInput label="Name" bind:value={character.name} />
						<TextInput label="Pronouns" bind:value={character.pronouns} />
						<TextBox
							label="Tagline / Short Description"
							bind:value={
								() => character.short_description ?? '', (v) => (character.short_description = v)
							}
						/>

						<TextBox label="Description" big bind:value={character.description} />
					</div>
					<div class="flex flex-col items-center">
						<div>
							<ImageEdit
								galleryPath={{ character: originalName, for: 'full' }}
								bind:resource={character.picture}
								bind:alt={character.picture.alt}
								alts={null}
								isComic={null}
								isDeindexed={null}
								isNsfw={null}
							/>
						</div>

						<div>
							{#if character.thumbnail}
								<div class="flex flex-col items-center">
									<ImageEdit
										galleryPath={{ character: originalName, for: 'thumb' }}
										alts={null}
										isComic={null}
										isDeindexed={null}
										isNsfw={null}
										bind:resource={character.thumbnail}
										bind:alt={character.thumbnail.alt}
									/>
									<button
										onclick={(ev) => {
											if (!ev.shiftKey) return;
											character.thumbnail = undefined;

											save();
										}}
										class="mb-2 btn flex items-center preset-filled-warning-50-950 py-2"
										disabled={!shiftDown}
										class:cursor-pointer={shiftDown}
										class:cursor-not-allowed={!shiftDown}
										style="line-height: 1;"
									>
										<div class="flex items-center">
											<TrashIcon size={16} />
											<span class="font-normal">Remove Thumbnail</span>
										</div>
										<div class="text-[8pt]">(requires shift-click)</div>
									</button>
								</div>
							{:else}
								<AddImageButton
									title="Drag an image to add a character thumbnail"
									class="m-2"
									galleryPath={{ character: character.name, for: 'thumb' }}
									existingIdentifiers={[]}
									onUpload={(additionalPieces) => {
										character.thumbnail = additionalPieces[0].piece;

										save();
									}}
								/>
							{/if}
						</div>
					</div>
				</div>

				<div>
					<Collapsable title="Advanced" class="my-3">
						<Collapsable
							title="JSON"
							initial={false}
							class="mt-2 no-scrollbar overflow-scroll border-t"
						>
							<pre>{JSON.stringify(character, null, 4)}</pre>
						</Collapsable>
					</Collapsable>
				</div>
			</div>
		</Modal>
	{/if}
</Layout>
