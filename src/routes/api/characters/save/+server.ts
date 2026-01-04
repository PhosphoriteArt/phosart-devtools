import { $ART, clearCache, RawCharacter } from '@phosart/common/server';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { writeFile } from 'node:fs/promises';
import z from 'zod';
import { createLogger } from '$lib/log';
import { rawCharacters } from '@phosart/common/server';
import { deleteResources } from '$lib/server/fileutil';
const logger = createLogger();

const ZCharacters = z.array(RawCharacter);

export const POST: RequestHandler = async ({ request }) => {
	const characters = await ZCharacters.parseAsync(await request.json());
	const old = await rawCharacters();
	logger.info('Saving characters:', characters.length, 'entries...');
	await saveCharacters(characters);
	const deletedRefs = getDiffedReferences(Object.values(old), characters);
	if (deletedRefs.size > 0) {
		logger.warn('Found', deletedRefs.size, 'deleted image reference(s). Deleting them');
		await deleteResources([...deletedRefs]);
	}
	clearCache();
	logger.info('Saved characters');

	return json({ ok: true });
};

async function saveCharacters(characters: z.infer<typeof ZCharacters>) {
	const charactersYaml = path.join($ART(), 'characters', 'characters.yaml');
	logger.silly('Writing characters yaml @', charactersYaml, '...');
	const yaml = stringify(characters, {
		blockQuote: true,
		collectionStyle: 'block',
		defaultKeyType: 'PLAIN',
		defaultStringType: 'PLAIN',
		indent: 2
	});
	await writeFile(charactersYaml, yaml, { encoding: 'utf-8' });
	logger.debug('Wrote characters yaml @', charactersYaml);
}

function getDiffedReferences(
	oldCharacters: z.infer<typeof ZCharacters>,
	newCharacters: z.infer<typeof ZCharacters>
): Set<string> {
	const oldRefs = getAllReferences(oldCharacters);
	const newRefs = getAllReferences(newCharacters);
	return oldRefs.difference(newRefs);
}

function getAllReferences(characters: z.infer<typeof ZCharacters>): Set<string> {
	const refs = new Set<string>();

	characters.flatMap(getReferences).forEach(refs.add.bind(refs));

	return refs;
}

function getReferences(character: z.infer<typeof RawCharacter>): string[] {
	const references: string[] = [];

	const basePath = path.resolve(path.join($ART(), 'characters'));
	references.push(path.resolve(path.join(basePath, character.picture.image)));
	if (character.thumbnail) {
		references.push(path.resolve(path.join(basePath, character.thumbnail.image)));
	}

	return references;
}
