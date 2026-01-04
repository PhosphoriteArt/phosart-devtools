<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import Checkbox from './Checkbox.svelte';

	interface Props {
		value: T | null | undefined;
		empty: T;
		control: Snippet<[enabled: boolean, value: T]>;
		label?: string;
	}

	let { value = $bindable(), empty, control, label }: Props = $props();

	let oldValue: T | null = $state(null);
	const enabled = $derived((value ?? null) != null);
</script>

<div class="relative flex items-stretch gap-x-4">
	{@render control(enabled, value ?? oldValue ?? empty)}
	<div class="bottom-0 flex w-2 items-center border border-l-0">
		<div class="flex gap-x-2">
			<Checkbox
				label={label ?? 'Enabled'}
				right
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
	</div>
</div>
