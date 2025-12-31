import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PostsClient, type Post } from 'phosart-bsky/util';
import path from 'node:path/posix';
import { $ART } from 'phosart-common/server';
import { mkdir } from 'fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGunzip, createGzip } from 'node:zlib';
import { PackrStream, UnpackrStream } from 'msgpackr';
import { pipeline } from 'node:stream/promises';
import { rename, stat } from 'node:fs/promises';

const $CACHEDIR = path.join($ART, '..', '..', '.cache', 'bluesky');
const $CACHEFILE = path.join($CACHEDIR, '.posts.pack.gz');

async function writeCache(posts: Post[]) {
	await mkdir($CACHEDIR, { recursive: true });
	const final = $CACHEFILE;
	const tmp = final + '.tmp.' + Date.now();
	const ws = createWriteStream(tmp);
	const gz = createGzip({ level: 9 });
	const packr = new PackrStream();
	const p = pipeline(packr, gz, ws);
	packr.end(posts);

	await p;

	await rename(tmp, final);
}

async function readCache(): Promise<Post[]> {
	try {
		const gunzip = createGunzip();
		const unpackr = new UnpackrStream();
		const rs = createReadStream($CACHEFILE);
		const data = new Promise<Post[]>((resolve) => {
			unpackr.once('data', resolve);
		});

		await pipeline(rs, gunzip, unpackr);

		return await data;
	} catch {
		return [];
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const cfg = await request.json();
	const cache = await readCache();
	const bskyDid = process.env.BSKY_DID ?? cfg.bskyDid;
	const bskyPassword = process.env.BSKY_PASSWORD ?? cfg.bskyPassword;
	const bskyUsername = process.env.BSKY_LOGIN ?? cfg.bskyUsername;
	if (!bskyDid || !bskyPassword || !bskyUsername) {
		return error(400, 'Failed...');
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
					return (await stat($CACHEFILE)).mtime;
				}
			}
		}
	});

	return json(client.getPosts(parseFloat('inf')));
};

function mergePosts(cache: Post[], posts: Post[]): Post[] {
	for (const post of posts) {
		if (!cache.find((p) => p.uri !== post.uri)) {
			cache.push(post);
		}
	}

	cache.sort((a, b) => a.date.localeCompare(b.date));

	return cache;
}
