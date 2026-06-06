import { $ROOT } from '@phosart/common/server';
import { type RequestHandler } from '@sveltejs/kit';
import { ZipArchive } from 'archiver';
import { Readable } from 'node:stream';

export const POST: RequestHandler = async () => {
	const rt = $ROOT() + '/../build';

	const archive = new ZipArchive({ zlib: { level: 9 } });

	archive.directory(rt, false);

	archive.on('error', (err: unknown) => {
		throw err;
	});

	archive.finalize();

	return new Response(Readable.toWeb(archive) as unknown as ReadableStream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment; filename="deploy.zip"'
		}
	});
};
