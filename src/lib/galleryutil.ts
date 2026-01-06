import { resolve } from '$app/paths';
import type { BaseArtPiece, BaseGallery, ExtendedGallery, RawGallery } from '@phosart/common/util';
import npath from 'node:path';
import { truthy, uploadImage } from './util';

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

interface ImageUrls {
	image: string;
	alts: Record<
		string,
		{
			image: string;
			video: {
				full?: string;
				thumb?: string;
			};
		}
	>;
	video: {
		full?: string;
		thumb?: string;
	};
}

export function getImageUrls(galleryPath: string, piece: BaseArtPiece, epoch?: number): ImageUrls {
	return {
		image: resolve(`/api/gallery/${galleryPath}/${piece.slug}/original-image?epoch=${epoch ?? ''}`),
		alts: Object.fromEntries(
			piece.alts?.map((alt, i) => {
				return [
					alt.name,
					{
						image: resolve(
							`/api/gallery/${galleryPath}/${piece.slug}/original-image?epoch=${epoch ?? ''}&alt=${alt.name}&altIndex=${i}`
						),
						video: {
							full: alt.video?.full
								? resolve(
										`/api/gallery/${galleryPath}/${piece.slug}/original-image?epoch=${epoch ?? ''}&alt=${alt.name}&altIndex=${i}&video=true`
									)
								: undefined,
							thumb: alt.video?.thumb
								? resolve(
										`/api/gallery/${galleryPath}/${piece.slug}/original-image?epoch=${epoch ?? ''}&alt=${alt.name}&altIndex=${i}&video=true&thumb=true`
									)
								: undefined
						}
					}
				] as const;
			}) ?? []
		),
		video: {
			full: piece.video?.full
				? resolve(
						`/api/gallery/${galleryPath}/${piece.slug}/original-image?video=true&epoch=${epoch ?? ''}`
					)
				: undefined,
			thumb: piece.video?.thumb
				? resolve(
						`/api/gallery/${galleryPath}/${piece.slug}/original-image?video=true&thumb=true&epoch=${epoch ?? ''}`
					)
				: undefined
		}
	};
}

async function copyPiece(
	piece: BaseArtPiece,
	srcGalleryPath: string,
	targetGalleryPath: string
): Promise<BaseArtPiece> {
	const urls = getImageUrls(srcGalleryPath, piece);
	const newPiece: BaseArtPiece = {
		...piece,
		id: 'copy-' + (piece.id ?? piece.slug) + Date.now() + '' + Math.floor(Math.random() * 4096)
	};

	async function upload(path: string) {
		return (
			await uploadImage(
				{ gallery: targetGalleryPath, piece: '' },
				await fetch(path).then((r) => r.blob()),
				piece.name
			)
		).filename;
	}

	newPiece.image = await upload(urls.image);

	newPiece.alts = newPiece.alts
		? await Promise.all(
				newPiece.alts.map(async (alt) => {
					const aurls = urls.alts[alt.name];
					if (!aurls) return null;
					return {
						...alt,
						image: await upload(aurls.image),
						video:
							aurls.video.full && aurls.video.thumb
								? {
										full: await upload(aurls.video.full),
										thumb: await upload(aurls.video.thumb)
									}
								: undefined
					};
				})
			).then((p) => p.filter(truthy))
		: undefined;

	if (urls.video.full && urls.video.thumb) {
		newPiece.video = { full: await upload(urls.video.full), thumb: await upload(urls.video.thumb) };
	}

	return newPiece;
}

export async function copyPieces(
	pieces: BaseArtPiece[],
	srcGalleryPath: string,
	targetGalleryPath: string
): Promise<BaseArtPiece[]> {
	return await Promise.all(pieces.map((p) => copyPiece(p, srcGalleryPath, targetGalleryPath)));
}
