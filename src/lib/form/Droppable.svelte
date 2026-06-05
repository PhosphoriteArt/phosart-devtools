<script lang="ts">
	import { disableWindowDrag } from '$lib/dragutil.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		over?: boolean;
		onDrop?: (files: File[]) => void;
		children?: Snippet;
		class?: string;
		disabled?: boolean;
	}

	let { over = $bindable(false), onDrop, children, class: cls, disabled }: Props = $props();

	async function doOnDrop(dev: DragEvent): Promise<void> {
		if (disabled || !dev.dataTransfer) return;

		const items = [...dev.dataTransfer.items]
			.map((item) => item.getAsFile())
			.filter((f): f is File => !!f);

		if (items.length > 0) {
			onDrop?.(items);
		}
		over = false;
	}

	let fileInp: HTMLInputElement | null = $state(null);

	function doAskUpload() {
		if (disabled) return;
		fileInp?.click();
	}
	function doFinishUpload() {
		if (disabled) return;

		if (!fileInp?.files) return;

		const items = [...fileInp.files];

		if (items.length > 0) {
			onDrop?.(items);
		}
		over = false;
	}

	disableWindowDrag();
</script>

<input
	type="file"
	class="hidden"
	bind:this={fileInp}
	multiple
	accept="image/*,video/*,.mp4"
	onchange={doFinishUpload}
/>

<div
	role="form"
	onclick={doAskUpload}
	ondrop={doOnDrop}
	ondragenter={(dev) => {
		if (disabled) return;
		if (dev.dataTransfer) {
			over = true;
		}
	}}
	ondragexit={() => {
		over = false;
	}}
	class="cursor-copy {cls}"
	class:outline-2={over}
	class:outline-green-700={over}
	class:text-green-700={over}
	title="Drag a file over to upload"
>
	{@render children?.()}
</div>
