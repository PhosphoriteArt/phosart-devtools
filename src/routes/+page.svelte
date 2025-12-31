<script lang="ts">
	import FileTree from '$lib/tree/FileTree.svelte';
	import TreeButton from '$lib/tree/TreeButton.svelte';
	import { goto as go } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Collapsable from '$lib/Collapsable.svelte';
	import type { File } from '$lib/structure.js';

	const { data } = $props();

	$effect(() => {
		if (data.redirectGallery) {
			go(resolve(`/gallery/${data.redirectGallery}`));
		}
	});
</script>

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
	<Collapsable title={folderName} class="my-1">
		<FileTree structure={data.galleries} {folder} {file} path={[...path, folderName]} />
	</Collapsable>
{/snippet}

<FileTree structure={data.galleries} {folder} {file} />
