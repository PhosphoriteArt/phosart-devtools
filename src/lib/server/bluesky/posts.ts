import { type Post } from 'phosart-bsky/util';
import {
	galleries,
	rawGalleries,
	type GalleryCache,
	type RawGalleryCache
} from 'phosart-common/server';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path/posix';
import phash from 'sharp-phash';
import dist from 'sharp-phash/distance';
import type { GalleryPath } from '$lib/util';
import { downloadAndWrite } from './images';
import { $IMGDIR } from './paths';
import { isExtendsGallery } from '$lib/galleryutil';
import type { ExtendedPost, PostWithMatch } from './types';

export async function findMatches(posts: ExtendedPost[]): Promise<PostWithMatch[]> {
	const gcache = await galleries();
	const rgcache = await rawGalleries();
	const x = await Promise.all(posts.map((p) => findMatch(p, gcache, rgcache)));
	return x;
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

export async function findMatch(
	post: ExtendedPost,
	galleries: GalleryCache,
	rawGalleries: RawGalleryCache,
	threshold: number = 5
): Promise<PostWithMatch> {
	const matches: GalleryPath[][] = (post.image_fullsize_phash ?? []).map((p) =>
		matchesForPhash(p, galleries, rawGalleries, threshold)
	);
	const videoMatch = post.video_thumb_phash
		? matchesForPhash(post.video_thumb_phash, galleries, rawGalleries, threshold)
		: [];

	return { ...post, image_fullsize_matches: matches, video_thumb_matches: videoMatch };
}

export async function getImages(posts: Post[], fileset: Set<string>): Promise<ExtendedPost[]> {
	return (await Promise.all(posts.map((post) => getImage(post, fileset)))).filter(
		(p): p is ExtendedPost => !!p
	);
}

export async function phashImage(h: string): Promise<string> {
	const p = path.join($IMGDIR, h + '.jpg');

	return await phash(await readFile(p));
}

export async function getImage(post: Post, fileset: Set<string>): Promise<ExtendedPost | null> {
	return {
		...post,
		image_fullsize_ids: post.image_fullsize_url?.map(imageId) ?? null,
		image_fullsize_phash: post.image_fullsize_url
			? await Promise.all(post.image_fullsize_url.map((u) => doPhashImage(u, fileset)))
			: null,
		video_thumb_id: post.video_thumb_url ? imageId(post.video_thumb_url) : null,
		video_thumb_phash: post.video_thumb_url
			? await doPhashImage(post.video_thumb_url, fileset)
			: null
	};
}

export async function doPhashImage(uri: string, fileset: Set<string>): Promise<string> {
	const id = imageId(uri);
	if (!fileset.has(id)) {
		await downloadAndWrite(id, uri);
		fileset.add(id);
	}
	return await phashImage(id);
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
