import { $ART, Artist, clearCache, type ArtistCache } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path/posix';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { writeFile } from 'node:fs/promises';
import z from 'zod';

const Artists = z.record(z.string(), Artist);

export const POST: RequestHandler = async ({ request }) => {
	await saveArtists(await Artists.parseAsync(await request.json()));
	clearCache();

	return json({ ok: true });
};

async function saveArtists(newArtists: ArtistCache) {
	const galleryFullPath = path.join($ART, 'artists.yaml');
	const yaml = stringify(newArtists, {
		blockQuote: true,
		collectionStyle: 'block',
		defaultKeyType: 'PLAIN',
		defaultStringType: 'PLAIN',
		indent: 2
	});
	await writeFile(galleryFullPath, yaml, { encoding: 'utf-8' });
}
