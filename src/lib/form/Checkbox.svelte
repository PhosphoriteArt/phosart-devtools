<script lang="ts">
	interface Props {
		checked: boolean;
		label?: string;
		right?: true;
	}

	let { checked = $bindable(), label, right }: Props = $props();
	const id = $props.id();
</script>

{#snippet lbl()}
	<label class="cursor-pointer select-none" for={id}>{label}</label>
{/snippet}

{#if !right}
	{@render lbl()}
{/if}
<input {id} type="checkbox" class="cursor-pointer" bind:checked />
{#if right}
	{@render lbl()}
{/if}
