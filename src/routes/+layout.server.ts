import { rawGalleries } from '@phosart/common/server';
import type { LayoutServerLoad } from './$types';
import { normalizeGalleryPath } from '$lib/galleryutil';
import { createLogger } from '$lib/log';
import { psk } from '$lib/psk';
import { ensureGit } from '$lib/server/deps/ensure';
import { readDeploySettings } from './api/deploy/config/util';
const logger = createLogger();

export const prerender = false;

export const load: LayoutServerLoad = async () => {
	logger.silly('Loading layout data');
	const galleryPaths = Object.keys(await rawGalleries());
	const onlyPath = galleryPaths.length === 1 ? galleryPaths[0] : null;
	logger.silly('Loaded layout data');
	return {
		redirectGallery: normalizeGalleryPath(onlyPath) || null,
		previewPort: getPreviewPort(),
		bskyAvailable: isBlueskyAvailable(),
		psk: psk,
		gitAvailable: await isGitAvailable(),
		platform: process.platform,
		deploySettings: await readDeploySettings()
	};
};

function getPreviewPort() {
	try {
		if (!process.env.PREVIEWPORT) {
			return null;
		}
		return parseInt(process.env.PREVIEWPORT);
	} catch {
		return null;
	}
}

function isBlueskyAvailable() {
	const bskyDid = process.env.BSKY_DID;
	const bskyPassword = process.env.BSKY_PASSWORD;
	const bskyUsername = process.env.BSKY_LOGIN;
	if (!bskyDid || !bskyPassword || !bskyUsername) {
		logger.silly('Bluesky not available; missing credentials');
		return false;
	}
	logger.silly('Bluesky available');
	return true;
}
async function isGitAvailable() {
	try {
		await ensureGit();
		return true;
	} catch (error) {
		logger.warn("Couldn't find git: " + String(error));
		return false;
	}
}
