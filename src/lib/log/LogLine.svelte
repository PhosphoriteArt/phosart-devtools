<script lang="ts" module>
	function colorForLevel(level: string) {
		switch (level) {
			case 'SILLY':
				return 'text-gray-400';
			case 'DEBUG':
				return 'text-gray-700';
			case 'INFO':
				return 'text-blue-400';
			case 'WARN':
				return 'text-yellow-600';
			case 'ERROR':
				return 'text-red-500';
			default:
				return 'text-current';
		}
	}

	export function logAsArray(t: LogObj | null | undefined): [unknown, ...unknown[]] | null {
		if (!t) {
			return null;
		}
		const arr: unknown[] = [];
		let i = 0;
		while (t[i]) {
			arr.push(t[i]);
			i++;
		}
		if (arr.length === 0) {
			return null;
		}
		return arr as [unknown, ...unknown[]];
	}
</script>

<script lang="ts">
	import type { LogObj } from '$lib/util';
	import { Diamonds } from 'svelte-loading-spinners';

	const {
		log,
		isLatest,
		parent,
		disableScroll
	}: {
		log?: LogObj | null | undefined;
		isLatest: boolean;
		parent?: HTMLElement;
		disableScroll?: boolean;
	} = $props();

	const level: string = $derived(log?._meta.logLevelName);
	const obj = $derived(logAsArray(log) ?? log);
	let lineEl: HTMLDivElement | null = $state(null);

	const isDoingWork = $derived(
		Array.isArray(obj) &&
			typeof obj[obj.length - 1] === 'string' &&
			(obj[obj.length - 1] as string).endsWith('...')
	);

	$effect(() => {
		if (isLatest && parent && lineEl && !disableScroll) {
			parent.scrollTo({
				behavior: 'smooth',
				top: lineEl.offsetTop - parent.clientHeight / 2 + parent.clientHeight / 2
			});
		}
	});
</script>

{#snippet element(el: unknown)}
	{#if typeof el === 'string'}
		<span>{el}</span>
	{:else if typeof el === 'number' || typeof el === 'bigint'}
		<span class="text-purple-700">{el}</span>
	{:else if typeof el === 'boolean'}
		<span class="text-orange-700">{el}</span>
	{:else}
		<pre class="text-gray-800">{JSON.stringify(el)}</pre>
	{/if}
{/snippet}

{#if obj}
	<div class="mx-2 my-0.5 flex items-start gap-x-1" bind:this={lineEl}>
		<div class="flex w-12 max-w-12 min-w-12 gap-x-1">
			<div class="font-bold {colorForLevel(level)}">{level}</div>
			{#if isDoingWork && isLatest}
				<div class="flex items-center justify-center">
					<Diamonds size="16" pause={!isLatest} />
				</div>
			{/if}
		</div>
		<div class="flex grow flex-wrap gap-x-1">
			{#if Array.isArray(obj)}
				{#each obj as el, i (i)}
					<div>
						{@render element(el)}
					</div>
				{/each}
			{:else}
				{#each Object.entries(obj).filter(([k]) => !k.startsWith('_')) as [k, v] (k)}
					<div>
						<div>{k}</div>
						<div>:</div>
						<div>
							{@render element(v)}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
