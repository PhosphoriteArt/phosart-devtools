import { mkdir } from 'fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { rename } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { $IMGDIR } from './paths';
import { RateLimit } from 'async-sema';
import { createLogger } from '$lib/util';
const logger = createLogger();

const sema = RateLimit(3);

export async function downloadAndWrite(h: string, uri: string) {
	await sema();
	await mkdir($IMGDIR(), { recursive: true });

	const p = path.join($IMGDIR(), h + '.jpg');
	const tmp = p + '.tmp.' + Date.now();

	const ws = createWriteStream(tmp);

	logger.debug('Downloading image', h, '@', uri, 'to', p, '...');
	await new Promise((resolve, reject) => {
		https.get(uri, (res) => {
			res.on('error', (err) => {
				logger.warn('Download failed; error:', err);
				reject(err);
			});
			const pipe = pipeline(res, ws);

			pipe
				.then((_) => {
					if (res.statusCode && res.statusCode > 299) {
						logger.warn('Download failed; bluesky responded with status', res.statusCode);
						reject(res.statusCode);
					} else {
						resolve(_);
					}
				})
				.catch(reject);
		});
	});
	logger.info('Finished downloading image', h, '@', uri);

	await rename(tmp, p);
}
