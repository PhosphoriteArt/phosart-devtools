import { join } from 'node:path';
import type { RequestHandler } from './$types';
import { $ART, rawCharacters } from 'phosart-common/server';
import { error } from '@sveltejs/kit';
import { open } from 'node:fs/promises';
import { asWebStream } from '$lib/server/fileutil';
import { createLogger, type BaseResource } from '$lib/util';
const logger = createLogger();

export const GET: RequestHandler = async ({ params }) => {
	logger.silly('Fetching character image', params.charactername, 'type', params.type, '...');
	const character = (await rawCharacters())[params.charactername];

	if (!character) {
		logger.warn('Character', params.charactername, 'not found');
		return error(404);
	}

	let piece: BaseResource;
	if (params.type === 'full') {
		piece = character.picture;
	} else if (params.type === 'thumb') {
		if (character.thumbnail) {
			piece = character.thumbnail;
		} else {
			logger.warn('Character thumbnail missing @', params.charactername);
			return error(404);
		}
	} else {
		logger.warn('Character image type invalid @', params.charactername, 'type', params.type);
		return error(400);
	}

	const path = join($ART(), 'characters', piece.image);
	logger.silly('Serving character image @', path);
	const file = await open(path);

	return new Response(asWebStream(file.createReadStream({ autoClose: true })), {
		status: 200,
		headers: {}
	});
};
