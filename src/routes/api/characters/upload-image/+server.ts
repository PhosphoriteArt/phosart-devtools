import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import npath from 'node:path';
import { $ART } from '@phosart/common/server';
import { writeFile } from 'node:fs/promises';
import { getImageExtension } from '$lib/fileutil';
import { asNodeStream, resolveWithinArt } from '$lib/server/fileutil';
import { createLogger } from '$lib/log';
import { randomInt } from 'node:crypto';
const logger = createLogger();

export const POST: RequestHandler = async ({ request, url }) => {
	const data = await request.formData();
	const f = data.get('file') as File;
	const fname = data.get('filename') as string;
	const ftype = data.get('filetype') as string;

	const type = url.searchParams.get('for') === 'thumb' ? 'thumb' : 'full';

	const rand = String(Date.now()).slice(-5) + String(randomInt(4096));

	logger.info('Uploading character image', fname, 'as', type, 'with type', ftype, '...');
	await uploadImage(type, f, fname, ftype, rand);
	logger.info('Uploaded character image', fname, 'as', type);

	return json({
		fname: './' + relpath(type, fname, ftype, rand)
	});
};

async function uploadImage(type: string, image: File, fname: string, ftype: string, rand: string) {
	const fp = resolveWithinArt(npath.join($ART(), 'characters', relpath(type, fname, ftype, rand)));
	if (!fp) {
		logger.warn('Refusing to write character image outside art root @', fname);
		throw error(400, 'invalid character image path');
	}
	logger.debug('Writing character image @', fp, 'for', fname, '...');

	await writeFile(fp, asNodeStream(image.stream()), { encoding: 'utf-8' });
	logger.debug('Wrote character image @', fp);
}

function relpath(type: string, fname: string, ftype: string, rand: string) {
	const safeName = fname.replaceAll(/[^A-Za-z0-9-_]|\.\./g, '');
	const ext = getImageExtension(ftype);

	return `ch_${type}_${safeName}_${rand}.${ext}`;
}
