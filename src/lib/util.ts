import type { BaseArtPiece } from '@phosart/common/util';
import { createLogger } from './log';
import { resolve } from '$app/paths';
const logger = createLogger();

export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}

export type CharacterPath = {
	character: string;
	for: 'full' | 'thumb';
	gallery?: undefined;
	piece?: undefined;
	alt?: undefined;
	altIndex?: undefined;
};
export type GalleryPath = {
	character?: undefined;
	for?: undefined;
	gallery: string;
	piece: string;
	alt?: string;
	altIndex?: number;
};
export type UploadPath = CharacterPath | GalleryPath;

export async function uploadImage(
	path: UploadPath,
	f: Blob,
	name: string
): Promise<{ filename: string; thumbnail?: string /* only for videos */ }> {
	logger.debug('Uploading image from blob', name, 'to', path);
	const formData = new FormData();
	formData.append('file', f);
	formData.append('filename', name);
	formData.append('filetype', f.type);

	let reqpath: string;
	if (path.character !== undefined) {
		reqpath = resolve(`/api/characters/upload-image?for=${path.for}`);
	} else {
		reqpath = resolve('/api/gallery/[...gallerypath]/upload-image', { gallerypath: path.gallery });
	}

	const res = await fetch(reqpath, {
		method: 'POST',
		body: formData
	});
	const json = await res.json();
	let thumbnail: string | undefined = undefined;
	if (typeof json === 'object' && 'tname' in json && typeof json.tname === 'string') {
		thumbnail = json.tname;
	}

	if (typeof json === 'object' && 'fname' in json && typeof json.fname === 'string') {
		const ret = { filename: json.fname, thumbnail };
		logger.debug('Upload complete:', ret);
		return ret;
	}
	throw new Error(
		`return value from image upload did not contain expected filename: ${JSON.stringify(json)}`
	);
}

export interface BaseResource {
	image: BaseArtPiece['image'];
	video?: BaseArtPiece['video'];
}

export function truthy<T>(t: T | null | undefined): t is T {
	return !!t;
}
