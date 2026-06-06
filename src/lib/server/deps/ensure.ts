import { ensure } from './util';

export async function ensureNode(): Promise<string> {
	return process.execPath;
}

export async function ensurePnpm(): Promise<string> {
	return await ensure('pnpm');
}

export async function ensureGit(): Promise<string> {
	return await ensure('git');
}

export async function ensureWrangler(): Promise<string> {
	return await ensure('wrangler');
}
