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
	import ActionButton from '$lib/ActionButton.svelte';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { children, data } = $props();

	let showPreview = $state(false);

	let logs: LogObj[] = $state([]);
	let statusBar: HTMLDivElement | null = $state(null);
	let isHoveringStatusBar = $state(false);
	let numFetchesInFlight = $state(0);
	let isServerImageProcessing = $state(false);

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
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	bind:this={statusBar}
	class="fixed bottom-0 z-50 no-scrollbar h-5 w-screen overflow-scroll border-t bg-white text-[8pt] hover:h-32"
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

{#if navigating.to}
	<div
		class="fixed top-0 left-0 z-40 flex w-screen items-center justify-center bg-[#0005]"
		style="height: calc(100vh - 1.25rem)"
	>
		<BigCircle color="#04F" />
	</div>
{/if}

<div class="flex w-full justify-center pt-4 pb-8">
	<div class="container">
		<div
			class="relative flex min-h-10 w-full items-center justify-center rounded-xl bg-gray-100 py-2 select-none"
		>
			<NavLink href="/#stay">Galleries</NavLink>
			<NavLink href="/characters">Characters</NavLink>
			<NavLink href="/artists">Artists</NavLink>
			<NavLink href="/config">Config</NavLink>

			<Tooltip tooltip="Reload / Regenerate">
				{#snippet children(attach)}
					<div
						{@attach attach}
						class="absolute right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-gray-200 hover:bg-gray-300 active:bg-gray-400"
					>
						{#snippet loadingContent()}
							<i
								class="fa-solid fa-arrow-rotate-right animate-[spin_300ms_linear_infinite] text-gray-600"
							></i>
						{/snippet}
						<ActionButton
							action={async () => {
								await fetch(resolve('/api/reload'), { method: 'POST' });
								await invalidateAll();
							}}
							{loadingContent}
							class="[&&]:border-none [&&]:bg-gray-200 [&&]:shadow-none [&&]:hover:bg-gray-400"
						>
							{#if isServerImageProcessing}
								{@render loadingContent()}
							{:else}
								<i class="fa-solid fa-arrow-rotate-right text-gray-600"></i>
							{/if}
						</ActionButton>
					</div>
				{/snippet}
			</Tooltip>
		</div>

		{@render children()}
	</div>
</div>

{#if data.previewPort}
	<Tooltip tooltip="Preview Website">
		{#snippet children(attach)}
			<div class="fixed right-4 bottom-8 z-110" {@attach attach}>
				<button
					onclick={() => void (showPreview = !showPreview)}
					title="Open/close Preview"
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-white hover:bg-gray-300 active:bg-gray-600"
				>
					<i class="fa-regular fa-eye"></i>
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
