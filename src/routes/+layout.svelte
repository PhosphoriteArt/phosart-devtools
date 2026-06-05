<script lang="ts">
	import './layout.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';

	import favicon from '$lib/assets/favicon.svg';
	import NavLink from '$lib/nav/NavLink.svelte';
	import { createSharedEpoch } from '$lib/epoch.svelte';
	import { createSharedGalleryOverrides } from '$lib/galleryoverride.svelte';
	import { onMount } from 'svelte';
	import Tooltip from '$lib/Tooltip.svelte';
	import type { LogObj } from '$lib/log';
	import LogLine, { logAsArray } from '$lib/log/LogLine.svelte';
	import { isEqual } from 'es-toolkit';
	import Circle from '$lib/ext/Circle.svelte';
	import { Circle as BigCircle } from 'svelte-loading-spinners';
	import { navigating } from '$app/state';
	import { resolve } from '$app/paths';
	import type { GitStatus } from '$lib/server/gitops/git';
	import { setNavbarOpen } from '$lib/navbarstate.svelte.js';
	import ActionButton from '$lib/ActionButton.svelte';
	import { invalidateAll } from '$app/navigation';
	import { EyeIcon } from '@lucide/svelte';

	let { children, data } = $props();

	let sidebarOpen = $state({ open: true });
	setNavbarOpen(sidebarOpen);

	let showPreview = $state(false);

	let logs: LogObj[] = $state([]);
	let statusBar: HTMLDivElement | null = $state(null);
	let isHoveringStatusBar = $state(false);
	let numFetchesInFlight = $state(0);
	let isServerImageProcessing = $state(false);
	let gitStatus: GitStatus | null = $state(null);

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

	onMount(() => {
		const origFetch = window.fetch;
		window.fetch = async (...args: Parameters<typeof origFetch>): ReturnType<typeof origFetch> => {
			numFetchesInFlight += 1;
			const promise = origFetch(...args);
			try {
				return await promise;
			} finally {
				numFetchesInFlight -= 1;
			}
		};

		async function fetchIsWorking(): Promise<boolean> {
			try {
				const res = await origFetch(resolve('/api/reload/working'));
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
				const res = await origFetch(resolve('/api/logs/recent'));
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

		async function fetchStatus(): Promise<GitStatus | null> {
			try {
				const res = await origFetch(resolve('/api/git/status'));
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
			window.fetch = origFetch;
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

		<Tooltip tooltip="Git (coming soon)">
			{#snippet children(attach)}
				<div {@attach attach}>
					<ActionButton action={() => {}} disabled>
						<div class="flex items-center justify-center">
							<i class="fa-solid fa-code-branch text-gray-600"></i>
							<div class="flex flex-col" style="line-height: 1; font-size: 6pt;">
								{#if (gitStatus?.changes.filter((m) => m.type === 'normal' && m.status.index === 'M').length ?? 0) > 0}
									<div class="text-yellow-600">
										~{gitStatus?.changes.filter(
											(m) => m.type === 'normal' && m.status.index === 'M'
										).length ?? 0}
									</div>
								{/if}
								{#if (gitStatus?.changes.filter((m) => m.type === 'normal' && m.status.index === 'A').length ?? 0) > 0}
									<div class="text-green-700">
										+{gitStatus?.changes.filter(
											(m) => m.type === 'normal' && m.status.index === 'A'
										).length ?? 0}
									</div>
								{/if}
								{#if (gitStatus?.changes.filter((m) => m.type === 'normal' && m.status.index === 'D').length ?? 0) > 0}
									<div class="text-red-700">
										-{gitStatus?.changes.filter(
											(m) => m.type === 'normal' && m.status.index === 'D'
										).length ?? 0}
									</div>
								{/if}
							</div>
						</div>
					</ActionButton>
				</div>
			{/snippet}
		</Tooltip>

		<div class="grow"></div>

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
