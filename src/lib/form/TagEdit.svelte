<script lang="ts">
	import ChippedInput from './chipped/ChippedInput.svelte';
	import { arrAsObject } from './search/SearchResults.svelte';
	interface Props {
		value: Array<string>;
		possibleTags: Array<string>;
		prefix?: string;
	}

	let { possibleTags, value = $bindable(), prefix }: Props = $props();
</script>

<ChippedInput
	label="Tags"
	options={arrAsObject(possibleTags)}
	bind:value
	{prefix}
	onAddUnknown={(s) => s}
/>
