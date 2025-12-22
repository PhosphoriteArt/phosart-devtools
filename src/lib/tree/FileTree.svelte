<script lang="ts">
	import type { File, FileStructure } from '$lib/structure';
	import type { Snippet } from 'svelte';
	import TreeButton from './TreeButton.svelte';

	interface Props {
		structure: FileStructure;
		folder: Snippet<[fileName: string, onclick: () => void]>;
		file: Snippet<[fileName: string, file: File, path: string[]]>;
		filter?: (file: File) => boolean;
	}

	const { structure, folder, file, filter }: Props = $props();

	const path: string[] = $state([]);

	const curStructure = $derived.by(() => {
		let cur = structure;
		for (const el of path) {
			const next = cur.structure[el];
			if (next.$type != 'folder') {
				return null;
			}
			cur = next;
		}
		return cur;
	});

	(() => {
		if (!curStructure) {
			throw new Error(':(');
		}
	})();

	const filesToShow = $derived(
		Object.entries(curStructure.structure)
			.filter(([, v]) => (v.$type == 'folder' ? false : (filter?.(v) ?? true)))
			.map(([k]) => k)
	);
	const folders = $derived(
		Object.entries(curStructure.structure)
			.filter(([, v]) => v.$type == 'folder')
			.map(([k]) => k)
	);
</script>

<div class="flex flex-row items-center">
	<TreeButton icon="caret-left" onclick={() => void path.pop()} />
	<TreeButton icon="home" onclick={() => void path.splice(0, path.length)} />
	{#each path as el, i (el)}
		<i class="fa-solid fa-chevron-right"></i>
		<TreeButton onclick={() => void path.splice(i + 1, path.length - i)}>
			{el}
		</TreeButton>
	{/each}
</div>

<div>
	<div>--Folders--</div>
	{#each folders as fname (fname)}
		{@render folder(fname, () => void path.push(fname))}
	{/each}
</div>

<div>
	<div>--Files--</div>
	{#each filesToShow as fname (fname)}
		{@render file(fname, curStructure.structure[fname] as File, path)}
	{/each}
</div>
