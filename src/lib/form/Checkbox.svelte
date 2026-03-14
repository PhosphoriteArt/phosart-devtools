<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		checked: boolean;
		label?: string | Snippet;
		right?: true;
	}

	let { checked = $bindable(), label, right }: Props = $props();
	const id = $props.id();
</script>

{#snippet lbl()}
	<label class="cursor-pointer select-none" for={id}>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label?.()}
		{/if}
	</label>
{/snippet}

{#if !right}
	{@render lbl()}
{/if}
<input {id} type="checkbox" class="cursor-pointer" bind:checked />
{#if right}
	{@render lbl()}
{/if}
