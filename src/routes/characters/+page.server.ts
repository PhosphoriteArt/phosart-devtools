import { rawCharacters } from 'phosart-common/server';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	return {
		characters: await rawCharacters()
	};
};
