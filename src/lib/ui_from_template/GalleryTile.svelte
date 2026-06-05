<script lang="ts">
	import type { BaseGallery } from '@phosart/common/util';
	import Tile from './Tile.svelte';
	import GalleryPreview from './GalleryPreview.svelte';

	interface Props {
		galleryPath: string;
		gallery: BaseGallery;
		name: string;
		href: string;
		px?: number;
	}

	const { galleryPath, name, gallery, href, px = 256 }: Props = $props();
</script>

<div class="flex justify-center">
	<Tile {href} title={name}>
		<GalleryPreview cssSize="{px}px" {gallery} {galleryPath} />
	</Tile>
</div>
