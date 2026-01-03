<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import ControlledChippedInput from './ControlledChippedInput.svelte';

	interface Props {
		label: string;
		value: Array<T>;
		options?: Record<string, T>;
		prefix?: string;
		onAddUnknown?: (s: string) => T;

		renderChip?: Snippet<[obj: T]>;
		labelClass?: string;
	}

	let {
		label,
		labelClass,
		value = $bindable(),
		options,
		prefix,
		renderChip,
		onAddUnknown
	}: Props = $props();

	let search = $state('');
	let lastSelected: T | null = $state(null);

	$effect(() => {
		if (options?.[search]) {
			lastSelected = options[search];
		}
	});
</script>

<ControlledChippedInput
	{label}
	{labelClass}
	bind:search
	{renderChip}
	{prefix}
	{options}
	{value}
	validationError={search !== '' && !onAddUnknown && !lastSelected ? 'Select an option' : ''}
	noReportValidation
	onDeselect={() => {
		lastSelected = null;
	}}
	onSelect={(k, v) => {
		const obj = v ?? onAddUnknown?.(k) ?? null;
		if (obj) {
			if (!(value ?? []).includes(obj)) {
				value = [...(value ?? []), obj];
			}
			search = '';
			lastSelected = null;
		}
	}}
	onRemove={(_, i) => {
		value = [...value.slice(0, i), ...value.slice(i + 1)];
	}}
/>
