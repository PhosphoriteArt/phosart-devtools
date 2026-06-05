import { arrayToShuffled } from 'array-shuffle';
import type { GalleryCache } from '@phosart/common/server';
import { asTree as baseAsTree, type FolderElement } from '@phosart/common/util';

export function asTree(cache: GalleryCache, pruneGalleries?: number): FolderElement {
	return baseAsTree(
		cache,
		pruneGalleries ? (p) => arrayToShuffled(p.slice(0, pruneGalleries)) : undefined
	);
}
