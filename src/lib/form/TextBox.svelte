<script lang="ts">
	interface Props {
		value?: string;
		label: string;
		placeholder?: string;
	}

	let { value = $bindable(), label, placeholder }: Props = $props();

	const id = $props.id();
</script>

<div class="flex flex-row items-center gap-x-2">
	<label for="form-{id}"><pre>{label}</pre></label>
	<textarea
		id="form-{id}"
		bind:value
		class="m-2 min-h-36 max-w-full min-w-1/2 rounded-xl border bg-white p-2 focus:border-blue-300"
		{placeholder}
	></textarea>
</div>
