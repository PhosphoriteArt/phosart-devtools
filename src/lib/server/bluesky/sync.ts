import { PostsClient } from 'phosart-bsky/util';
import { readCache, readSet, writeCache, writeSet } from './cache';
import { error } from '@sveltejs/kit';
import { findMatches, getImages, mergePosts } from './posts';
import { stat } from 'fs/promises';
import { $CACHEFILE } from './paths';
import type { PostWithMatch } from './types';

export async function sync(cfg?: Record<string, string>): Promise<PostWithMatch[] | Response> {
	const [cache, fileset] = await Promise.all([readCache(), readSet()]);
	const bskyDid = process.env.BSKY_DID ?? cfg?.bskyDid;
	const bskyPassword = process.env.BSKY_PASSWORD ?? cfg?.bskyPassword;
	const bskyUsername = process.env.BSKY_LOGIN ?? cfg?.bskyUsername;
	if (!bskyDid || !bskyPassword || !bskyUsername) {
		return error(400, 'Failed... ' + bskyDid);
	}
	const client = new PostsClient({
		bskyDid,
		bskyPassword,
		bskyUsername,
		cache: {
			backend: {
				async cachePosts(posts) {
					await writeCache(mergePosts(cache, posts));
				},
				async getCachedPosts(_limit) {
					return cache;
				},
				async postsLastCachedAt() {
					try {
						return (await stat($CACHEFILE())).mtime;
					} catch {
						return new Date(0);
					}
				}
			}
		}
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const allPosts = mergePosts(cache, await client.getPosts(undefined as any));
	const withImages = await getImages(allPosts, fileset);
	await writeSet(fileset);
	if (withImages.length !== allPosts.length) {
		return error(500, `Failed to load ${allPosts.length - withImages.length} image(s); try again`);
	}
	return await findMatches(withImages);
}
