import { type Post } from '@phosart/bsky/util';
import {
	galleries,
	rawGalleries,
	type GalleryCache,
	type RawGalleryCache
} from '@phosart/common/server';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import phash from 'sharp-phash';
import dist from 'sharp-phash/distance';
import { createLogger } from '$lib/log';
import type { GalleryPath } from '$lib/util';
import { downloadAndWrite } from './images';
import { $IMGDIR } from './paths';
import { isExtendsGallery } from '$lib/galleryutil';
import type { ExtendedPost, PostWithMatch } from './types';
import type { PerceptualHashCache } from './cache';
const logger = createLogger();

export async function findMatches(posts: ExtendedPost[]): Promise<PostWithMatch[]> {
	logger.debug('Finding matches for', posts.length, 'posts...');
	const gcache = await galleries();
	const rgcache = await rawGalleries();
	const matches = posts.map((p) => findMatch(p, gcache, rgcache));
	const numMatches = matches.flatMap((p) => p.image_details).flatMap((d) => d.matches).length;
	logger.silly('Found', numMatches, 'matches');
	return matches;
}

function matchesForPhash(
	postPhash: string,
	galleries: GalleryCache,
	rawGalleries: RawGalleryCache,
	threshold: number
): GalleryPath[] {
	const matches: [GalleryPath, number][] = [];

	for (const [galpath, gallery] of Object.entries(galleries)) {
		if (isExtendsGallery(rawGalleries[galpath])) {
			continue;
		}
		for (const piece of gallery.pieces) {
			const d = dist(piece.image.phash, postPhash);
			if (d <= threshold) {
				matches.push([{ gallery: galpath, piece: piece.slug }, d]);
			}
			for (const alt of piece.alts ?? []) {
				const d = dist(alt.image.phash, postPhash);
				if (d <= threshold) {
					matches.push([
						{ gallery: galpath, piece: piece.slug, alt: alt.name },
						dist(alt.image.phash, postPhash)
					]);
				}
			}
		}
	}

	return matches.toSorted(([, d1], [, d2]) => d1 - d2).map(([up]) => up);
}

export function findMatch(
	post: ExtendedPost,
	galleries: GalleryCache,
	rawGalleries: RawGalleryCache,
	threshold: number = 5
): PostWithMatch {
	return {
		...post,
		image_details: post.image_details.map((v) => ({
			...v,
			matches: matchesForPhash(v.phash, galleries, rawGalleries, threshold)
		}))
	};
}

export async function getImages(
	posts: Post[],
	fileset: PerceptualHashCache
): Promise<ExtendedPost[]> {
	logger.debug('Getting images for', posts.length, 'posts...');
	const withImages = (
		await Promise.all(
			posts.map(async (post) => {
				try {
					return await getImage(post, fileset);
				} catch (e) {
					console.warn('getting image failed: ', e);
					return null;
				}
			})
		)
	).filter((p): p is ExtendedPost => !!p);

	logger.debug('Finished getting images');
	return withImages;
}

export async function phashImage(h: string): Promise<string> {
	const p = path.join($IMGDIR(), h + '.jpg');

	return await phash(await readFile(p));
}

export async function getImage(
	post: Post,
	fileset: PerceptualHashCache
): Promise<ExtendedPost | null> {
	return {
		...post,
		image_details: await Promise.all(
			post.image_details.map((v) =>
				doPhashImage(v.full_url, fileset).then((phash) => ({
					...v,
					phash,
					id: imageId(v.full_url)
				}))
			)
		)
	};
}

export async function doPhashImage(uri: string, fileset: PerceptualHashCache): Promise<string> {
	const id = imageId(uri);
	if (id in fileset) {
		return fileset[id];
	}

	let hash: string;
	try {
		hash = await phashImage(id);
	} catch (e) {
		logger.debug(
			'Failed to hash image',
			id,
			'trying to download the image then will hash again. Error:',
			e
		);
		await downloadAndWrite(id, uri);
		hash = await phashImage(id);
	}
	fileset[id] = hash;
	return hash;
}

export function imageId(uri: string) {
	const h = crypto.createHash('md5');
	h.update(uri);
	return h.digest('base64url');
}

export function mergePosts(cache: Post[], posts: Post[]): Post[] {
	for (const post of posts) {
		if (!cache.find((p) => p.uri === post.uri)) {
			cache.push(post);
		}
	}

	cache.sort((a, b) => b.date.localeCompare(a.date));

	return cache;
}
