import { PostsClient } from 'phosart-bsky/util';
import { readCache, readPerceptualHashCache, writeCache, flushPerceptualHashCache } from './cache';
import { error } from '@sveltejs/kit';
import { findMatches, getImages, mergePosts } from './posts';
import { stat } from 'fs/promises';
import { $CACHEFILE } from './paths';
import type { PostWithMatch } from './types';
import { createLogger } from '$lib/log';
import { Agent } from '@atproto/api';
const logger = createLogger();

export async function sync(cfg?: Record<string, string>): Promise<PostWithMatch[] | Response> {
	logger.info('Syncing bluesky posts & images...');
	try {
		const [cache, fileset] = await Promise.all([readCache(), readPerceptualHashCache()]);
		const bskyDid =
			process.env.BSKY_DID ??
			cfg?.bskyDid ??
			(cfg?.bskyUsername ? await getDid(cfg.bskyUsername) : undefined);
		const bskyPassword = process.env.BSKY_PASSWORD ?? cfg?.bskyPassword;
		const bskyUsername = process.env.BSKY_LOGIN ?? cfg?.bskyUsername;
		if (!bskyDid || !bskyPassword || !bskyUsername) {
			const errTxt = `Can't sync bluesky; missing information. Missing username? ${!bskyUsername} password? ${!bskyPassword} did? ${!bskyDid}`;
			logger.warn(errTxt);
			return error(400, 'Failed... ' + errTxt);
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
		await flushPerceptualHashCache(fileset);
		if (withImages.length !== allPosts.length) {
			return error(
				500,
				`Failed to load ${allPosts.length - withImages.length} image(s); try again`
			);
		}
		const matches = await findMatches(withImages);
		logger.info('Done syncing');
		return matches;
	} catch (err) {
		logger.warn('Failed to sync bluesky posts:', err);
		throw err;
	}
}

async function getDid(username: string): Promise<string> {
	const agent = new Agent({ service: 'https://bsky.social' });
	const res = await agent.resolveHandle({ handle: username });
	return res.data.did;
}
