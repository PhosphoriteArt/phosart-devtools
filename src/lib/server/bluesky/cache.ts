import { type Post } from 'phosart-bsky/util';
import { readPack, writePack } from 'phosart-common/server';
import { mkdir } from 'fs/promises';
import { $CACHEDIR, $CACHEFILE, $FILESET as $PHASHCACHE, $SKIPSET } from './paths';
import { createLogger } from '$lib/util';
const logger = createLogger();

type PerceptualHash = string;
type ImageID = string;
export type PerceptualHashCache = Record<ImageID, PerceptualHash>;

type GalleryPath = string;
export type SkipSet = Record<GalleryPath, Set<ImageID>>;

export async function writeCache(posts: Post[]) {
	logger.silly('Writing bluesky cachefile @', $CACHEFILE(), '...');
	if (await mkdir($CACHEDIR(), { recursive: true })) {
		logger.debug('Created cachedir @', $CACHEDIR(), '...');
	}
	await writePack($CACHEFILE(), posts);
	logger.debug('Wrote bluesky cachefile @', $CACHEFILE());
}

export async function readCache(): Promise<Post[]> {
	try {
		logger.silly('Reading bluesky cachefile @', $CACHEFILE(), '...');
		const cache = await readPack<Post[]>($CACHEFILE());
		logger.silly('Read bluesky cachefile @', $CACHEFILE());
		return cache;
	} catch (err) {
		logger.info("Couldn't read bluesky cachefile @", $CACHEFILE(), '- will create it. Error:', err);
		return [];
	}
}

export async function flushPerceptualHashCache(posts: PerceptualHashCache) {
	logger.silly('Writing bluesky phash cache @', $PHASHCACHE(), '...');
	if (await mkdir($CACHEDIR(), { recursive: true })) {
		logger.debug('Created cachedir @', $CACHEDIR(), '...');
	}
	await writePack($PHASHCACHE(), posts);
	logger.debug('Wrote bluesky phash cache @', $PHASHCACHE());
}

export async function readPerceptualHashCache(): Promise<PerceptualHashCache> {
	try {
		logger.silly('Reading bluesky phash cache @', $PHASHCACHE(), '...');
		const cache = await readPack<PerceptualHashCache>($PHASHCACHE());
		logger.silly('Read bluesky phash cache @', $PHASHCACHE());
		return cache;
	} catch (err) {
		logger.info(
			"Couldn't read bluesky phash cache @",
			$PHASHCACHE(),
			'- will create it. Error:',
			err
		);
		return {};
	}
}

export async function writeSkipSet(ss: SkipSet) {
	logger.silly('Writing skipset @', $SKIPSET(), '...');
	if (await mkdir($CACHEDIR(), { recursive: true })) {
		logger.debug('Created cachedir @', $CACHEDIR(), '...');
	}

	await writePack($SKIPSET(), Object.fromEntries(Object.entries(ss).map(([k, v]) => [k, [...v]])));
	logger.debug('Wrote skipset @', $SKIPSET());
}

export async function readSkipSet(): Promise<SkipSet> {
	try {
		logger.silly('Reading skipset @', $SKIPSET(), '...');
		const res = await readPack<Record<string, string[]>>($SKIPSET());
		const value = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, new Set(v)]));
		logger.silly('Read skipset @', $SKIPSET());
		return value;
	} catch (err) {
		logger.info("Couldn't read skipset @", $SKIPSET(), '- will create it. Error:', err);
		return {};
	}
}
