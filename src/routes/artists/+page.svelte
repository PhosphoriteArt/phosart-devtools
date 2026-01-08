<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Collapsable from '$lib/Collapsable.svelte';
	import SearchInput from '$lib/form/search/SearchInput.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import Modal from '$lib/Modal.svelte';
	import { onMount, tick } from 'svelte';
	import fz from 'fuzzysort';
	import { normalizeArtist } from '@phosart/common/util';
	import { addKey, arrAsObject } from '$lib/form/search/SearchResults.svelte';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	let artists = $state(data.artists);

	let shiftDown = $state(false);
	let loading = $state(false);
	let error: string | null = $state(null);

	let focusableInput: TextInput | null = $state(null);

	function renameKey<T>(
		obj: Record<string, T>,
		from: string,
		to: string,
		overwrite: boolean = false
	): Record<string, T> {
		if (to in obj && !overwrite) {
			return Object.assign({}, obj);
		}

		return Object.fromEntries(
			Object.entries(obj).map(([k, v]) => {
				if (k === from) {
					return [to, v];
				}
				return [k, v];
			})
		);
	}

	function promoteKey<T>(obj: Record<string, T>, key: string): Record<string, T> {
		if (!(key in obj)) {
			return Object.assign({}, obj);
		}

		return Object.fromEntries([
			[key, obj[key]],
			...Object.entries(obj).filter(([k]) => {
				return k !== key;
			})
		]);
	}

	onMount(() => {
		const f = (ev: KeyboardEvent) => {
			shiftDown = ev.shiftKey;
		};
		window.addEventListener('keydown', f);
		window.addEventListener('keyup', f);
		return () => {
			window.removeEventListener('keydown', f);
			window.removeEventListener('keyup', f);
		};
	});

	async function save() {
		loading = true;
		try {
			await fetch(resolve('/api/artists/save'), {
				method: 'POST',
				body: JSON.stringify(artists),
				headers: { 'Content-Type': 'application/json' }
			});
		} finally {
			loading = false;
			invalidateAll();
		}
	}

	const id = $props.id();
	let search = $state('');
	let selectedHandle: string | null = $state(null);

	const results = $derived.by(() => {
		if (!search) {
			return Object.entries(artists);
		}
		return fz
			.go(search, Object.entries(artists), {
				key: ([, v]) => v.name
			})
			.map((r) => r.obj);
	});

	const normalizedAll = $derived(normalizeArtist(Object.keys(artists), artists));
	const options = $derived(
		arrAsObject(
			addKey(normalizedAll, (na) => `@${na.info!.handle} (${na.info!.name})`),
			(s) => s.info!.handle
		)
	);
</script>

<svelte:head>
	<title>Artist Editor | Art Site Editor</title>
</svelte:head>

<div class="my-4 flex gap-x-2 rounded-2xl border border-dashed p-2">
	<label for="{id}-search-box">
		<i class="fa-solid fa-search"></i>
	</label>
	<div class="relative flex grow">
		<SearchInput
			id="{id}-search-box"
			autoFocus
			bind:search
			class="grow"
			noReportValidation
			acceptSuggestionOnEnter
			{options}
			onSelect={(k, artist) => {
				if (artist) {
					selectedHandle = k;
				}
			}}
		/>
	</div>
</div>

<button
	onclick={() => {
		artists[''] = { name: '', links: {}, type: 'Artist' };
		selectedHandle = '';
	}}
	class="my-4 w-full cursor-pointer rounded-2xl border p-3 hover:bg-gray-300 active:bg-gray-500"
>
	<i class="fa-solid fa-plus"></i>
	<span>Add Artist</span>
</button>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
	{#each results as [handle], i (`${i}-${results.length}`)}
		<Modal
			title="@{handle}"
			class="m-2 rounded-2xl border"
			overrideOnClick={() => {
				selectedHandle = handle;
			}}
		/>
	{/each}
</div>

{#if selectedHandle !== undefined && selectedHandle !== null && artists[selectedHandle]}
	{@const handle = selectedHandle}
	{@const artist = artists[selectedHandle]}
	<Modal
		headless
		title="@{handle}"
		class="m-2 rounded-2xl border"
		bind:open={
			() => true,
			(v) => {
				if (!v) {
					selectedHandle = null;
					search = '';
				}
			}
		}
	>
		{#snippet modalRight()}
			<div class="flex items-stretch gap-x-3 py-1">
				<div>
					<button
						onclick={(ev) => {
							if (!ev.shiftKey) return;
							delete artists[handle];

							save();
						}}
						class="w-40 rounded-2xl border p-3 text-center"
						class:hover:bg-gray-300={shiftDown}
						class:active:bg-gray-500={shiftDown}
						class:cursor-pointer={shiftDown}
						class:hover:font-bold={!shiftDown}
						class:cursor-not-allowed={!shiftDown}
						style="line-height: 1;"
					>
						<div>
							<i class="fa-solid fa-trash"></i>
							<span class="font-normal">Delete</span>
						</div>
						<div class="text-[8pt]">(requires shift-click)</div>
					</button>
				</div>
				<div>
					{#if !loading}
						<button
							onclick={() => void save()}
							class="h-full cursor-pointer rounded-2xl border p-3 hover:bg-gray-300 active:bg-gray-500"
						>
							<i class="fa-regular fa-save"></i>
							<span>Save</span>
						</button>
					{:else}
						<div class="h-full cursor-pointer rounded-2xl border p-3">Saving...</div>
					{/if}
					{#if error}
						<div class="h-full">ERROR: {error}</div>
					{/if}
				</div>
			</div>
		{/snippet}
		<div>
			<TextInput
				label="Handle"
				bind:value={
					() => handle,
					(v) => {
						if (!(v in artists)) {
							artists = renameKey(artists, handle, v);
							selectedHandle = v;
						}
					}
				}
			/>
			<TextInput label="Name" bind:value={artist.name} />
			<div>
				<pre>Links</pre>
				<div class="grid" style="grid-template-columns: 1fr 1fr auto auto;">
					{#each Object.keys(artist.links) as site, i (i)}
						<div class="flex w-full items-center">
							<TextInput
								placeholder="site"
								bind:this={
									() => null,
									(t) => {
										if (Object.keys(artist.links).length - 1 === i) {
											focusableInput = t;
										}
									}
								}
								bind:value={
									() => site,
									(v) => {
										artist.links = renameKey(artist.links, site, v, false);
									}
								}
								label=""
								icon="earth"
							/>
						</div>
						<div class="flex w-full items-end">
							<TextInput placeholder="url" bind:value={artist.links[site]} label="" icon="link" />
						</div>

						<button
							disabled={i === 0}
							class={i === 0
								? 'cursor-not-allowed text-gray-300'
								: 'cursor-pointer hover:bg-gray-200 active:bg-gray-500'}
							title="Promote"
							onclick={() => {
								artist.links = promoteKey(artist.links, site);
							}}
						>
							<i class="fa-regular fa-star"></i>
						</button>

						<button
							class="cursor-pointer hover:bg-gray-200 active:bg-gray-500"
							title="Delete"
							onclick={() => {
								delete artist.links[site];
							}}
						>
							<i class="fa-regular fa-circle-xmark"></i>
						</button>
					{/each}
					<button
						onclick={() => {
							artist.links = Object.fromEntries([...Object.entries(artist.links), ['', '']]);
							tick().then(() => {
								focusableInput?.focus();
							});
						}}
						class="justify-left relative col-span-4 m-2 flex items-center justify-center rounded-xl border p-2 hover:bg-gray-300 active:bg-gray-400"
					>
						<i class="fa-solid fa-plus"></i>
						<span>Add Link</span>
					</button>
				</div>
			</div>
			<div>
				<Collapsable title="Advanced" class="my-3">
					<Collapsable
						title="JSON"
						initial={false}
						class="mt-2 no-scrollbar overflow-scroll border-t border-gray-300 text-gray-400"
					>
						<pre class="text-gray-900">{JSON.stringify(artist, null, 4)}</pre>
					</Collapsable>
				</Collapsable>
			</div>
		</div>
	</Modal>
{/if}
