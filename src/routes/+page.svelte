<script lang="ts">
	import FileTree from '$lib/tree/FileTree.svelte';
	import TreeButton from '$lib/tree/TreeButton.svelte';
	import { goto as go, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Collapsable from '$lib/Collapsable.svelte';
	import type { File } from '$lib/structure.js';
	import Checkbox from '$lib/form/Checkbox.svelte';
	import Modal from '$lib/Modal.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import ActionButton from '$lib/ActionButton.svelte';
	import { asRecord, type BaseArtPiece, type RawGallery } from '@phosart/common/util';
	import { browser } from '$app/environment';
	import SearchInput from '$lib/form/search/SearchInput.svelte';
	import { copyPieces, isBaseGallery } from '$lib/galleryutil.js';

	const { data } = $props();

	let showEmpty = $state(false);
	let newName = $state('');
	let isExtendedGallery = $state(false);

	$effect(() => {
		if (data.redirectGallery && browser && window.location.hash !== '#stay') {
			go(resolve(`/gallery/${data.redirectGallery}`));
		}
	});

	const id = $props.id();
	let search = $state('');
	let copyPath = $state('');
</script>

<svelte:head>
	<title>Art Site Editor</title>
</svelte:head>

<div class="my-4">
	<Checkbox bind:checked={showEmpty} label="Show empty folders" right />
</div>

<div class="my-4 flex gap-x-2 rounded-2xl border border-dashed p-2">
	<label for="{id}-search-box">
		<i class="fa-solid fa-search"></i>
	</label>
	<div class="relative flex grow">
		<SearchInput
			id="{id}-search-box"
			autoFocus
			bind:search
			class="grow"
			noReportValidation
			acceptSuggestionOnEnter
			validationError={search !== '' && !data.galleryPaths.includes(search)
				? 'invalid path'
				: undefined}
			options={asRecord(data.galleryPaths, (p) => p)}
			onSelect={(s) => {
				if (data.galleryPaths.includes(s)) {
					go(resolve('/gallery/[...gallerypath]', { gallerypath: s }));
				}
			}}
		/>
	</div>
</div>

{#snippet file(fileName: string, file: File, path: string[])}
	{@const base = file.$type === 'gallery' ? 'gallery' : file.$type === 'artist' ? 'artists' : null}
	{@const icon =
		file.$type === 'gallery' && file.isBase
			? 'images'
			: file.$type === 'gallery' && !file.isBase
				? 'anchor'
				: file.$type === 'artist'
					? 'palette'
					: undefined}
	<TreeButton
		{icon}
		onclick={() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			go(resolve(`/${base}/${path.join('/') + '/' + fileName}` as any));
		}}>{fileName}</TreeButton
	>
{/snippet}

{#snippet folder(folderName: string, path: string[])}
	<Collapsable
		title={folderName}
		class="my-1"
		openIcon="fa-folder-open"
		closedIcon="fa-folder"
		iconFamily="regular"
	>
		{@render controls([...path, folderName])}
		<FileTree {showEmpty} structure={data.tree} {folder} {file} path={[...path, folderName]} />
	</Collapsable>
{/snippet}

{#snippet controls(path: string[])}
	<div class="mb-4 flex gap-x-1">
		<Modal
			title=""
			tooltip="New Folder"
			icon="fa-solid fa-folder-plus"
			onClose={() => void (newName = '')}
			hideHeader
		>
			{#snippet children(close)}
				<div class="m-2 border-b p-3 font-bold">New Folder</div>
				<div>
					<TextInput bind:value={newName} label="Folder name" />
					<ActionButton
						disabled={!newName}
						action={async () => {
							await fetch(
								resolve('/api/folder/[...folderpath]', {
									folderpath: [...path, newName].join('/')
								}),
								{ method: 'PATCH' }
							);
							await invalidateAll();
							showEmpty = true;
							close();
						}}>Create</ActionButton
					>
				</div>
			{/snippet}
		</Modal>
		<Modal
			tooltip="New Gallery"
			title=""
			icon="fa-regular fa-images"
			onClose={() => {
				newName = '';
				isExtendedGallery = false;
			}}
			hideHeader
		>
			{#snippet children(close)}
				<div class="m-2 border-b p-3 font-bold">New Gallery</div>
				<div>
					<TextInput bind:value={newName} label="Gallery Name" />
					<ActionButton
						disabled={!newName}
						action={async () => {
							const target = [...path, newName + '.gallery'].join('/');
							let pieces: BaseArtPiece[] = [];
							const copied = data.galleries[copyPath];
							if (!isExtendedGallery && copied && isBaseGallery(copied)) {
								pieces = await copyPieces(copied.pieces, copyPath, target);
							}

							await fetch(
								resolve('/api/gallery/[...gallerypath]/save', {
									gallerypath: target
								}),
								{
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify(
										(isExtendedGallery ? { $extends: [] } : { pieces: pieces }) satisfies RawGallery
									)
								}
							);
							await invalidateAll();
							close();
						}}>Create</ActionButton
					>

					<Collapsable title="Advanced" class="mt-4">
						<Checkbox label="Is extended gallery" bind:checked={isExtendedGallery} />
						<div class="my-4"></div>
						<div class="flex items-center gap-x-3">
							<TextInput
								label="Copy From..."
								disabled={isExtendedGallery}
								bind:value={copyPath}
								options={Object.keys(data.galleries).filter((k) =>
									isBaseGallery(data.galleries[k])
								)}
								noReportValidation
								validationError={copyPath !== '' && !data.galleries[copyPath]
									? 'Select a valid path'
									: undefined}
							/>

							{data.galleries[copyPath] ? '✅' : '❌'}
						</div>
					</Collapsable>
				</div>
			{/snippet}
		</Modal>
	</div>
{/snippet}

{@render controls([])}
<FileTree structure={data.tree} {folder} {file} {showEmpty} />
