<script lang="ts">
	import TextInput from './TextInput.svelte';
	import { parseDate } from 'chrono-node';
	import { DateTime } from 'luxon';

	interface Props {
		date: Date;
	}

	let { date = $bindable() }: Props = $props();
	let dateString = $state('');
	let dateParsed = $derived.by(() => {
		const d = typeof dateString === 'string' ? parseDate(dateString) : null;
		if (!d) {
			return null;
		}
		return DateTime.fromJSDate(d);
	});
</script>

<div class="flex items-center">
	<TextInput
		bind:value={dateString}
		placeholder={DateTime.fromJSDate(date).toFormat('fff')}
		label="Date"
		class="w-xs max-w-full"
		onkeydown={(kev) => {
			const dte = dateParsed?.toJSDate();
			if (kev.code === 'Enter' && dte) {
				date = dte;
				dateString = '';
			}
		}}
		validationError={dateString ? 'Press enter to confirm' : undefined}
	/>
	{#if dateParsed}
		<span> = {dateParsed.toFormat('fff')} </span>
	{/if}
</div>
