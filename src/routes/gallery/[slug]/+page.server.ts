import { galleries, rawGalleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;
	const n = atob(slug).replaceAll(/^\/*/g, '');

	console.log(slug, n, Object.keys(await galleries()));
	return {
		gallery: (await galleries())[n],
		rawGallery: (await rawGalleries())[n],
		allTags: [
			...new Set(
				Object.values(await galleries())
					.flatMap((g) => g.pieces)
					.flatMap((p) => p.tags)
			)
		]
	};
};
