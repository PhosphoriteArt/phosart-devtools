<script lang="ts">
	import FileTree from '$lib/tree/FileTree.svelte';
	import TreeButton from '$lib/tree/TreeButton.svelte';
	import { goto as go } from '$app/navigation';
	import { resolve } from '$app/paths';

	const { data } = $props();

	$effect(() => {
		if (data.redirectGallery) {
			go(resolve(`/gallery/${data.redirectGallery}`));
		}
	});
</script>

<FileTree structure={data.galleries} filter={(file) => file.$type === 'gallery'}>
	{#snippet file(fileName, _file, path)}
		<TreeButton
			icon="file"
			onclick={() => void go(resolve(`/gallery/${path.join('/') + '/' + fileName}`))}
			>{fileName}</TreeButton
		>
	{/snippet}
	{#snippet folder(folderName, onclick)}
		<TreeButton icon="folder" {onclick}>{folderName}</TreeButton>
	{/snippet}
</FileTree>
