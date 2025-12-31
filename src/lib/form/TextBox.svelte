<script lang="ts">
	import CodeEditor from '$lib/CodeEditor.svelte';

	interface Props {
		value: string | undefined;
		label: string;
		big?: boolean;
		disabled?: boolean;
	}

	let { value = $bindable(), label, big, disabled }: Props = $props();

	const dimensions = $derived(big ? 'grow min-h-90 h-90' : 'w-1/2 min-w-sm min-h-36 h-36');
</script>

<div class="flex flex-row items-center gap-x-2">
	<pre class="w-36">{label}</pre>
	<div
		class="m-2 max-w-full {dimensions} rounded-xl border bg-white p-2 focus:border-blue-300"
		class:border-dashed={disabled}
		class:opacity-50={disabled}
	>
		<CodeEditor
			{disabled}
			language="markdown"
			bind:value={() => value ?? '', (v) => void (value = v)}
			theme="vs-light"
		/>
	</div>
</div>
