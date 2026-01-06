import {
	artists,
	characters,
	rawGalleries,
	readThemeConfig,
	readThemeSchema
} from '@phosart/common/server';
import { normalizeCharacter } from '@phosart/common/util';
import type { PageServerLoad } from './$types';
import type { CharacterRef } from '@phosart/common/util';
import { getGalleryDir, isBaseGallery, normalizeGalleryPath } from '$lib/galleryutil';
import { createLogger } from '$lib/log';
import { unique as uniq } from '$lib/util';
const logger = createLogger();

export const prerender = false;

async function getAllCharacterRefsFromGalleries(): Promise<Record<string, CharacterRef>> {
	return Object.values(await rawGalleries())
		.flatMap((g) => (isBaseGallery(g) ? g.pieces : []))
		.flatMap((p) => p.characters)
		.map((ch) => [ch, normalizeCharacter(ch)] as const)
		.reduce(
			(acc, [cur, nch]) => ({
				...acc,
				[nch.from ? `${nch.name} by ${nch.from}` : nch.name]: cur
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
	logger.silly('Loading gallery page data @', galleryPath);

	const allCharacterRefs: Record<string, CharacterRef> = {
		...(await getAllCharacterRefsFromGalleries()),
		...(await getAllDefinedCharacterRefs())
	};

	const galleryDir = getGalleryDir(galleryPath);
	const galleryValues = Object.values(await rawGalleries());
	const allTags = uniq(
		galleryValues.flatMap((g) => (isBaseGallery(g) ? g.pieces : [])).flatMap((p) => p.tags)
	);
	const allGalleryRelpaths = Object.keys(await rawGalleries())
		.filter((k) => k.startsWith(galleryDir) && k !== galleryPath)
		.map((p) => './' + normalizeGalleryPath(p.replace(galleryDir, '')));
	logger.silly(
		'Loaded gallery page data @',
		galleryPath,
		'tags',
		allTags.length,
		'relpaths',
		allGalleryRelpaths.length
	);

	return {
		galleries: await rawGalleries(),
		allArtists: await artists(),
		allCharacterRefs,
		allCharacters: await characters(),
		allTags,
		allGalleryRelpaths,
		galleryPath,
		config: await readThemeConfig(await readThemeSchema())
	};
};
