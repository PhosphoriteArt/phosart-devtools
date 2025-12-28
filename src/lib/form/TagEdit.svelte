<script lang="ts">
	import ChippedInput from './ChippedInput.svelte';
	interface Props {
		value: Array<string>;
		possibleTags: Array<string>;
		prefix?: string;
	}

	let { possibleTags, value = $bindable(), prefix }: Props = $props();
</script>

<ChippedInput label="Tags" asString={(s) => s} options={possibleTags} bind:value {prefix} />
