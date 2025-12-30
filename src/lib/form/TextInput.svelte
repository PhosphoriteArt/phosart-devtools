<script lang="ts">
	interface Props {
		label: string;
		value: string;

		placeholder?: string;
		disabled?: boolean;
		onkeydown?: (kev: KeyboardEvent) => void;
		onclick?: (mev: MouseEvent) => void;
		class?: string;
	}

	const id = $props.id();

	let {
		label,
		value = $bindable(),
		onkeydown,
		placeholder,
		class: cls,
		disabled,
		onclick
	}: Props = $props();

	let inputRef: HTMLInputElement | null = $state(null);

	export function focus() {
		inputRef?.focus();
	}
</script>

<div class="flex flex-row items-center gap-x-2">
	<label for="form-{id}"><pre>{label}</pre></label>
	<input
		id="form-{id}"
		type="text"
		bind:value
		bind:this={inputRef}
		{placeholder}
		{onkeydown}
		{disabled}
		class:text-gray-400={disabled}
		class="m-2 rounded-xl border p-2 focus:border-blue-300 {cls}"
		class:bg-white={!disabled}
		class:bg-gray-100={disabled}
		onpointerdown={onclick}
	/>
</div>
