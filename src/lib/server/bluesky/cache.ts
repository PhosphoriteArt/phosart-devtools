import { type Post } from 'phosart-bsky/util';
import { readPack, writePack } from 'phosart-common/server';
import { mkdir } from 'fs/promises';
import { $CACHEDIR, $CACHEFILE, $FILESET, $SKIPSET } from './paths';

export async function writeCache(posts: Post[]) {
	await mkdir($CACHEDIR(), { recursive: true });
	await writePack($CACHEFILE(), posts);
}

export async function readCache(): Promise<Post[]> {
	try {
		return await readPack($CACHEFILE());
	} catch {
		return [];
	}
}

export async function writeSet(posts: Set<string>) {
	await mkdir($CACHEDIR(), { recursive: true });
	await writePack($FILESET(), [...posts]);
}

export async function readSet(): Promise<Set<string>> {
	try {
		return new Set(await readPack($CACHEFILE()));
	} catch {
		return new Set();
	}
}

export async function writeSkipSet(ss: Record<string, Set<string>>) {
	await mkdir($CACHEDIR(), { recursive: true });
	await writePack($SKIPSET(), Object.fromEntries(Object.entries(ss).map(([k, v]) => [k, [...v]])));
}

export async function readSkipSet(): Promise<Record<string, Set<string>>> {
	try {
		const res = await readPack<Record<string, string[]>>($SKIPSET());
		return Object.fromEntries(Object.entries(res).map(([k, v]) => [k, new Set(v)]));
	} catch {
		return {};
	}
}
