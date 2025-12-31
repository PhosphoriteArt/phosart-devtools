<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import TextInput from '$lib/form/TextInput.svelte';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	let settings = $state(data.themeConfig);
	let loading = $state(false);

	async function save() {
		loading = true;
		try {
			await fetch(`/api/config/save`, {
				method: 'POST',
				body: JSON.stringify(settings),
				headers: { 'Content-Type': 'application/json' }
			});
		} finally {
			loading = false;
			invalidateAll();
		}
	}
</script>

<div>
	<TextInput bind:value={settings.defaultArtist} label="Default Artist" options={data.artists} />
	{#each Object.entries(data.themeSchema) as [key, scheme] (key)}
		{#if scheme.type === 'string'}
			<TextInput bind:value={settings[key]} label={key} />
		{:else if scheme.type === 'color'}
			<div class="flex items-center gap-x-2">
				<TextInput
					bind:value={settings[key]}
					label={key}
					validationError={!/^#(?:[A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(
						settings[key]
					)
						? 'Must be a valid color in hex'
						: ''}
				/>
				<div class="h-4 w-4" style="background-color: {settings[key]};"></div>
			</div>
		{:else if scheme.type === 'selection'}
			<TextInput
				bind:value={settings[key]}
				label={key}
				validationError={settings[key] && !scheme.options.includes(settings[key])
					? 'Must match one of the available options'
					: ''}
				options={scheme.options}
			/>
		{/if}
	{/each}
</div>

<button
	onclick={() => void save()}
	disabled={loading}
	class="my-4 w-full cursor-pointer rounded-2xl border p-3 {loading
		? 'bg-gray-300 text-gray-600'
		: 'hover:bg-gray-300 active:bg-gray-500'}"
>
	<i class="fa-solid fa-save"></i>
	<span>{loading ? 'Saving...' : 'Save'}</span>
</button>
