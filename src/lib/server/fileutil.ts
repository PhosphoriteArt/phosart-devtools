/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLogger } from '$lib/log';
import {
	$ART,
	artists,
	characters,
	cleanUnusedHashes,
	clearCache,
	clearProcessedHashes,
	galleries
} from '@phosart/common/server';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

const logger = createLogger();

export function asNodeStream<R>(web: ReadableStream<R>): Readable {
	return Readable.fromWeb(web as any);
}
export function asWebStream(node: Readable): ReadableStream<any> {
	return Readable.toWeb(node) as any;
}

export function resolveWithinArt(targetPath: string): string | null {
	const artRoot = path.resolve($ART());
	const resolved = path.resolve(targetPath);
	const relative = path.relative(artRoot, resolved);
	if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
		return resolved;
	}
	return null;
}

export async function deleteResources(deletions: string[]): Promise<void> {
	await Promise.all(
		deletions.map(async (resourcePath) => {
			const resolved = resolveWithinArt(resourcePath);
			if (!resolved) {
				logger.warn('Skipping delete outside art root @', resourcePath);
				return;
			}
			logger.silly('Unlinking', resolved, '...');
			await unlink(resolved);
			logger.info('Deleted', resolved);
		})
	);
}

export async function reload() {
	clearProcessedHashes();
	clearCache();
	await galleries();
	await characters();
	await artists();
	await cleanUnusedHashes();
}
