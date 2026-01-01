import { mkdir } from 'fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { rename } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path/posix';
import { $IMGDIR } from './paths';

export async function downloadAndWrite(h: string, uri: string) {
	await mkdir($IMGDIR(), { recursive: true });

	const p = path.join($IMGDIR(), h + '.jpg');
	const tmp = p + '.tmp.' + Date.now();

	const ws = createWriteStream(tmp);

	await new Promise((resolve, reject) => {
		https.get(uri, (res) => {
			res.on('error', (err) => {
				reject(err);
			});
			const pipe = pipeline(res, ws);

			pipe.then(resolve).catch(reject);
		});
	});

	await rename(tmp, p);
}
