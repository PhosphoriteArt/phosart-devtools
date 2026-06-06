import simpleGit, { type CommitResult, type PushResult } from 'simple-git';
import { $ROOT } from '@phosart/common/server';
import { ensureGit } from '../deps/ensure';
import { access } from 'node:fs/promises';

async function rootedGit() {
	return simpleGit({
		baseDir: $ROOT() + '/..',
		binary: await ensureGit()
	});
}

async function ensureGitRepo() {
	try {
		await access($ROOT() + '/../.git');
		return true;
	} catch {
		try {
			(await rootedGit()).init(['-b', 'main']);
		} catch (error) {
			throw new Error('Git failed to initialize a new repository: ' + String(error));
		}
	}
}

export async function status() {
	await ensureGitRepo();
	return await (await rootedGit()).status();
}

export async function tryPull() {
	await ensureGitRepo();

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
	await ensureGitRepo();

	try {
		return (await rootedGit()).add(['-A']).commit(message);
	} catch (error) {
		throw new Error('Git commit failed: ' + error);
	}
}

export async function push(): Promise<PushResult> {
	await ensureGitRepo();

	const curBranch = (await status()).current;
	if (curBranch === 'HEAD' || !curBranch) {
		throw new Error('Cannot push with a detached HEAD');
	}

	try {
		return (await rootedGit()).push('origin', curBranch, ['--set-upstream']);
	} catch (error) {
		throw new Error('Git push failed: ' + error);
	}
}

export async function remotes() {
	await ensureGitRepo();

	return String(await (await rootedGit()).remote(['-v']))
		.split('\n')
		.map((line) => line.trim())
		.filter((v) => !!v)
		.map((line) => {
			const [name, rest] = line.split('\t');
			const [target, role] = rest.split(' ');
			return { name, target, role: role.replace(/^\(/g, '').replace(/\)$/g, '') };
		});
}

export async function setRemote(url: string) {
	await ensureGitRepo();

	const git = await rootedGit();

	for (const remote of new Set((await remotes()).map((r) => r.name))) {
		await git.remote(['remove', remote]);
	}

	return await git.remote(['add', 'origin', url]);
}
