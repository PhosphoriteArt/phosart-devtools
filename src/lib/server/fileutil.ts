/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLogger } from '$lib/log';
import { unlink } from 'node:fs/promises';
import { Readable } from 'node:stream';

const logger = createLogger();

export function asNodeStream<R>(web: ReadableStream<R>): Readable {
	return Readable.fromWeb(web as any);
}
export function asWebStream(node: Readable): ReadableStream<any> {
	return Readable.toWeb(node) as any;
}

export async function deleteResources(deletions: string[]): Promise<void> {
	await Promise.all(
		deletions.map(async (path) => {
			logger.silly('Unlinking', path, '...');
			await unlink(path);
			logger.info('Deleted', path);
		})
	);
}
