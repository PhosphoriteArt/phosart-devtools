<script lang="ts">
	import { goto as go, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Collapsable from '$lib/Collapsable.svelte';
	import type { File, FileStructure } from '$lib/structure.js';
	import Checkbox from '$lib/form/Checkbox.svelte';
	import Modal from '$lib/Modal.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import ActionButton from '$lib/ActionButton.svelte';
	import { asRecord, type BaseArtPiece, type RawGallery } from '@phosart/common/util';
	import { browser } from '$app/environment';
	import SearchInput from '$lib/form/search/SearchInput.svelte';
	import { copyPieces, isBaseGallery } from '$lib/galleryutil.js';
	import Layout from '$lib/Layout.svelte';
	import DirectoryList from '$lib/ui_from_template/DirectoryList.svelte';
	import { usePath } from '$lib/path.svelte.js';
	import { EyeClosed, EyeIcon, FolderPlus, ImagesIcon } from '@lucide/svelte';
	import Tooltip from '$lib/Tooltip.svelte';

	const { data } = $props();

	let newName = $state('');
	let isExtendedGallery = $state(false);
	let showEmpty = $state(false);

	const fpath = $derived.by(usePath);

	$effect(() => {
		if (data.redirectGallery && browser && window.location.hash !== '#stay') {
			go(resolve(`/gallery/${data.redirectGallery}`));
		}
	});

	const id = $props.id();
	let search = $state('');
	let copyPath = $state('');

	function fldr(item: File | FileStructure): FileStructure {
		if (item.$type !== 'folder') {
			throw new Error('RIP');
		}
		return item;
	}

	function gotoPath(tree: FileStructure, fpath: string[]): FileStructure {
		while (fpath.length > 0) {
			tree = fldr(tree.structure[fpath[0]]);
			fpath = fpath.slice(1);
		}
		return tree;
	}
</script>

<svelte:head>
	<title>Art Site Editor</title>
</svelte:head>

{#snippet controls(path: string[])}
	<div class="mb-4 flex gap-x-1">
		<Modal
			title="New Folder"
			onClose={() => void (newName = '')}
			class="preset-outlined-primary-50-950 bg-surface-300-700"
		>
			{#snippet icon()}
				<FolderPlus size="8pt" />
			{/snippet}
			{#snippet children(close)}
				<div class="m-4">
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
							close();
						}}
						unstyled
						class="btn w-full preset-filled-primary-500"
					>
						Create
					</ActionButton>
				</div>
			{/snippet}
		</Modal>
		<Modal
			title="New Gallery"
			onClose={() => {
				newName = '';
				isExtendedGallery = false;
			}}
			class="preset-filled-primary-50-950"
		>
			{#snippet icon()}
				<ImagesIcon size="8pt" />
			{/snippet}

			{#snippet children(close)}
				<div class="m-4">
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
						}}
						unstyled
						class="btn w-full preset-filled-primary-500"
					>
						Create
					</ActionButton>

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

<Layout title="Galleries" breadcrumbs>
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
						validationError={search !== '' && !data.galleryPaths.includes(search)
							? 'invalid path'
							: undefined}
						options={asRecord(data.galleryPaths ?? [], (p) => p)}
						onSelect={(s) => {
							if (data.galleryPaths.includes(s)) {
								go(resolve('/gallery/[...gallerypath]', { gallerypath: s }));
							}
						}}
					/>
				</div>
				<Tooltip tooltip="show/hide empty folders" placement="bottom">
					{#snippet children(attach)}
						<button
							{@attach attach}
							class="btn-icon btn"
							class:preset-filled={showEmpty}
							class:preset-tonal={!showEmpty}
							onclick={() => void (showEmpty = !showEmpty)}
						>
							{#if showEmpty}
								<EyeIcon />
							{:else}
								<EyeClosed />
							{/if}
						</button>
					{/snippet}
				</Tooltip>
			</div>
		</div>
	{/snippet}

	<DirectoryList path={fpath} tree={gotoPath(data.tree, fpath)} {showEmpty} />

	<div class="absolute right-3 bottom-0">
		{@render controls(fpath)}
	</div>
</Layout>
