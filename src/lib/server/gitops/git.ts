import simpleGit, { type CommitResult, type PushResult } from 'simple-git';
import { $ROOT } from '@phosart/common/server';
import { ensureGit } from '../deps/ensure';

async function rootedGit() {
	return simpleGit({
		baseDir: $ROOT() + '/..',
		binary: await ensureGit(),

		// This is OK since the custom binary only comes from which/where
		// needed to accept paths with spaces...
		unsafe: { allowUnsafeCustomBinary: true }
	});
}

export async function status() {
	return await (await rootedGit()).status();
}

export async function tryPull() {
	try {
		await (await rootedGit()).pull(['--rebase']);
		return true; // Indicate success if no error was thrown
	} catch (error) {
		try {
			await (await rootedGit()).rebase(['--abort']);
		} catch (rbError) {
			throw new Error(
				'Git pull failed or encountered a conflict, but we also encountered an error when reverting: ' +
					String(rbError) +
					' (orig: ' +
					String(error) +
					')'
			);
		}
		throw new Error('Git pull failed or encountered a conflict: ' + error);
	}
}

export async function commit(message: string): Promise<CommitResult> {
	try {
		return (await rootedGit()).add(['-A']).commit(message);
	} catch (error) {
		throw new Error('Git commit failed: ' + error);
	}
}

export async function push(): Promise<PushResult> {
	try {
		return (await rootedGit()).push();
	} catch (error) {
		throw new Error('Git push failed: ' + error);
	}
}

export async function remotes() {
	return (await rootedGit()).remote(['--list']);
}

export async function addRemote(name: string, url: string) {
	return (await rootedGit()).remote(['add', name, url]);
}
