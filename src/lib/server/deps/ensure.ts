import { ensure } from './util';

export async function ensureNode(): Promise<string> {
	return process.execPath;
}

export async function ensurePnpm(): Promise<string> {
	try {
		return await ensure('pnpm');
	} catch (e) {
		throw new Error(
			`Failed to find pnpm. Please make sure it's installed on your computer. Error: ${e}`
		);
	}
}

export async function ensureGit(): Promise<string> {
	try {
		return await ensure('git');
	} catch (e) {
		throw new Error(
			`Failed to find git. Please make sure it's installed on your computer. Error: ${e}`
		);
	}
}
