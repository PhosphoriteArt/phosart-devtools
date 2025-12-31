import type { BaseArtPiece } from 'phosart-common/util';

export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}

export type UploadPath =
	| { character: string; gallery?: undefined; for: 'full' | 'thumb' }
	| { character?: undefined; gallery: string };

export async function uploadImage(
	path: UploadPath,
	f: File
): Promise<{ filename: string; thumbnail?: string /* only for videos */ }> {
	const formData = new FormData();
	formData.append('file', f);
	formData.append('filename', f.name);
	formData.append('filetype', f.type);

	let reqpath: string;
	if (path.character !== undefined) {
		reqpath = `/api/characters/upload-image?for=${path.for}`;
	} else {
		reqpath = `/api/gallery/${path.gallery}/upload-image`;
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
		return { filename: json.fname, thumbnail };
	}
	throw new Error(
		`return value from image upload did not contain expected filename: ${JSON.stringify(json)}`
	);
}

export interface BaseResource {
	image: BaseArtPiece['image'];
	video?: BaseArtPiece['video'];
}
