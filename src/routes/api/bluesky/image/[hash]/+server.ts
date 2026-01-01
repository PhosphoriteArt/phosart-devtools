import type { RequestHandler } from './$types';
import { open } from 'node:fs/promises';
import { asWebStream } from '$lib/server/fileutil';
import { $IMGDIR } from '../../../../../lib/server/bluesky/paths';
import path from 'node:path/posix';

export const GET: RequestHandler = async ({ params }) => {
	const file = await open(
		path.join($IMGDIR, params.hash.replaceAll(/[^a-zA-Z0-9+_-]/g, '%') + '.jpg')
	);

	return new Response(asWebStream(file.createReadStream({ autoClose: true })), {
		status: 200,
		headers: { 'Content-Type': 'image/jpeg' }
	});
};
