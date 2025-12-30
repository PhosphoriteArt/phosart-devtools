<script lang="ts">
	import CodeEditor from '$lib/CodeEditor.svelte';

	interface Props {
		value: string | undefined;
		label: string;
	}

	let { value = $bindable(), label }: Props = $props();
</script>

<div class="flex flex-row items-center gap-x-2">
	<pre class="w-36">{label}</pre>
	<div
		class="m-2 h-36 min-h-36 max-w-full min-w-1/2 rounded-xl border bg-white p-2 focus:border-blue-300"
	>
		<CodeEditor
			language="markdown"
			bind:value={() => value ?? '', (v) => void (value = v)}
			theme="vs-light"
		/>
	</div>
</div>
