<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Collapsable from '$lib/Collapsable.svelte';
	import TextInput from '$lib/form/TextInput.svelte';
	import Modal from '$lib/Modal.svelte';
	import { onMount, tick } from 'svelte';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	let artists = $state(data.artists);

	let shiftDown = $state(false);
	let loading = $state(false);
	let error: string | null = $state(null);

	let focusableInput: TextInput | null = $state(null);
	let newModal: Modal | null = $state(null);

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
			await fetch(`/api/artists/save`, {
				method: 'POST',
				body: JSON.stringify(artists),
				headers: { 'Content-Type': 'application/json' }
			});
		} finally {
			loading = false;
			invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>Artist Editor | Art Site Editor</title>
</svelte:head>

<button
	onclick={() => {
		artists[''] = { name: '', links: {}, type: 'Artist' };
		tick().then(() => {
			newModal?.setOpen(true);
		});
	}}
	class="my-4 w-full cursor-pointer rounded-2xl border p-3 hover:bg-gray-300 active:bg-gray-500"
>
	<i class="fa-solid fa-plus"></i>
	<span>Add Artist</span>
</button>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
	{#each Object.entries(artists) as [handle, artist], i (`${i}-${Object.entries(artists).length}`)}
		<Modal
			title="@{handle}"
			class="m-2 rounded-2xl border"
			bind:this={
				() => null,
				(modal) => {
					if (!handle) {
						newModal = modal;
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
							artists = renameKey(artists, handle, v);
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
	{/each}
</div>
