import { galleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({params}) => {
	const slug = params.slug;
	let n = atob(slug).replaceAll(/^\/*/g, "");

	console.log(slug, n, Object.keys(await galleries()))
	return {
		galleries: (await galleries())[n]
	};
};
