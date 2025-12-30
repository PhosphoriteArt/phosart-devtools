import type { RawGallery } from 'phosart-common/util';
import { $ART, clearCache, galleries, RawGallery as ZRawGallery } from 'phosart-common/server';
import type { RequestHandler } from './$types';
import npath from 'node:path';
import { json } from '@sveltejs/kit';
import { stringify } from 'yaml';
import { writeFile } from 'node:fs/promises';

export const POST: RequestHandler = async ({ request, params }) => {
	const slug = params.gallerypath ?? '';
	const n = slug.replaceAll(/^\/*/g, '');
	const v = await ZRawGallery.parseAsync(await request.json());

	await saveGallery(n, v);
	clearCache();
	await galleries();

	return json({ ok: true });
};

async function saveGallery(path: string, newGallery: RawGallery) {
	if (!('$extends' in newGallery)) {
		for (const p of newGallery.pieces) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete (p as unknown as any).slug;
		}
	}
	const fp = npath.join($ART, path);
	const x = stringify(newGallery, {
		blockQuote: true,
		collectionStyle: 'block',
		defaultKeyType: 'PLAIN',
		defaultStringType: 'PLAIN',
		indent: 2
	});
	await writeFile(fp, x, { encoding: 'utf-8' });
}
