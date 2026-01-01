import { $ART, clearCache, RawCharacter } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { writeFile } from 'node:fs/promises';
import z from 'zod';

const ZCharacters = z.array(RawCharacter);

export const POST: RequestHandler = async ({ request }) => {
	const characters = await ZCharacters.parseAsync(await request.json());

	await saveCharacters(characters);
	clearCache();

	return json({ ok: true });
};

async function saveCharacters(characters: z.infer<typeof ZCharacters>) {
	const charactersYaml = path.join($ART(), 'characters', 'characters.yaml');
	const yaml = stringify(characters, {
		blockQuote: true,
		collectionStyle: 'block',
		defaultKeyType: 'PLAIN',
		defaultStringType: 'PLAIN',
		indent: 2
	});
	await writeFile(charactersYaml, yaml, { encoding: 'utf-8' });
}
