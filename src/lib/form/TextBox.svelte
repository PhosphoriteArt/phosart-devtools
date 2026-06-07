<script lang="ts">
	import CodeEditor from '$lib/CodeEditor.svelte';

	interface Props {
		value: string | undefined;
		label: string;
		language?: string;
		big?: boolean;
		disabled?: boolean;
	}

	let { value = $bindable(), label, big, disabled, language }: Props = $props();

	const dimensions = $derived(big ? 'grow min-h-90 h-90' : 'w-1/2 min-w-sm min-h-36 h-36');
</script>

<div class="flex flex-row items-center gap-x-2">
	<div class="label">
		<span class="label-text">{label}</span>
		<div
			class="m-2 max-w-full {dimensions} overflow-hidden rounded-xl bg-surface-50-950 outline-surface-500 focus-within:outline"
			class:border-dashed={disabled}
			class:opacity-50={disabled}
		>
			<CodeEditor
				{disabled}
				language={language ?? 'markdown'}
				bind:value={() => value ?? '', (v) => void (value = v)}
				theme="vs-dark"
			/>
		</div>
	</div>
</div>
