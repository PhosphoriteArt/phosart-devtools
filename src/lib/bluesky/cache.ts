import { type Post } from 'phosart-bsky/util';
import { readPack, writePack } from 'phosart-common/server';
import { mkdir } from 'fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { rename } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path/posix';
import type { GalleryPath } from '$lib/util';
import { $CACHEDIR, $CACHEFILE, $FILESET, $IMGDIR, $SKIPSET } from './paths';

export interface ExtendedPost extends Post {
	image_fullsize_ids: string[] | null;
	image_fullsize_phash: string[] | null;
	video_thumb_id: string | null;
	video_thumb_phash: string | null;
}

export interface PostWithMatch extends ExtendedPost {
	image_fullsize_matches: GalleryPath[][];
	video_thumb_matches: GalleryPath[];
}

export async function writeCache(posts: Post[]) {
	await mkdir($CACHEDIR, { recursive: true });
	await writePack($CACHEFILE, posts);
}

export async function readCache(): Promise<Post[]> {
	try {
		return await readPack($CACHEFILE);
	} catch {
		return [];
	}
}

export async function writeSet(posts: Set<string>) {
	await mkdir($CACHEDIR, { recursive: true });
	await writePack($FILESET, [...posts]);
}

export async function readSet(): Promise<Set<string>> {
	try {
		return new Set(await readPack($CACHEFILE));
	} catch {
		return new Set();
	}
}

export async function writeSkipSet(ss: Record<string, Set<string>>) {
	await mkdir($CACHEDIR, { recursive: true });
	await writePack($SKIPSET, Object.fromEntries(Object.entries(ss).map(([k, v]) => [k, [...v]])));
}

export async function readSkipSet(): Promise<Record<string, Set<string>>> {
	try {
		const res = await readPack<Record<string, string[]>>($SKIPSET);
		return Object.fromEntries(Object.entries(res).map(([k, v]) => [k, new Set(v)]));
	} catch {
		return {};
	}
}

export async function downloadAndWrite(h: string, uri: string) {
	await mkdir($IMGDIR, { recursive: true });

	const p = path.join($IMGDIR, h + '.jpg');
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
