import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import npath from 'node:path/posix';
import { $ART } from 'phosart-common/server';
import { writeFile } from 'node:fs/promises';
import { getGalleryDir, getGalleryName, normalizeGalleryPath } from '$lib/galleryutil';
import { getImageExtension } from '$lib/fileutil';
import { asNodeStream } from '$lib/server/fileutil';
import { spawn } from 'node:child_process';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

export const POST: RequestHandler = async ({ request, params }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const data = await request.formData();
	const f = data.get('file') as File;
	const fname = data.get('filename') as string;
	const ftype = data.get('filetype') as string;

	await uploadImage(galleryPath, f, fname, ftype);

	if (ftype.startsWith('video')) {
		spawn(ffmpegPath, [
			'-i',
			npath.join($ART(), getGalleryDir(galleryPath), relpath(galleryPath, fname, ftype)),
			'-vf',
			'select=eq(n\\,0)',
			'-vf',
			'scale=320:-2',
			'-q:v',
			'3',
			npath.join(
				$ART(),
				getGalleryDir(galleryPath),
				relpath(galleryPath, fname + '_thumb', 'image/jpeg')
			),
			'-y'
		]);
	}

	return json({
		fname: './' + relpath(galleryPath, fname, ftype),
		tname: './' + relpath(galleryPath, fname + '_thumb', 'image/jpeg')
	});
};

async function uploadImage(galleryPath: string, image: File, fname: string, ftype: string) {
	const galleryDir = getGalleryDir(galleryPath);
	const fp = npath.join($ART(), galleryDir, relpath(galleryPath, fname, ftype));

	await writeFile(fp, asNodeStream(image.stream()), { encoding: 'utf-8' });
}

function relpath(galleryPath: string, fname: string, ftype: string) {
	const galleryName = getGalleryName(galleryPath);
	const safeName = fname.replaceAll(/[^A-Za-z0-9-_]|\.\./g, '');
	const ext = getImageExtension(ftype);

	return `${galleryName}_${safeName}.${ext}`;
}
