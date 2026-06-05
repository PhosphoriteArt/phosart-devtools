<script lang="ts">
	import { arrayToShuffled } from 'array-shuffle';
	import OriginalImage from '$lib/form/OriginalImage.svelte';
	import type { BaseGallery } from '@phosart/common/util';

	interface Props {
		galleryPath: string;
		gallery: BaseGallery;
		cssSize: string;
	}

	const { gallery, cssSize, galleryPath }: Props = $props();

	const pieces = $derived(arrayToShuffled(gallery.pieces).slice(0, 4));
</script>

{#if pieces[0]}
	{@const topw = pieces[1] ? 'calc(var(--preview-size) / 2)' : 'var(--preview-size)'}
	{@const toph = pieces[2] ? 'calc(var(--preview-size) / 2)' : 'var(--preview-size)'}
	{@const botw = pieces[3] ? 'calc(var(--preview-size) / 2)' : 'var(--preview-size)'}
	{@const both = 'calc(var(--preview-size) / 2)'}
	<div class="preview" style="--preview-size: {cssSize}">
		<div style="height: {toph}; width: {topw}" class="imgcontainer" class:square={topw === toph}>
			<div>
				<OriginalImage
					class={pieces[0].nsfw
						? 'duration-300ms blur-sm transition-[filter] hover:blur-none hover:duration-[3s]'
						: ''}
					galleryPath={{ gallery: galleryPath, piece: pieces[0].slug }}
				/>
			</div>
		</div>
		{#if pieces[1]}
			<div style="height: {toph}; width: {topw}" class="imgcontainer" class:square={topw === toph}>
				<div>
					<OriginalImage
						class={pieces[1].nsfw
							? 'duration-300ms blur-sm transition-[filter] hover:blur-none hover:duration-[3s]'
							: ''}
						galleryPath={{ gallery: galleryPath, piece: pieces[1].slug }}
					/>
				</div>
			</div>
		{/if}
		{#if pieces[2]}
			<div style="height: {both}; width: {botw}" class="imgcontainer" class:square={botw === both}>
				<div>
					<OriginalImage
						class={pieces[2].nsfw
							? 'duration-300ms blur-sm transition-[filter] hover:blur-none hover:duration-[3s]'
							: ''}
						galleryPath={{ gallery: galleryPath, piece: pieces[2].slug }}
					/>
				</div>
			</div>
		{/if}
		{#if pieces[3]}
			<div style="height: {both}; width: {botw}" class="imgcontainer" class:square={botw === both}>
				<div>
					<OriginalImage
						class={pieces[3].nsfw
							? 'duration-300ms blur-sm transition-[filter] hover:blur-none hover:duration-[3s]'
							: ''}
						galleryPath={{ gallery: galleryPath, piece: pieces[3].slug }}
					/>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.preview {
		display: contents;
	}
	.imgcontainer {
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.imgcontainer > div {
		width: 100%;
		height: 100%;
	}
	.imgcontainer :global(img) {
		object-fit: cover;
		object-position: center top;
	}
</style>
