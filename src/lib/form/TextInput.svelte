<script lang="ts">
	interface Props {
		label: string;
		value: string;
	}

	const id = $props.id();

	let { label, value = $bindable() }: Props = $props();
</script>

<div class="flex flex-row items-center gap-x-2">
	<label for="form-{id}"><pre>{label}</pre></label>
	<input
		id="form-{id}"
		type="text"
		bind:value
		class="m-2 rounded-xl border bg-white p-2 focus:border-blue-300"
	/>
</div>
