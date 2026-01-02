import { $ART, Artist, clearCache, type ArtistCache } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { writeFile } from 'node:fs/promises';
import z from 'zod';
import { createLogger } from '$lib/util';
const logger = createLogger();

const Artists = z.record(z.string(), Artist);

export const POST: RequestHandler = async ({ request }) => {
	const artists = await Artists.parseAsync(await request.json());
	logger.info('Saving artists:', Object.keys(artists).length, 'entries...');
	await saveArtists(artists);
	clearCache();
	logger.info('Saved artists');

	return json({ ok: true });
};

async function saveArtists(newArtists: ArtistCache) {
	const galleryFullPath = path.join($ART(), 'artists.yaml');
	logger.debug('Writing artists yaml @', galleryFullPath, '...');
	const yaml = stringify(newArtists, {
		blockQuote: true,
		collectionStyle: 'block',
		defaultKeyType: 'PLAIN',
		defaultStringType: 'PLAIN',
		indent: 2
	});
	await writeFile(galleryFullPath, yaml, { encoding: 'utf-8' });
	logger.debug('Wrote artists yaml @', galleryFullPath);
}
