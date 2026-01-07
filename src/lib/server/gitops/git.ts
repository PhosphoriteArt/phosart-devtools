import { $ART } from '@phosart/common/server';
import { spawn } from 'node:child_process';

export interface BranchMeta {
	oid: string;
	head: string;
	upstream?: string;
	ab?: {
		ahead: string;
		behind: string;
	};
}
export type FileStatus = '.' | 'M' | 'T' | 'A' | 'D' | 'R' | 'C' | 'U' | '?';
export interface XY {
	index: FileStatus;
	worktree: FileStatus;
}
export type SubmoduleState =
	| {
			type: 'normal';
			didCommitChange: false;
			hasTrackedChanges: false;
			hasUntrackedChanges: false;
	  }
	| {
			type: 'submodule';
			didCommitChange: boolean;
			hasTrackedChanges: boolean;
			hasUntrackedChanges: boolean;
	  };
export interface BaseChange {
	status: XY;
	submoduleState: SubmoduleState;
	modeHead: number;
	modeIndex: number;
	modeWorktree: number;
	headName: string;
	indexName: string;
	path: string;
}
export type Change =
	| (BaseChange &
			(
				| {
						type: 'normal';
				  }
				| {
						type: 'renamed' | 'copied';
						score: number;
						origPath: string;
				  }
			))
	| {
			type: 'unmerged';
			status: XY;
			submoduleState: SubmoduleState;
			stage1Mode: number;
			stage2Mode: number;
			stage3Mode: number;
			worktreeMode: number;
			stage1Name: string;
			stage2Name: string;
			stage3Name: string;
			path: string;
	  }
	| { type: 'untracked'; path: string }
	| { type: 'ignored'; path: string };
export interface GitStatus {
	branch: BranchMeta;
	changes: Change[];
}

function ordinaryStatusRegex() {
	return /1 ([.MTADRCU?]{2}) ([NS])([C.])([M.])([U.]) (\d{6}) (\d{6}) (\d{6}) ([a-f0-9]+) ([a-f0-9]+) (.+)$/;
}

function copyStatusRegex() {
	return /2 ([.MTADRCU?]{2}) ([NS])([C.])([M.])([U.]) (\d{6}) (\d{6}) (\d{6}) ([a-f0-9]+) ([a-f0-9]+) ([RC])(\d+) ([^\t]+)\t(.+)$/;
}
function unmergeRegex() {
	return /u ([.MTADRCU?]{2}) ([NS])([C.])([M.])([U.]) (\d{6}) (\d{6}) (\d{6}) (\d{6}) ([a-f0-9]+) ([a-f0-9]+) ([a-f0-9]+) (.+)$/;
}
function untrackRegex() {
	return /\? (.+)$/;
}
function headerRegex() {
	return /# ([^.]+)\.([^.]+?) (.*)/;
}

export class Git {
	async status(): Promise<GitStatus> {
		const proc = spawn('git', ['status', '--porcelain=2', '--branch', '--untracked-files'], {
			stdio: 'pipe',
			cwd: $ART()
		});
		let out = '';
		proc.stdout.on('data', (d) => (out += d));
		await new Promise((resolve) => proc.on('close', resolve));

		const status: GitStatus = {
			branch: { head: '', oid: '' },
			changes: []
		};
		for (const line of out.split('\n')) {
			let match = headerRegex().exec(line);
			if (match) {
				const [, domain, key, value] = match;
				if (domain !== 'branch') continue;
				switch (key) {
					case 'oid':
						status.branch.oid = value;
						break;
					case 'head':
						status.branch.head = value;
						break;
					case 'upstream':
						status.branch.upstream = value;
						break;
					case 'ab': {
						const [, plus, minus] = /\+(\d+) -(\d+)/.exec(value)!;
						status.branch.ab = {
							ahead: plus,
							behind: minus
						};
						break;
					}
				}
				continue;
			}
			match = untrackRegex().exec(line);
			if (match) {
				const [, path] = match;
				status.changes.push({ type: 'untracked', path });
				continue;
			}
			match = unmergeRegex().exec(line);
			if (match) {
				const [, xy, ns, c, m, u, m1, m2, m3, mW, h1, h2, h3, path] = match;
				status.changes.push({
					type: 'unmerged',
					status: {
						index: xy[0] as FileStatus,
						worktree: xy[1] as FileStatus
					},
					path,
					stage1Mode: parseInt(m1, 8),
					stage1Name: h1,
					stage2Mode: parseInt(m2, 8),
					stage2Name: h2,
					stage3Mode: parseInt(m3, 8),
					stage3Name: h3,
					submoduleState: {
						type: ns === 'N' ? 'normal' : 'submodule',
						didCommitChange: c === 'C',
						hasTrackedChanges: m === 'M',
						hasUntrackedChanges: u === 'U'
					} as SubmoduleState,
					worktreeMode: parseInt(mW, 8)
				});
				continue;
			}
			match = copyStatusRegex().exec(line);
			if (match) {
				const [, xy, ns, c, m, u, mH, mI, mW, hH, hI, x, score, path, origPath] = match;
				status.changes.push({
					type: x === 'R' ? 'renamed' : 'copied',
					headName: hH,
					indexName: hI,
					modeHead: parseInt(mH, 8),
					modeIndex: parseInt(mI, 8),
					modeWorktree: parseInt(mW, 8),
					origPath: origPath,
					path: path,

					score: parseInt(score),
					status: { index: xy[0] as FileStatus, worktree: xy[1] as FileStatus },
					submoduleState: {
						type: ns === 'N' ? 'normal' : 'submodule',
						didCommitChange: c === 'C',
						hasTrackedChanges: m === 'M',
						hasUntrackedChanges: u === 'U'
					} as SubmoduleState
				});
				continue;
			}
			match = ordinaryStatusRegex().exec(line);
			if (match) {
				const [, xy, ns, c, m, u, mH, mI, mW, hH, hI, path] = match;
				status.changes.push({
					type: 'normal',
					headName: hH,
					indexName: hI,
					modeHead: parseInt(mH, 8),
					modeIndex: parseInt(mI, 8),
					modeWorktree: parseInt(mW, 8),
					path: path,
					status: { index: xy[0] as FileStatus, worktree: xy[1] as FileStatus },
					submoduleState: {
						type: ns === 'N' ? 'normal' : 'submodule',
						didCommitChange: c === 'C',
						hasTrackedChanges: m === 'M',
						hasUntrackedChanges: u === 'U'
					} as SubmoduleState
				});
				continue;
			}
		}
		return status;
	}
}
