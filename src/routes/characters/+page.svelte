<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AddImageButton from '$lib/AddImageButton.svelte';
	import Collapsable from '$lib/Collapsable.svelte';
	import { getEpoch } from '$lib/epoch.svelte.js';
	import ImageEdit from '$lib/form/ImageEdit.svelte';
	import OptionalInput from '$lib/form/OptionalInput.svelte';
	import OriginalImage from '$lib/form/OriginalImage.svelte';
	import TextBox from '$lib/form/TextBox.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import { getOverrides } from '$lib/galleryoverride.svelte.js';
	import Modal from '$lib/Modal.svelte';
	import { onMount } from 'svelte';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	let characters = $state(Object.values(data.characters));

	let shiftDown = $state(false);
	let loading = $state(false);
	let error: string | null = $state(null);

	const overrides = getOverrides();
	const epoch = getEpoch();

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
			await fetch(resolve('/api/characters/save'), {
				method: 'POST',
				body: JSON.stringify(characters),
				headers: { 'Content-Type': 'application/json' }
			});
			epoch.epoch += 1;
			overrides.reset();
		} finally {
			loading = false;
			invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>Character Editor | Art Site Editor</title>
</svelte:head>

{#snippet addButton()}
	<AddImageButton
		title="Drag an image to add a character"
		class="m-2"
		galleryPath={{ character: '', for: 'full' }}
		existingIdentifiers={[]}
		onUpload={(additionalPieces) => {
			characters = [
				...characters,
				...additionalPieces.map(
					(p, i) =>
						({
							description: '',
							index: characters.length + i,
							name: p.piece.name,
							picture: {
								alt: '',
								image: p.piece.image
							},
							pronouns: '',
							type: 'Character',
							short_description: undefined,
							thumbnail: undefined
						}) satisfies (typeof characters)[number]
				)
			];

			save();
		}}
	/>
{/snippet}

{@render addButton()}

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
	{#each characters as character, i (`${i}-${characters.length}`)}
		<Modal title={character.name} class="m-2 rounded-2xl border">
			{#snippet right()}
				<div class="flex items-center">
					<div class="h-16 max-h-16 w-16 max-w-16">
						<OriginalImage
							galleryPath={{
								character: character.name,
								for: character.thumbnail ? 'thumb' : 'full'
							}}
						/>
					</div>
					<div class="flex flex-col justify-around" data-blockhover>
						{#if i > 0}
							<button
								title="move up"
								class="py-2 hover:bg-gray-200 active:bg-gray-400"
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
								}}><i class="fa-solid fa-chevron-left"></i></button
							>
						{/if}
						{#if i < characters.length - 1}
							<button
								title="move down"
								class="py-2 hover:bg-gray-200 active:bg-gray-400"
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
								}}><i class="fa-solid fa-chevron-right"></i></button
							>
						{/if}
					</div>
				</div>
			{/snippet}
			{#snippet modalRight()}
				<div class="flex items-stretch gap-x-3 py-1">
					<div>
						<button
							onclick={(ev) => {
								if (!ev.shiftKey) return;
								characters = [...characters.slice(0, i), ...characters.slice(i + 1)];

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
				<TextInput label="Name" bind:value={character.name} />
				<TextInput label="Pronouns" bind:value={character.pronouns} />
				<TextBox label="Description" big bind:value={character.description} />
				<OptionalInput bind:value={character.short_description} empty="">
					{#snippet control(enabled, value)}
						<TextInput
							label="Short Desc"
							disabled={!enabled}
							bind:value={() => value, (v) => (character.short_description = v)}
						/>
					{/snippet}
				</OptionalInput>
				<ImageEdit
					galleryPath={{ character: character.name, for: 'full' }}
					bind:resource={character.picture}
				/>
				<TextBox label="Alt Text" bind:value={character.picture.alt} />
				<OptionalInput bind:value={character.thumbnail} empty={character.picture}>
					{#snippet control(enabled, value)}
						<div>
							<div>
								<ImageEdit
									disabled={!enabled}
									label="Thumbnail"
									galleryPath={{ character: character.name, for: enabled ? 'thumb' : 'full' }}
									bind:resource={() => value, (v) => (character.thumbnail = v)}
								/>
							</div>
							<div>
								<TextBox
									label="Thumb Alt Text"
									disabled={!enabled}
									bind:value={
										() => value.alt,
										(v) => {
											if (character.thumbnail) {
												character.thumbnail.alt = v;
											}
										}
									}
								/>
							</div>
						</div>
					{/snippet}
				</OptionalInput>
				<div>
					<Collapsable title="Advanced" class="my-3">
						<Collapsable
							title="JSON"
							initial={false}
							class="mt-2 no-scrollbar overflow-scroll border-t border-gray-300 text-gray-400"
						>
							<pre class="text-gray-900">{JSON.stringify(character, null, 4)}</pre>
						</Collapsable>
					</Collapsable>
				</div>
			</div>
		</Modal>
	{/each}
</div>
{#if characters.length > 0}
	{@render addButton()}
{/if}
