<script lang="ts">
	import ChippedInput from './chipped/ChippedInput.svelte';
	import { arrAsObject } from './search/SearchResults.svelte';
	interface Props {
		value: Array<string>;
		possibleTags: Array<string>;
		prefix?: string;
		label?: string;
		labelClass?: string;
	}

	let { label, labelClass, possibleTags, value = $bindable(), prefix }: Props = $props();
</script>

<ChippedInput
	label={label ?? 'Tags'}
	{labelClass}
	options={arrAsObject(possibleTags)}
	bind:value
	{prefix}
	onAddUnknown={(s) => s}
/>
