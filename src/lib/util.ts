import type { BaseArtPiece } from 'phosart-common/util';

export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}

export async function uploadImage(
	galleryPath: string,
	f: File
): Promise<{ filename: string; thumbnail?: string /* only for videos */ }> {
	const formData = new FormData();
	formData.append('file', f);
	formData.append('filename', f.name);
	formData.append('filetype', f.type);

	const res = await fetch(`/api/gallery/${galleryPath}/upload-image`, {
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
