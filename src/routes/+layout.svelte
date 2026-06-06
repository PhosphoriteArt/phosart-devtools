<script lang="ts" module>
	let patchFetch: (psk: string) => void = () => {};
	let numFetchesInFlight = $state(0);

	if (typeof window !== 'undefined') {
		const origFetch: typeof fetch = window.fetch;

		patchFetch = (psk: string) => {
			window.fetch = async function (
				...args: Parameters<typeof window.fetch>
			): ReturnType<typeof window.fetch> {
				let skipIncrement = false;

				if ((args[1]?.headers as Record<string, string>)?.['skip-increment']) {
					delete (args[1]!.headers as Record<string, string>)['skip-increment'];
					skipIncrement = true;
				}

				if (!skipIncrement) {
					numFetchesInFlight += 1;
				}
				try {
					return await origFetch(args[0], {
						...(args[1] ?? 0),
						headers: {
							...(args[1]?.headers ?? {}),
							authorization: `psk ${psk}`
						}
					});
				} finally {
					if (!skipIncrement) {
						numFetchesInFlight -= 1;
					}
				}
			};
		};
	}
</script>

<script lang="ts">
	import './layout.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import favicon from '$lib/assets/favicon.svg';
	import NavLink from '$lib/nav/NavLink.svelte';
	import { createSharedEpoch } from '$lib/epoch.svelte';
	import { createSharedGalleryOverrides } from '$lib/galleryoverride.svelte';
	import { onMount, untrack } from 'svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import type { LogObj } from '$lib/log';
	import LogLine, { logAsArray } from '$lib/log/LogLine.svelte';
	import { isEqual } from 'es-toolkit';
	import Circle from '$lib/ext/Circle.svelte';
	import { Circle as BigCircle } from 'svelte-loading-spinners';
	import { navigating } from '$app/state';
	import { resolve } from '$app/paths';
	import type { StatusResult } from 'simple-git';
	import { setNavbarOpen } from '$lib/navbarstate.svelte.js';
	import ActionButton from '$lib/ActionButton.svelte';
	import { invalidateAll } from '$app/navigation';
	import {
		CircleAlertIcon,
		CircleCheck,
		CircleQuestionMarkIcon,
		CircleX,
		DownloadIcon,
		EllipsisIcon,
		EyeIcon,
		HourglassIcon,
		LaptopMinimalCheck,
		Moon,
		Sun,
		TimerIcon,
		WrenchIcon
	} from '@lucide/svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import Modal from '$lib/Modal.svelte';
	import { Spinner } from '@phosart/common';
	import TextBox from '$lib/form/TextBox.svelte';
	import type { DeploySettings } from './api/deploy/config/util';
	import type { RawGallery } from '@phosart/common/util';

	let { children, data } = $props();

	$effect.pre(() => {
		if (data.psk) {
			patchFetch(data.psk);
		}
	});

	let isOnboardingZip = $state(false);
	let newOrigin = $state('');

	let isOnboarding = $state(false);
	let onboardSelection = $state('automatic');
	$effect(() => {
		untrack(() => {
			if (window.localStorage.getItem('onboarding-done')) {
				return;
			}

			if (data.shouldOnboard) {
				isOnboarding = true;
			}
		});
	});

	let sidebarOpen = $state({ open: true });
	setNavbarOpen(sidebarOpen);

	let showPreview = $state(false);
	let commitMessage = $state('');

	let logs: LogObj[] = $state([]);
	let statusBar: HTMLDivElement | null = $state(null);
	let isHoveringStatusBar = $state(false);
	let isServerImageProcessing = $state(false);
	let gitStatus: StatusResult | null = $state(null);
	let runCloudflareOnboard = $state(false);
	let isCloudflareLoggedIn = $state<Promise<boolean> | null>(null);
	interface CloudflareProject {
		'Project Name': string;
		'Project Domains': string;
		'Git Provider': string;
		'Last Modified': string;
	}
	let cfProjects = $state<Promise<CloudflareProject[]> | null>();
	let newProjectName = $state('');
	let createProjectError = $state('');

	async function setupCloudflareOnboard() {
		isCloudflareLoggedIn = fetch(resolve('/api/deploy/cloudflare/whoami')).then((res) => {
			return res.status === 200;
		});
		cfProjects = fetch(resolve('/api/deploy/cloudflare/projects')).then((res) => {
			return res.json();
		});

		runCloudflareOnboard = true;
	}

	let themeMode = $state<string | null>(null);
	$effect(() => {
		untrack(() => {
			themeMode = window.localStorage.getItem('theme-preference') ?? 'system';
		});
	});

	$effect(() => {
		if (themeMode) {
			window.localStorage.setItem('theme-preference', themeMode);
			if (themeMode === 'system') {
				document.querySelector('html')!.dataset['mode'] = window.matchMedia(
					'(prefers-color-scheme: dark)'
				).matches
					? 'dark'
					: 'light';
			} else {
				document.querySelector('html')!.dataset['mode'] = themeMode;
			}
		}
	});

	const isServerDoingWork = $derived.by(() => {
		const lastLog = logs[logs.length - 1] ?? null;
		const lastLogAsArray = logAsArray(lastLog);
		const lastLogElement =
			lastLogAsArray && (lastLogAsArray.length ?? 0) > 0
				? lastLogAsArray[lastLogAsArray.length - 1]
				: null;

		if (typeof lastLogElement === 'string') {
			return lastLogElement.endsWith('...');
		}
		return false;
	});

	createSharedEpoch();
	createSharedGalleryOverrides();

	type DeployStatus = Array<{
		step: string;
		status: 'waiting' | 'working' | 'completed' | 'error' | 'cancelled';
		details: string;
		error: string | null;
	}>;

	type DeploySteps = Array<{
		step: string;
		run: (updateDetails: (details: string) => void) => Promise<void>;
	}>;

	let deployTitle = $state<string | null>(null);
	let deployStatus = $state<DeployStatus | null>(null);

	async function fetchEnsureSuccess(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
		const ret = await fetch(...args);
		if (ret.status >= 400) {
			let errTxt = await ret.text();
			try {
				const errJson = JSON.parse(errTxt);
				if (typeof errJson.error === 'string') {
					errTxt = errJson.error;
				} else if (typeof errJson.message === 'string') {
					errTxt = errJson.message;
				}
			} catch {
				// ignore
			}

			throw new Error(String(ret.status) + ': ' + errTxt);
		}
		return ret;
	}

	async function runDeploy(steps: DeploySteps, title: string | null = null): Promise<void> {
		deployTitle = title;
		let status: DeployStatus = steps.map((s) => ({
			step: s.step,
			status: 'waiting',
			details: '',
			error: null
		}));

		function _update() {
			deployStatus = status.map((s) => ({ ...s }));
		}

		_update();

		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			try {
				status[i].status = 'working';
				_update();
				await step.run((det) => {
					status[i].details = det;
					_update();
				});
				status[i].status = 'completed';
				_update();
			} catch (e) {
				status[i].error = String(e);
				status[i].status = 'error';
				for (i += 1; i < steps.length; i++) {
					status[i].status = 'cancelled';
				}
				_update();
				break;
			}
		}
	}

	async function fetchStatus(): Promise<StatusResult | null> {
		try {
			const res = await fetch(resolve('/api/git/status'), {
				headers: { 'skip-increment': 'true' }
			});
			return await res.json();
		} catch {
			return null;
		}
	}

	onMount(() => {
		async function fetchIsWorking(): Promise<boolean> {
			try {
				const res = await fetch(resolve('/api/reload/working'), {
					headers: { 'skip-increment': 'true' }
				});
				return (await res.json()).working;
			} catch {
				return false;
			}
		}

		let isWorkingHandle: ReturnType<typeof setTimeout> | null = null;

		function periodicallyFetchIsWorking(timeout: number) {
			isWorkingHandle = setTimeout(async () => {
				isServerImageProcessing = await fetchIsWorking();

				if (isWorkingHandle != null) {
					periodicallyFetchIsWorking(timeout);
				}
			}, timeout);
		}

		periodicallyFetchIsWorking(250);

		async function fetchLogs(): Promise<LogObj[] | null> {
			try {
				const res = await fetch(resolve('/api/logs/recent'), {
					headers: { 'skip-increment': 'true' }
				});
				return await res.json();
			} catch {
				return null;
			}
		}

		let logsHandle: ReturnType<typeof setTimeout> | null = null;

		function periodicallyFetchLogs(timeout: number) {
			logsHandle = setTimeout(async () => {
				const next = await fetchLogs();
				if (next && !isEqual(next, logs)) {
					logs = next;
				}
				if (logsHandle != null) {
					periodicallyFetchLogs(timeout);
				}
			}, timeout);
		}

		periodicallyFetchLogs(250);

		async function fetchStatus(): Promise<StatusResult | null> {
			try {
				const res = await fetch(resolve('/api/git/status'), {
					headers: { 'skip-increment': 'true' }
				});
				return await res.json();
			} catch {
				return null;
			}
		}

		let statusHandle: ReturnType<typeof setTimeout> | null = null;

		function periodicallyFetchGitStatus(timeout: number) {
			statusHandle = setTimeout(async () => {
				const next = await fetchStatus();
				if (next && !isEqual(next, gitStatus)) {
					gitStatus = next;
				}
				if (statusHandle != null) {
					periodicallyFetchGitStatus(timeout);
				}
			}, timeout);
		}

		periodicallyFetchGitStatus(15 * 1000);
		fetchStatus().then((s) => void (gitStatus = s));

		const hf = (ev: Event) => {
			if (statusBar?.contains(ev.target as Node)) {
				isHoveringStatusBar = true;
			} else {
				isHoveringStatusBar = false;
			}
		};

		window.addEventListener('mousemove', hf);

		return () => {
			window.removeEventListener('mousemove', hf);
			if (logsHandle) {
				const clearHandle = logsHandle;
				logsHandle = null;
				clearTimeout(clearHandle);
			}
			if (isWorkingHandle) {
				const clearHandle = isWorkingHandle;
				isWorkingHandle = null;
				clearTimeout(clearHandle);
			}
			if (statusHandle) {
				const clearHandle = statusHandle;
				statusHandle = null;
				clearTimeout(clearHandle);
			}
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if navigating.to}
	<div
		class="fixed top-0 left-0 z-40 flex w-screen items-center justify-center bg-[#0005]"
		style="height: calc(100vh - 1.25rem)"
	>
		<BigCircle color="#04F" />
	</div>
{/if}

{#snippet gitTooltip()}
	{#if gitStatus}
		<div class="flex flex-col">
			{#if (gitStatus.modified?.length ?? 0) > 0}
				<div class="text-yellow-600">
					{gitStatus.modified?.length ?? 0} file(s) modified
				</div>
			{/if}
			{#if (gitStatus.created?.length ?? 0) + (gitStatus.not_added?.length ?? 0) > 0}
				<div class="text-green-700">
					{(gitStatus.created?.length ?? 0) + (gitStatus.not_added?.length ?? 0)} file(s) added
				</div>
			{/if}
			{#if (gitStatus.deleted?.length ?? 0) > 0}
				<div class="text-red-700">
					{gitStatus.deleted?.length ?? 0} file(s) deleted
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

<div class="flex h-full w-full overflow-hidden">
	<div
		class="absolute top-0 bottom-0 flex w-50 max-w-50 min-w-50 flex-col items-center gap-1 bg-surface-300-700 py-8 inset-shadow-sm inset-shadow-surface-900 transition-transform"
		style="transform: translateX({sidebarOpen.open ? '0px' : '-200px'});"
	>
		<div class="grid grid-cols-1 gap-2">
			<NavLink href="/#stay">Galleries</NavLink>
			<NavLink href="/characters">Characters</NavLink>
			<NavLink href="/artists">Artists</NavLink>
			<NavLink href="/config">Config</NavLink>
		</div>

		<div class="grow"></div>

		<div class="flex w-full flex-col bg-surface-100-900 px-3 py-4">
			{#if data.gitAvailable}
				<div class="flex items-center justify-center gap-2 font-light">
					<span>Checkpoints (git)</span>
					<Tooltip>
						{#snippet tooltip()}
							<div class="max-w-64">
								<p>
									Allows you to "checkpoint" your project in a series of "commits"; you can save
									your progress and roll back to previous checkpoints if needed.
								</p>
								<p class="mt-2 text-xs">
									If you use <tt>git</tt> to deploy your project, what's deployed is your most recent
									checkpoint
								</p>
							</div>
						{/snippet}
						{#snippet children(attach)}
							<CircleQuestionMarkIcon size={16} {@attach attach} />
						{/snippet}
					</Tooltip>
				</div>

				{#if gitStatus}
					{@const hasChanges =
						gitStatus.modified.length +
							gitStatus.created.length +
							gitStatus.not_added.length +
							gitStatus.deleted.length >
						0}
					{#if hasChanges && true}
						<TextInput class="text-xs" label="Checkpoint Message" bind:value={commitMessage}
						></TextInput>
						<ActionButton
							disabled={!commitMessage ||
								(gitStatus?.conflicted.length ?? 0) > 0 ||
								gitStatus?.current === 'HEAD'}
							class="mb-2 {(gitStatus?.conflicted.length ?? 0) === 0 &&
							gitStatus?.current !== 'HEAD'
								? 'preset-tonal-primary'
								: 'preset-tonal-error'}"
							action={async () => {
								await fetch(resolve('/api/git/commit'), {
									method: 'POST',
									body: JSON.stringify({ message: commitMessage }),
									headers: {
										'Content-Type': 'application/json'
									}
								});
								commitMessage = '';
								gitStatus = await fetchStatus();
							}}
						>
							{#if (gitStatus?.conflicted.length ?? 0) > 0}
								Conflicts detected
							{:else if gitStatus?.current === 'HEAD'}
								Rebasing
							{:else}
								Commit
							{/if}
						</ActionButton>
						<Modal
							title="Changes"
							tooltip={gitTooltip}
							placement="right"
							class="preset-outlined-surface-600-400 btn-sm"
						>
							{#snippet buttonContent()}
								<div class="flex items-center justify-center gap-2">
									<div>Show Changed Files</div>
									{#if gitStatus}
										<div class="flex flex-col" style="line-height: 1; font-size: 6pt;">
											{#if (gitStatus.conflicted?.length ?? 0) > 0}
												<div class="text-error-500">
													! {gitStatus.conflicted?.length ?? 0}
												</div>
											{/if}
											{#if (gitStatus.modified?.length ?? 0) > 0}
												<div class="text-yellow-600">
													~{gitStatus.modified?.length ?? 0}
												</div>
											{/if}
											{#if (gitStatus.created?.length ?? 0) + (gitStatus.not_added?.length ?? 0) > 0}
												<div class="text-green-700">
													+{(gitStatus.created?.length ?? 0) + (gitStatus.not_added?.length ?? 0)}
												</div>
											{/if}
											{#if (gitStatus.deleted?.length ?? 0) > 0}
												<div class="text-red-700">
													-{gitStatus.deleted?.length ?? 0}
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/snippet}
							<div
								class="flex max-h-[75vh] w-full min-w-[50vw] flex-col gap-1 overflow-auto overflow-y-auto p-4 text-xs"
							>
								<ul class="ml-4 list-disc">
									{#each gitStatus.conflicted as file (file)}
										<li class="whitespace-nowrap text-error-500">
											Conflict {file}
										</li>
									{/each}
									{#each gitStatus.modified as file (file)}
										<li class="whitespace-nowrap">
											Modified {file}
										</li>
									{/each}
									{#each gitStatus.created as file (file)}
										<li class="whitespace-nowrap">
											Added {file}
										</li>
									{/each}
									{#each gitStatus.not_added as file (file)}
										<li class="whitespace-nowrap">
											Added {file}
										</li>
									{/each}
									{#each gitStatus.deleted as file (file)}
										<li class="whitespace-nowrap">
											Deleted {file}
										</li>
									{/each}
								</ul>
							</div>
						</Modal>
					{:else}
						<div class="text-center text-xs italic">No changes</div>
					{/if}
				{/if}
			{:else}
				<div class="flex items-center justify-center text-center italic">
					<div>Git Unavailable</div>
					<Modal
						title="Install Git"
						class="ml-2 btn-icon btn btn-icon-sm preset-outlined-surface-600-400"
					>
						{#snippet buttonContent()}
							<WrenchIcon size={12} />
						{/snippet}
						<div class="max-w-lg min-w-sm p-8 xl:max-w-xl xl:min-w-xl">
							<h2 class="h4">Looks like we can't find Git on your system.</h2>
							<p>
								<tt>git</tt> is required to use checkpoints or deploy to certain website hosts that require
								it.
							</p>
							{#if data.platform === 'darwin'}
								<p>On MacOS, the easiest way to get it is through the XCode Command Line Tools.</p>
								<p>
									You can view Apple's <a
										href="https://developer.apple.com/documentation/xcode/installing-the-command-line-tools/"
										rel="noreferrer noopener"
										target="_blank"
										class="underline"
									>
										Documentation
									</a>
									on this, or <ActionButton
										action={async () => {
											await runDeploy(
												[
													{
														step: 'Request XCode Command Line Tool installation',
														run: async () => {
															await fetchEnsureSuccess(resolve('/api/deps/install-xcode-tools'), {
																method: 'POST'
															});
														}
													}
												],
												'Triggering installation...'
											);
										}}>click here</ActionButton
									> to automatically trigger installation (you'll see a pop-up asking you to install it)
								</p>
							{:else if data.platform === 'win32'}
								<p>
									On Windows, you can download an installer from
									<a
										href="https://git-scm.com/install/windows"
										rel="noreferrer noopener"
										target="_blank"
										class="underline"
									>
										git's website
									</a>
									and install it directly. Make sure you check the option to make
									<strong><tt>git</tt> utilities</strong> available in your system PATH; it should be
									selected by default.
								</p>
							{:else}
								<p>
									On Linux, you should be able to easily acquire <tt>git</tt> via your system package
									manager.
								</p>
							{/if}
							<p>When complete, you'll need to restart the editor.</p>
						</div>
					</Modal>
				</div>
			{/if}
			<div class="mt-4 mb-2 w-full border-b border-b-surface-600-400"></div>

			<div class="mb-2 flex items-center justify-center gap-2 font-light">
				<span>Deployment</span>
			</div>
			<div class="flex items-center justify-around">
				{#snippet gitPush(small: boolean, close?: () => void)}
					<ActionButton
						placement="right"
						tooltip={(gitStatus?.ahead ?? 0) == 0 && (gitStatus?.behind ?? 0) == 0
							? 'Nothing to push'
							: (gitStatus?.conflicted.length ?? 0) > 0
								? 'Conflicts present'
								: gitStatus?.current === 'HEAD'
									? 'Detached head'
									: ''}
						disabled={((gitStatus?.ahead ?? 0) == 0 && (gitStatus?.behind ?? 0) == 0) ||
							(gitStatus?.conflicted.length ?? 0) > 0 ||
							gitStatus?.current === 'HEAD'}
						class="bg-gray-950 {small ? 'btn-sm' : ''} text-white"
						action={async () => {
							await runDeploy([
								...((gitStatus?.behind ?? 0) > 0
									? [
											{
												step: 'git pull',
												run: async () => {
													await fetchEnsureSuccess(resolve('/api/git/pull'), { method: 'POST' });
												}
											}
										]
									: []),
								...((gitStatus?.ahead ?? 0) > 0
									? [
											{
												step: 'git push',
												run: async () => {
													await fetchEnsureSuccess(resolve('/api/git/push'), { method: 'POST' });
												}
											}
										]
									: []),
								{
									step: 'Update Status',
									run: async () => {
										gitStatus = await fetchStatus();
										await fetch(resolve('/api/deploy/config'), {
											body: JSON.stringify({
												...data.deploySettings,
												last_used: 'Git'
											} satisfies DeploySettings),
											headers: { 'Content-Type': 'application/json' },
											method: 'PUT'
										});
										await invalidateAll();
									}
								}
							]);
							close?.();
						}}
					>
						<i class="fa-brands fa-github"></i>
						Git {(gitStatus?.behind ?? 0) === 0 ? 'Push' : 'Sync'}
					</ActionButton>
				{/snippet}
				{#snippet dlZip(small: boolean, close?: () => void)}
					<ActionButton
						class="preset-tonal-primary {small ? 'btn-sm' : ''}"
						action={async () => {
							if (data.deploySettings.zip_origin === undefined) {
								isOnboardingZip = true;
								return;
							}
							await runDeploy([
								{
									step: 'Build',
									run: async () => {
										await fetchEnsureSuccess(resolve('/api/deploy/build'), { method: 'POST' });
									}
								},
								{
									step: 'Download Zip',
									run: async () => {
										const res = await fetchEnsureSuccess(resolve('/api/deploy/zip'), {
											method: 'POST'
										});
										const url = URL.createObjectURL(await res.blob());
										const a = document.createElement('a');
										a.download = 'build.zip';
										a.href = url;
										a.style.visibility = 'hidden';
										document.body.appendChild(a);
										a.click();
										a.remove();
									}
								},
								{
									step: 'Update Status',
									run: async () => {
										await fetch(resolve('/api/deploy/config'), {
											body: JSON.stringify({
												...data.deploySettings,
												last_used: 'ZIP'
											} satisfies DeploySettings),
											headers: { 'Content-Type': 'application/json' },
											method: 'PUT'
										});
										await invalidateAll();
									}
								}
							]);
							close?.();
						}}
					>
						<DownloadIcon size={16} />
						Site ZIP
					</ActionButton>
				{/snippet}
				{#snippet deployCf(small: boolean, close?: () => void)}
					<ActionButton
						class="bg-orange-800 {small ? 'btn-sm' : ''} text-white"
						action={async () => {
							if (!data.deploySettings.cloudflare_project_name) {
								setupCloudflareOnboard();
							} else {
								let origin: string | null = null;
								await runDeploy([
									{
										step: 'Ensure Logged In',
										run: async () => {
											const res = await fetch(resolve('/api/deploy/cloudflare/whoami'));
											if (res.status === 403) {
												setupCloudflareOnboard();
												throw new Error('CloudFlare is not currently logged in');
											}
										}
									},
									{
										step: 'Get project origin',
										run: async (setDetail) => {
											const projs: CloudflareProject[] = await (
												await fetch(resolve('/api/deploy/cloudflare/projects'))
											).json();
											const proj = projs.find(
												(p) => p['Project Name'] === data.deploySettings.cloudflare_project_name
											);
											if (!proj) {
												setDetail('project not found');
											} else {
												setDetail('project found, using origin: ' + proj['Project Domains']);
												origin = 'https://' + proj['Project Domains'];
											}
										}
									},
									{
										step: 'Build project',
										run: async () => {
											await fetchEnsureSuccess(resolve('/api/deploy/build'), {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({ origin })
											});
										}
									},
									{
										step: 'Deploy project',
										run: async () => {
											await fetchEnsureSuccess(resolve('/api/deploy/cloudflare/deploy'), {
												method: 'POST'
											});
										}
									}
								]);
								close?.();
							}
						}}
					>
						<i class="fa-brands fa-cloudflare"></i>
						CloudFlare
					</ActionButton>
				{/snippet}
				{#if (!data.deploySettings.last_used && data.gitAvailable) || data.deploySettings.last_used === 'Git'}
					{@render gitPush(true)}
				{:else if data.deploySettings.last_used === 'CloudFlare'}
					{@render deployCf(true)}
				{:else}
					{@render dlZip(true)}
				{/if}
				<Modal title="Other Deployment Options" class="btn-icon preset-outlined">
					{#snippet buttonContent()}
						<EllipsisIcon />
					{/snippet}
					{#snippet children(close)}
						<div class="flex flex-col items-stretch justify-center">
							{@render deployCf(false, close)}
							{@render gitPush(false, close)}
							{@render dlZip(false, close)}
						</div>
					{/snippet}
				</Modal>
			</div>
		</div>

		<div class="grow"></div>

		<div class="flex flex-row-reverse items-center gap-2">
			<Tooltip tooltip="Reload / Regenerate">
				{#snippet children(attach)}
					<div {@attach attach}>
						{#snippet loadingContent()}
							<i
								class="fa-solid fa-arrow-rotate-right animate-[spin_300ms_linear_infinite] text-primary-contrast-500"
							></i>
						{/snippet}
						<ActionButton
							action={async () => {
								await fetch(resolve('/api/reload'), { method: 'POST' });
								await invalidateAll();
							}}
							{loadingContent}
							class="btn-icon preset-filled-surface-700-300"
						>
							{#if isServerImageProcessing}
								{@render loadingContent()}
							{:else}
								<i class="fa-solid fa-arrow-rotate-right text-primary-contrast-50"></i>
							{/if}
						</ActionButton>
					</div>
				{/snippet}
			</Tooltip>

			<div class="btn-group flex items-center preset-outlined-surface-600-400 p-1 text-xs">
				<button
					onclick={() => {
						themeMode = 'system';
					}}
					class="btn-icon btn btn-icon-sm"
					class:preset-tonal-surface={themeMode === 'system'}
				>
					<LaptopMinimalCheck />
				</button>
				<button
					onclick={() => {
						themeMode = 'dark';
					}}
					class="btn-icon btn btn-icon-sm"
					class:preset-tonal-surface={themeMode === 'dark'}
				>
					<Moon />
				</button>
				<button
					onclick={() => {
						themeMode = 'light';
					}}
					class="btn-icon btn btn-icon-sm"
					class:preset-tonal-surface={themeMode === 'light'}
				>
					<Sun />
				</button>
			</div>
		</div>
		<div class="text-xs text-surface-700-300">© phosphoriteart {new Date().getFullYear()}</div>
	</div>
	<div class="transition-all" style="min-width: {sidebarOpen.open ? '200px' : '0px'};"></div>
	<div class="flex grow flex-col" style="min-width: min(100vw, 500px);">
		{@render children?.()}

		<div
			bind:this={statusBar}
			class="no-scrollbar h-5 max-h-5 min-h-5 w-full max-w-full overflow-scroll border-t-surface-500 bg-surface-100-900 text-[8pt] hover:h-32 hover:max-h-32 hover:min-h-32"
		>
			{#each logs as log, i (log)}
				<LogLine
					{log}
					isLatest={i === logs.length - 1}
					parent={statusBar}
					disableScroll={isHoveringStatusBar}
				/>
			{/each}
			{#if numFetchesInFlight > 0 || isServerDoingWork}
				<div class="fixed right-0 bottom-0 flex h-4.75 items-end justify-center pb-0.5">
					<Circle size={16} color="#04F" duration="0.4s" />
				</div>
			{/if}
		</div>
	</div>
</div>

{#if data.previewPort}
	<Tooltip tooltip="Preview Website">
		{#snippet children(attach)}
			<div class="fixed bottom-8 left-4 z-110" {@attach attach}>
				<button
					onclick={() => void (showPreview = !showPreview)}
					title="Open/close Preview"
					class="btn flex btn-icon-sm h-8 w-8 cursor-pointer items-center justify-center preset-tonal"
				>
					<EyeIcon size={16} />
				</button>
			</div>
		{/snippet}
	</Tooltip>

	{#if showPreview}
		<Tooltip tooltip="Open Website">
			{#snippet children(attach)}
				<div class="fixed right-16 bottom-8 z-110" {@attach attach}>
					<a
						href="http://localhost:{data.previewPort}"
						target="_blank"
						title="Open website"
						class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-white hover:bg-gray-300 active:bg-gray-600"
					>
						<i class="fa-solid fa-arrow-up-right-from-square"></i>
					</a>
				</div>
			{/snippet}
		</Tooltip>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class:hidden={!showPreview}
			tabindex="-1"
			role="figure"
			class="fixed top-0 right-0 bottom-0 left-0 z-100 bg-[#777A]"
			onclick={(e) => {
				if (e.target === e.currentTarget) {
					showPreview = false;
				}
			}}
		>
			<div class="fixed top-20 right-20 bottom-20 left-20 overflow-hidden rounded-4xl bg-white">
				<iframe title="preview" class="h-full w-full" src="http://localhost:{data.previewPort}"
				></iframe>
			</div>
		</div>
	{/if}
{/if}

<Modal headless open={deployStatus !== null} title={deployTitle ?? 'Deploying...'} captive>
	{#if deployStatus}
		{@const complete = deployStatus.every((s) => s.status !== 'working')}
		<Spinner loading={!complete} />
		<div class="flex min-w-80 flex-col gap-2 p-4">
			{#each deployStatus as step, i (i)}
				<div class="flex items-center gap-2">
					<div>
						{#if step.status === 'waiting'}
							<TimerIcon />
						{/if}
						{#if step.status === 'working'}
							<div class="animate-pulse">
								<HourglassIcon />
							</div>
						{/if}
						{#if step.status === 'completed'}
							<CircleCheck class="fill-success-300-700" />
						{/if}
						{#if step.status === 'cancelled'}
							<CircleX />
						{/if}
						{#if step.status === 'error'}
							<CircleX class="fill-error-500" />
						{/if}
					</div>
					<div class="flex flex-col">
						<div>
							{step.step}
							{#if step.details}
								({step.details})
							{/if}
						</div>
						{#if step.error}
							<div>
								<TextBox disabled value={step.error} label="Error Details" />
							</div>
						{/if}
					</div>
				</div>
			{/each}
			{#if complete}
				<button class="btn preset-tonal-success" onclick={() => void (deployStatus = null)}>
					Close
				</button>
			{/if}
		</div>
	{/if}
</Modal>

<Modal
	headless
	open={runCloudflareOnboard}
	title="Cloudflare Setup"
	onClose={() => {
		runCloudflareOnboard = false;
		newProjectName = '';
	}}
>
	{#snippet children(close)}
		<div class="min-w-lg p-4">
			<p>
				In order to deploy to CloudFlare, we'll need to make sure you're logged in, then select a
				project to deploy to.
			</p>
			<p>
				By default, your project will be available at <tt>&lt;project-name&gt;.pages.dev</tt>.
			</p>
			{#await isCloudflareLoggedIn}
				<Spinner loading />
				<div class="my-4 flex items-center gap-2">
					<HourglassIcon class="animate-pulse" />
					<div>Loading login status...</div>
				</div>
			{:then isLoggedIn}
				{#if isLoggedIn === false}
					<div class="my-4 flex items-center gap-2">
						<div>
							<CircleAlertIcon class="fill-warning-300-700" />
						</div>
						<p>
							Click <ActionButton
								class="preset-tonal-warning btn-sm"
								action={async () => {
									await fetch(resolve('/api/deploy/cloudflare/whoami'), { method: 'POST' });
									await setupCloudflareOnboard();
								}}
							>
								here
							</ActionButton> to log into CloudFlare. A new browser window will open.
						</p>
					</div>
				{:else}
					<div class="my-4 flex items-center gap-2">
						<div>
							<CircleCheck class="fill-success-300-700" />
						</div>
						<p>Logged in!</p>
					</div>

					{#if !data.deploySettings.cloudflare_project_name}
						<p>You also need to set up a Cloudflare Project to host your website.</p>
						<div>
							{#await cfProjects}
								<Spinner loading />
								<div class="my-4 flex items-center gap-2">
									<HourglassIcon class="animate-pulse" />
									<div>Loading project list...</div>
								</div>
							{:then projs}
								<p>You can use an existing project...</p>

								<ol class="list-disc pl-8">
									{#each projs as proj (proj['Project Name'])}
										<li>
											<ActionButton
												action={async () => {
													await fetch(resolve('/api/deploy/config'), {
														body: JSON.stringify({
															...data.deploySettings,
															last_used: 'CloudFlare',
															cloudflare_project_name: proj['Project Name']
														} satisfies DeploySettings),
														headers: { 'Content-Type': 'application/json' },
														method: 'PUT'
													});
													await invalidateAll();
												}}
												unstyled
												class="btn preset-outlined-surface-600-400 btn-sm text-sm"
											>
												Use {proj['Project Name']} (@ {proj['Project Domains']})
											</ActionButton>
										</li>
									{/each}
								</ol>

								<div class="mt-2">or, you can create a new project:</div>
								<div class="flex items-center">
									<TextInput label="Project Name" bind:value={newProjectName} />
									<ActionButton
										action={async () => {
											try {
												await fetchEnsureSuccess(resolve('/api/deploy/cloudflare/projects'), {
													method: 'POST',
													body: JSON.stringify({ project_name: newProjectName }),
													headers: { 'Content-Type': 'application/json' }
												});
											} catch (e) {
												createProjectError = String(e);
												return;
											}
											await fetch(resolve('/api/deploy/config'), {
												body: JSON.stringify({
													...data.deploySettings,
													last_used: 'CloudFlare',
													cloudflare_project_name: newProjectName
												} satisfies DeploySettings),
												headers: { 'Content-Type': 'application/json' },
												method: 'PUT'
											});
											await invalidateAll();
										}}
									>
										Create
									</ActionButton>
									{#if createProjectError}
										<div class="ml-4 text-error-600-400">
											{createProjectError}
										</div>
									{/if}
								</div>
							{/await}
						</div>
					{:else}
						<div class="my-4 flex items-center gap-2">
							<div>
								<CircleCheck class="fill-success-300-700" />
							</div>
							<p>Using project {data.deploySettings.cloudflare_project_name}!</p>
						</div>

						<ActionButton
							class="preset-tonal-success"
							action={async () => {
								close();
							}}>Close</ActionButton
						>
					{/if}
				{/if}
			{/await}
		</div>
	{/snippet}
</Modal>

<Modal headless open={isOnboarding} title="Welcome!">
	{#snippet children(close)}
		<div class="min-w-xl p-4">
			<h4 class="mb-4 h4">Welcome to @phosart/devtool!</h4>

			<p>Choose your preference:</p>

			<form class="flex flex-col space-y-2">
				<label class="flex items-center space-x-2">
					<input
						class="radio"
						type="radio"
						checked
						bind:group={onboardSelection}
						name="experience"
						value="automatic"
					/>
					<div
						class="m-2 max-w-md cursor-pointer rounded-2xl border border-surface-600-400 p-2 hover:bg-surface-100-900"
					>
						<div class="mb-2 text-xl font-extralight italic">Automatic Categories</div>
						<div>As you upload your work, you may:</div>
						<ol class="ml-4 list-disc text-primary-900-100">
							<li>Organize art by tags</li>
							<li>Organize art by characters featured</li>
							<li>Organize art by the creating artists</li>
						</ol>
						<div>And we'll automatically take care of creating categories for all of these</div>
					</div>
				</label>
				<label class="flex items-center space-x-2">
					<input
						class="radio"
						type="radio"
						bind:group={onboardSelection}
						name="experience"
						value="manual"
					/>
					<div
						class="m-2 max-w-md cursor-pointer rounded-2xl border border-surface-600-400 p-2 hover:bg-surface-100-900"
					>
						<div class="mb-2 text-xl font-extralight italic">Multigallery</div>
						<div>All of the above, and:</div>
						<ol class="ml-4 list-disc text-primary-900-100">
							<li>You can further organize your art into your own Galleries</li>
							<li>
								The automatic categorization above will automatically work across all galleries
							</li>
						</ol>
					</div>
				</label>
			</form>

			<div class="flex justify-end">
				<ActionButton
					class="btn preset-tonal-primary"
					action={async () => {
						window.localStorage.setItem('onboarding-done', 'true');
						if (onboardSelection === 'manual') {
							window.localStorage.setItem('prefers-multigallery', 'true');
						} else {
							await fetch(
								resolve('/api/gallery/[...gallerypath]/save', {
									gallerypath: 'main.gallery'
								}),
								{
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ pieces: [] } satisfies RawGallery)
								}
							);
							await invalidateAll();
						}
						close();
					}}
				>
					Continue
				</ActionButton>
			</div>
		</div>
	{/snippet}
</Modal>

<Modal
	headless
	open={isOnboardingZip}
	title="Zip Download Setup"
	onClose={() => {
		isOnboardingZip = false;
		newOrigin = '';
	}}
>
	{#snippet children(close)}
		<div class="min-w-lg p-4">
			<p>
				On order to enable rich embeds (e.g. in Discord, Telegram, iMessage, etc), we need to know
				where you'll be uploading your static website.
			</p>
			<p>If you'd prefer to skip this step, you may (but rich embeds won't work!)</p>
			{#if data.deploySettings.zip_origin === undefined}
				<div class="my-4 flex items-center gap-2">
					<div>
						<CircleAlertIcon class="fill-warning-300-700" />
					</div>
					<p>No origin specified</p>
				</div>

				<TextInput label="Origin" bind:value={newOrigin} />

				<ActionButton
					class="mr-2 preset-tonal-success"
					action={async () => {
						await fetch(resolve('/api/deploy/config'), {
							body: JSON.stringify({
								...data.deploySettings,
								last_used: 'ZIP',
								zip_origin: newOrigin
							} satisfies DeploySettings),
							headers: { 'Content-Type': 'application/json' },
							method: 'PUT'
						});
						await invalidateAll();
					}}
				>
					Save
				</ActionButton>
				<ActionButton
					class="preset-tonal-warning"
					action={async () => {
						await fetch(resolve('/api/deploy/config'), {
							body: JSON.stringify({
								...data.deploySettings,
								last_used: 'ZIP',
								zip_origin: null
							} satisfies DeploySettings),
							headers: { 'Content-Type': 'application/json' },
							method: 'PUT'
						});
						await invalidateAll();
					}}
				>
					Skip
				</ActionButton>
			{:else}
				<div class="my-4 flex items-center gap-2">
					<div>
						{#if data.deploySettings.zip_origin === null}
							<CircleAlertIcon class="fill-success-300-700" />
						{:else}
							<CircleCheck class="fill-success-300-700" />
						{/if}
					</div>
					{#if data.deploySettings.zip_origin === null}
						<p>Skipped setting origin</p>
					{:else}
						<p>Using origin {data.deploySettings.zip_origin}!</p>
					{/if}
				</div>

				<ActionButton
					class="mr-2 preset-tonal-success"
					action={async () => {
						close();
					}}
				>
					Close
				</ActionButton>
				<ActionButton
					class="preset-tonal-tertiary"
					action={async () => {
						await fetch(resolve('/api/deploy/config'), {
							body: JSON.stringify({
								...data.deploySettings,
								last_used: 'ZIP',
								zip_origin: '_clear'
							} satisfies DeploySettings),
							headers: { 'Content-Type': 'application/json' },
							method: 'PUT'
						});
						await invalidateAll();
					}}
				>
					Change Origin
				</ActionButton>
			{/if}
		</div>
	{/snippet}
</Modal>
