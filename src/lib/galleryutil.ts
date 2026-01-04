import type { BaseArtPiece, BaseGallery, ExtendedGallery, RawGallery } from '@phosart/common/util';
import npath from 'node:path';

export function normalizeGalleryPath(path: string | null | undefined): string {
	return (path ?? '').replaceAll(npath.sep, '/').replaceAll(/^\/*/g, '');
}

export function getGalleryDir(galleryPath: string): string {
	const parts = galleryPath.split('/');

	return parts.slice(0, -1).join('/');
}
export function getGalleryName(galleryPath: string): string {
	const parts = galleryPath.split('/');

	return parts.at(-1)!.split('.')[0]!;
}

export function isBaseGallery(gallery: RawGallery): gallery is BaseGallery {
	return !isExtendsGallery(gallery);
}
export function isExtendsGallery(gallery: RawGallery): gallery is ExtendedGallery {
	return !!gallery && '$extends' in gallery;
}

export function baseGallery(gallery: RawGallery): BaseGallery | null {
	if (isBaseGallery(gallery)) {
		return gallery;
	}
	return null;
}
export function extendsGallery(gallery: RawGallery): ExtendedGallery | null {
	if (isExtendsGallery(gallery)) {
		return gallery;
	}
	return null;
}

export function createNewPiece(
	image: File,
	filePath: string,
	index: number,
	identifiers: string[],
	thumbPath?: string
): BaseArtPiece {
	let slug = image.name.replaceAll(/[^A-Za-z0-9]/g, '-') + '-' + index;
	while (identifiers.includes(slug)) {
		slug += ' copy';
	}

	const piece: BaseArtPiece = {
		id: slug,
		alt: '',
		characters: [],
		date: new Date(image.lastModified),
		name: image.name,
		image: '',
		slug: slug,
		tags: [],
		alts: [],
		artist: undefined,
		description: '',
		position: undefined,
		video: undefined
	};

	if (image.type.startsWith('video')) {
		piece.video = { full: filePath, thumb: filePath };
		piece.image = thumbPath ?? '';
	} else {
		piece.image = filePath;
	}

	return piece;
}
