import { $ART, artists, characters, galleries } from 'phosart-common/server';
import type { PageServerLoad } from './$types';
import { search } from '$lib/server/structure';

export const prerender = false;

export const load: PageServerLoad = async () => {
	return {
		galleries: await search($ART, await galleries(), await characters(), await artists())
	};
};
