<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import Checkbox from './Checkbox.svelte';

	interface Props {
		value: T | null | undefined;
		empty: T;
		control: Snippet<[enabled: boolean, value: T]>;
	}

	let { value = $bindable(), empty, control }: Props = $props();

	let oldValue: T | null = $state(null);
	const enabled = $derived((value ?? null) != null);
</script>

<div class="flex gap-x-4">
	{@render control(enabled, value ?? oldValue ?? empty)}
	<Checkbox
		bind:checked={
			() => enabled,
			(c) => {
				if (c) {
					value = value ?? oldValue ?? empty;
				} else {
					console.log('X', { value, oldValue });
					oldValue = value ?? oldValue ?? null;
					value = null;
				}
			}
		}
	/>
</div>
