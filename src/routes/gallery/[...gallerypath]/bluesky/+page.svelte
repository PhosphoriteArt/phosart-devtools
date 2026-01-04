<script lang="ts">
	import { Circle } from 'svelte-loading-spinners';
	import BskyImporter from './BskyImporter.svelte';
	import type { PostWithMatch } from '$lib/server/bluesky/types.js';
	import { getEpoch } from '$lib/epoch.svelte';
	import { onMount } from 'svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import ActionButton from '$lib/ActionButton.svelte';
	const { data } = $props();

	let posts: PostWithMatch[] | null = $state(null);
	let err: unknown | null = $state(null);
	const epoch = getEpoch();
	let lastEpoch = epoch.epoch;

	async function sync() {
		try {
			posts = await fetch('/api/bluesky/sync?epoch=', {
				method: 'POST',
				body: JSON.stringify({
					bskyUsername: localStorage.getItem('bskyUsername'),
					bskyPassword: localStorage.getItem('bskyPassword')
				})
			})
				.then((res) => res.json())
				.then((res) => {
					if (res.message) {
						throw new Error(res.message);
					}
					return res;
				});
		} catch (e) {
			err = e;
		}
	}

	$effect(() => {
		if (posts && epoch.epoch && lastEpoch !== epoch.epoch) {
			lastEpoch = epoch.epoch;
			sync();
		}
	});

	onMount(() => {
		sync();
	});
</script>

<svelte:head>
	<title>Bluesky Import | {data.galleryPath} | Art Site Editor</title>
</svelte:head>

{#snippet spinner()}
	<div
		class="fixed top-0 left-0 z-40 flex w-screen items-center justify-center bg-[#0005]"
		style="height: calc(100vh - 1.25rem)"
	>
		<Circle color="#04F" />
	</div>
{/snippet}

{#snippet login()}
	<div class="flex flex-col items-center gap-y-3">
		<div>Bluesky Login Required</div>
		<TextInput
			label="Bluesky Username"
			bind:value={
				() =>
					typeof localStorage === 'undefined' ? '' : (localStorage.getItem('bskyUsername') ?? ''),
				(v) => {
					if (typeof localStorage !== 'undefined') {
						localStorage.setItem('bskyUsername', v);
					}
				}
			}
		></TextInput>
		<TextInput
			label="Password"
			password
			bind:value={
				() =>
					typeof localStorage === 'undefined' ? '' : (localStorage.getItem('bskyPassword') ?? ''),
				(v) => {
					if (typeof localStorage !== 'undefined') {
						localStorage.setItem('bskyPassword', v);
					}
				}
			}
		></TextInput>
		<div>
			(If you use 2FA, this needs to be an app password. Password will be saved in your browser.)
		</div>
		<ActionButton action={sync}>Login</ActionButton>
	</div>
{/snippet}

{#if !posts}
	{#if err}
		{#if !data.bskyAvailable}
			{@render login()}
		{:else}
			<div>Unknown error occurred: {err}</div>
		{/if}
	{:else}
		{@render spinner()}
	{/if}
{:else}
	<BskyImporter
		config={data.config}
		gallery={data.gallery}
		galleryPath={data.galleryPath}
		{posts}
		ss={data.ss}
	/>
{/if}
