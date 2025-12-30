import { artists, characters, galleries, rawGalleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import type { CharacterRef } from 'phosart-common/util';

export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug ?? '';
	const n = slug.replaceAll(/^\/*/g, '');

	const allCharacterRefs: Record<string, CharacterRef> = {
		...Object.values(await galleries())
			.flatMap((g) => g.pieces)
			.flatMap((p) => p.characters)
			.reduce(
				(acc, cur) => ({
					...acc,
					[typeof cur === 'string' ? cur : `${cur.name} by ${cur.from}`]: cur
				}),
				{}
			),
		...Object.values(await characters()).reduce(
			(acc, cur) => ({ ...acc, [cur.name]: cur.name }),
			{}
		)
	};
	const nPath = n
		.split('/')
		.reduceRight((acc, cur) => (!acc ? ' ' : cur + '/' + acc), '')
		.trim();
	console.log(nPath);

	return {
		gallery: (await galleries())[n],
		rawGallery: (await rawGalleries())[n],
		allArtists: await artists(),
		allCharacterRefs,
		allCharacters: await characters(),
		allTags: [
			...new Set(
				Object.values(await galleries())
					.flatMap((g) => g.pieces)
					.flatMap((p) => p.tags)
			)
		],
		allGalleries: Object.keys(await galleries())
			.filter((k) => k.startsWith(nPath))
			.map((p) => './' + p.replace(nPath, '')),
		galPath: n
	};
};
