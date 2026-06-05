<script lang="ts">
	import GalleryTile from '$lib/ui_from_template/GalleryTile.svelte';
	import { qsearchObj } from './search.svelte';
	import type { File, FileStructure } from '$lib/structure';
	import { resolve } from '$app/paths';
	import { CableIcon, Folder } from '@lucide/svelte';

	interface Props {
		tree: FileStructure;
		path: string[];
		search?: string | null;
	}
	const { tree, path, search }: Props = $props();

	const folders = $derived(
		qsearchObj(
			search,
			Object.fromEntries(
				Object.entries(tree.structure).filter(
					(v): v is [string, FileStructure] => v[1].$type === 'folder'
				)
			),
			(_, k) => k
		)
	);
	const galleries = $derived(
		qsearchObj(
			search,
			Object.fromEntries(
				Object.entries(tree.structure).filter((v): v is [string, File] => v[1].$type === 'gallery')
			),
			(_, k) => k
		)
	);
</script>

<div>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each Object.entries(folders) as [k, v] (k)}
			{@const empty = Object.keys(v.structure).length == 0}
			<a
				class="btn flex items-center preset-outlined-surface-950-50 p-2 whitespace-normal"
				href={resolve('/') + '?' + String(new URLSearchParams({ path: [...path, k].join('/') }))}
				class:font-extralight={empty}
				class:text-gray-500={empty}
			>
				<Folder />
				{k}{#if empty}&nbsp;(empty){/if}
			</a>
		{/each}
		{#each Object.entries(galleries) as [k, v] (k)}
			{#if v.$type === 'gallery' && !v.isBase}
				<a
					class="btn flex items-center preset-outlined-surface-950-50 p-2"
					href={resolve('/gallery/[...gallerypath]', {
						gallerypath: [...path, k].join('/')
					})}
				>
					<CableIcon />
					{k}
				</a>
			{/if}
		{/each}
	</div>
	<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each Object.entries(galleries) as [k, v] (k)}
			{@const galname = k.replace(/\.gallery$/, '')}
			{#if v.$type === 'gallery' && v.isBase}
				<GalleryTile
					name={galname}
					galleryPath={[...path, k].join('/')}
					gallery={v.data}
					href={resolve('/gallery/[...gallerypath]', {
						gallerypath: [...path, k].join('/')
					})}
				/>
			{/if}
		{/each}
	</div>
</div>
