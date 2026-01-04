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
	import { asRecord, type RawGallery } from 'phosart-common/util';
	import { browser } from '$app/environment';
	import SearchInput from '$lib/form/search/SearchInput.svelte';

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
</script>

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
		<FileTree {showEmpty} structure={data.galleries} {folder} {file} path={[...path, folderName]} />
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
							await fetch('/api/folder/' + [...path, newName].join('/'), { method: 'PATCH' });
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
							await fetch('/api/gallery/' + [...path, newName + '.gallery'].join('/') + '/save', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(
									(isExtendedGallery ? { $extends: [] } : { pieces: [] }) satisfies RawGallery
								)
							});
							await invalidateAll();
							close();
						}}>Create</ActionButton
					>

					<Collapsable title="Advanced" class="mt-4">
						<Checkbox label="Is extended gallery" bind:checked={isExtendedGallery} />
					</Collapsable>
				</div>
			{/snippet}
		</Modal>
	</div>
{/snippet}

{@render controls([])}
<FileTree structure={data.galleries} {folder} {file} {showEmpty} />
