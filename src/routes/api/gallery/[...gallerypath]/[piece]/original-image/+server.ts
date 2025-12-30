import { join } from 'node:path';
import type { RequestHandler } from './$types';
import { $ART, rawGalleries } from 'phosart-common/server';
import { error } from '@sveltejs/kit';
import { open } from 'node:fs/promises';
import { Readable } from 'node:stream';

export const GET: RequestHandler = async ({ params, url }) => {
	const { gallerypath, piece } = params;
	const gPath = gallerypath.replaceAll(/^\/*/g, '');
	const gal = (await rawGalleries())[gPath];
	if ('$extends' in gal) {
		return error(404);
	}

	function ofVideo(v: { full: string; thumb?: string } | null | undefined): string | null {
		return (url.searchParams.get('thumb') === 'true' ? (v?.thumb ?? v?.full) : v?.full) ?? null;
	}

	const pei = gal.pieces.find((p) => p.slug === piece);
	let img = ofVideo(pei?.video) ?? pei?.image;
	if (!img) {
		return error(404);
	}

	const alt = url.searchParams.get('alt');
	if (alt) {
		const altPei = pei?.alts?.find((a) => a.name === alt);
		if (!altPei) {
			return error(404);
		}
		img = ofVideo(altPei.video) ?? altPei.image;
	}

	const path = join(
		$ART,
		gPath
			.split('/')
			.reduceRight((acc, cur) => (!acc ? ' ' : cur + '/' + acc), '')
			.trim(),
		img
	);
	const file = await open(path);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Response(Readable.toWeb(file.createReadStream({ autoClose: true })) as any, {
		status: 200,
		headers: {}
	});
};
