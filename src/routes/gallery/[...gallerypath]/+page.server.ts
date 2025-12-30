import { artists, characters, galleries, rawGalleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import type { CharacterRef } from 'phosart-common/util';
import { getGalleryDir, normalizeGalleryPath } from '$lib/galleryutil';
import { unique as uniq } from '$lib/util';

export const prerender = false;

async function getAllCharacterRefsFromGalleries(): Promise<Record<string, CharacterRef>> {
	return Object.values(await galleries())
		.flatMap((g) => g.pieces)
		.flatMap((p) => p.characters)
		.reduce(
			(acc, cur) => ({
				...acc,
				[typeof cur === 'string' ? cur : `${cur.name} by ${cur.from}`]: cur
			}),
			{}
		);
}

async function getAllDefinedCharacterRefs(): Promise<Record<string, CharacterRef>> {
	return Object.values(await characters()).reduce(
		(acc, cur) => ({ ...acc, [cur.name]: cur.name }),
		{}
	);
}

export const load: PageServerLoad = async ({ params }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);

	const allCharacterRefs: Record<string, CharacterRef> = {
		...(await getAllCharacterRefsFromGalleries()),
		...(await getAllDefinedCharacterRefs())
	};

	const galleryDir = getGalleryDir(galleryPath);

	return {
		gallery: (await galleries())[galleryPath],
		rawGallery: (await rawGalleries())[galleryPath],
		allArtists: await artists(),
		allCharacterRefs,
		allCharacters: await characters(),
		allTags: uniq(
			Object.values(await galleries())
				.flatMap((g) => g.pieces)
				.flatMap((p) => p.tags)
		),
		allGalleryRelpaths: Object.keys(await galleries())
			.filter((k) => k.startsWith(galleryDir))
			.map((p) => './' + p.replace(galleryDir, '')),
		galleryPath
	};
};
