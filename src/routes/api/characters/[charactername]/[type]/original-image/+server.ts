import { join } from 'node:path/posix';
import type { RequestHandler } from './$types';
import { $ART, rawCharacters } from 'phosart-common/server';
import { error } from '@sveltejs/kit';
import { open } from 'node:fs/promises';
import { asWebStream } from '$lib/server/fileutil';
import type { BaseResource } from '$lib/util';

export const GET: RequestHandler = async ({ params }) => {
	const character = (await rawCharacters())[params.charactername];

	if (!character) {
		return error(404);
	}

	let piece: BaseResource;
	if (params.type === 'full') {
		piece = character.picture;
	} else if (params.type === 'thumb') {
		if (character.thumbnail) {
			piece = character.thumbnail;
		} else {
			return error(404);
		}
	} else {
		return error(400);
	}

	const path = join($ART(), 'characters', piece.image);
	const file = await open(path);

	return new Response(asWebStream(file.createReadStream({ autoClose: true })), {
		status: 200,
		headers: {}
	});
};
