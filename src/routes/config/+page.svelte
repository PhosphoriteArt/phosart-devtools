<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ChippedInput from '$lib/form/chipped/ChippedInput.svelte';
	import TagEdit from '$lib/form/TagEdit.svelte';
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

<svelte:head>
	<title>Config Editor | Art Site Editor</title>
</svelte:head>

<div>
	<TextInput
		labelClass="w-64"
		bind:value={settings.defaultArtist}
		label="Default Artist"
		options={data.artists}
	/>
	{#each Object.entries(data.themeSchema) as [key, scheme] (key)}
		{#if scheme.type === 'string'}
			<TextInput labelClass="w-64" bind:value={settings[key]} label={key} />
		{:else if scheme.type === 'color'}
			<div class="flex items-center gap-x-2">
				<TextInput
					labelClass="w-64"
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
		{:else if scheme.type === 'selection' && !scheme.multi}
			<TextInput
				labelClass="w-64"
				bind:value={settings[key]}
				label={key}
				validationError={settings[key] && !scheme.options.includes(settings[key])
					? 'Must match one of the available options'
					: ''}
				options={scheme.options}
			/>
		{:else if scheme.type === 'selection' && scheme.multi}
			<ChippedInput
				labelClass="w-64"
				bind:value={settings[key]}
				label={key}
				options={scheme.options}
			/>
		{:else if scheme.type === 'string-list'}
			<ChippedInput
				labelClass="w-64"
				bind:value={settings[key]}
				label={key}
				onAddUnknown={(s) => s}
			/>
		{:else if scheme.type === 'tag-list'}
			<TagEdit
				labelClass="w-64"
				label={key}
				bind:value={settings[key]}
				prefix="#"
				possibleTags={data.allTags}
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
