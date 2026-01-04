import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import npath from 'node:path';
import { $ART } from 'phosart-common/server';
import { writeFile } from 'node:fs/promises';
import { getGalleryDir, getGalleryName, normalizeGalleryPath } from '$lib/galleryutil';
import { getImageExtension } from '$lib/fileutil';
import { asNodeStream, resolveWithinArt } from '$lib/server/fileutil';
import { spawn } from 'node:child_process';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { createLogger } from '$lib/log';
import { randomInt } from 'node:crypto';
const logger = createLogger();

export const POST: RequestHandler = async ({ request, params }) => {
	const galleryPath = normalizeGalleryPath(params.gallerypath);
	const data = await request.formData();
	const f = data.get('file') as File;
	const fname = data.get('filename') as string;
	const ftype = data.get('filetype') as string;

	logger.info('Uploading gallery image', fname, 'to', galleryPath, 'with type', ftype);
	const rand = String(Date.now()).slice(-5) + String(randomInt(4096));

	await uploadImage(galleryPath, f, fname, ftype, rand);

	if (ftype.startsWith('video')) {
		logger.info('Generating thumbnail for video', fname, '@', galleryPath, '...');
		const ffmpegInput = resolveWithinArt(
			npath.join($ART(), getGalleryDir(galleryPath), relpath(galleryPath, fname, ftype, rand))
		);
		const ffmpegOutput = resolveWithinArt(
			npath.join(
				$ART(),
				getGalleryDir(galleryPath),
				relpath(galleryPath, fname + '_thumb', 'image/jpeg', rand)
			)
		);
		if (!ffmpegInput || !ffmpegOutput) {
			logger.warn('Refusing to write video thumbnail outside art root @', galleryPath);
			throw error(400, 'invalid gallery path');
		}
		const ffmpeg = spawn(ffmpegPath, [
			'-i',
			ffmpegInput,
			'-vf',
			'select=eq(n\\,0)',
			'-vf',
			'scale=320:-2',
			'-q:v',
			'3',
			ffmpegOutput,
			'-y'
		]);
		try {
			await new Promise((resolve, reject) => {
				ffmpeg.once('close', resolve);
				ffmpeg.on('error', (err) => {
					reject(err);
				});
			});
		} catch (e) {
			logger.warn('Failed to generate video thumbnail:', e);
		}
	}
	logger.info('Uploaded gallery image', fname, 'to', galleryPath);

	return json({
		fname: './' + relpath(galleryPath, fname, ftype, rand),
		tname: './' + relpath(galleryPath, fname + '_thumb', 'image/jpeg', rand)
	});
};

async function uploadImage(
	galleryPath: string,
	image: File,
	fname: string,
	ftype: string,
	rand: string
) {
	const galleryDir = getGalleryDir(galleryPath);
	const fp = resolveWithinArt(
		npath.join($ART(), galleryDir, relpath(galleryPath, fname, ftype, rand))
	);
	if (!fp) {
		logger.warn('Refusing to write gallery image outside art root @', galleryPath);
		throw error(400, 'invalid gallery path');
	}
	logger.silly('Writing gallery image @', fp, 'for', fname, '...');

	await writeFile(fp, asNodeStream(image.stream()), { encoding: 'utf-8' });
	logger.debug('Wrote gallery image @', fp);
}

function relpath(galleryPath: string, fname: string, ftype: string, rand: string) {
	const galleryName = getGalleryName(galleryPath);
	const safeName = fname.replaceAll(/[^A-Za-z0-9-_]|\.\./g, '');
	const ext = getImageExtension(ftype);

	return `${galleryName}_${safeName}_${rand}.${ext}`;
}
