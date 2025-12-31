<script lang="ts">
	import type { File, FileStructure } from '$lib/structure';
	import type { Snippet } from 'svelte';

	interface Props {
		structure: FileStructure;
		folder: Snippet<[fileName: string, path: string[]]>;
		file: Snippet<[fileName: string, file: File, path: string[]]>;
		filter?: (file: File) => boolean;
		path?: string[];
		showEmpty?: boolean;
	}

	const { structure, folder, file, filter, path: propPath, showEmpty }: Props = $props();

	const path = $derived(propPath ?? []);

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
			.filter(([, v]) => v.$type == 'folder' && (showEmpty || v.items > 0))
			.map(([k]) => k)
	);
</script>

<div class="flex flex-col items-start text-left">
	{#each folders as fname (fname)}
		{@render folder(fname, path)}
	{/each}

	{#each filesToShow as fname (fname)}
		{@render file(fname, curStructure.structure[fname] as File, path)}
	{/each}
</div>
