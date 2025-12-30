import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import npath from 'node:path';
import { $ART } from 'phosart-common/server';
import { writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';

export const POST: RequestHandler = async ({ request, params }) => {
	const slug = params.gallerypath ?? '';
	const n = slug.replaceAll(/^\/*/g, '');
	const data = await request.formData();
	const f = data.get('file') as File;
	const fname = data.get('filename') as string;
	const ftype = data.get('filetype') as string;

	await uploadImage(n, f, fname, ftype);

	return json({ fname: './' + relpath(n, fname, ftype) });
};

async function uploadImage(galleryPath: string, image: File, fname: string, ftype: string) {
	const fpath = galleryPath
		.split('/')
		.reduceRight((acc, cur) => (!acc ? ' ' : cur + '/' + acc), '')
		.trim();
	const fp = npath.join($ART, fpath, relpath(galleryPath, fname, ftype));

	// TODO factor out
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await writeFile(fp, Readable.fromWeb(image.stream() as any), { encoding: 'utf-8' });
}

function relpath(galleryPath: string, fname: string, ftype: string) {
	const gname = galleryPath.split('/').at(-1)?.split('.')[0] ?? 'unknown';

	return (
		gname +
		'_' +
		fname.replaceAll(/[^A-Za-z0-9-_]|\.\./g, '') +
		'.' +
		({
			'image/jpg': 'jpeg',
			'image/jpeg': 'jpeg',
			'image/png': 'png'
		}[ftype] ?? 'bin')
	);
}
