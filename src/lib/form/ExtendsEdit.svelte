<script lang="ts">
	import ChippedInput from './chipped/ChippedInput.svelte';
	import { arrAsObject } from './search/SearchResults.svelte';

	interface Props {
		value: Array<string>;
		allGalleries: Array<string>;
	}

	let { value = $bindable(), allGalleries }: Props = $props();
</script>

<ChippedInput label="Extends..." options={arrAsObject(allGalleries)} bind:value />
