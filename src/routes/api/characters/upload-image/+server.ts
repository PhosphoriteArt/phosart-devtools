import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import npath from 'node:path/posix';
import { $ART } from 'phosart-common/server';
import { writeFile } from 'node:fs/promises';
import { getImageExtension } from '$lib/fileutil';
import { asNodeStream } from '$lib/server/fileutil';

export const POST: RequestHandler = async ({ request, url }) => {
	const data = await request.formData();
	const f = data.get('file') as File;
	const fname = data.get('filename') as string;
	const ftype = data.get('filetype') as string;

	const type = url.searchParams.get('for') === 'thumb' ? 'thumb' : 'full';

	await uploadImage(type, f, fname, ftype);

	return json({
		fname: './' + relpath(type, fname, ftype)
	});
};

async function uploadImage(type: string, image: File, fname: string, ftype: string) {
	const fp = npath.join($ART, 'characters', relpath(type, fname, ftype));

	await writeFile(fp, asNodeStream(image.stream()), { encoding: 'utf-8' });
}

function relpath(type: string, fname: string, ftype: string) {
	const safeName = fname.replaceAll(/[^A-Za-z0-9-_]|\.\./g, '');
	const ext = getImageExtension(ftype);

	return `ch_${type}_${safeName}.${ext}`;
}
