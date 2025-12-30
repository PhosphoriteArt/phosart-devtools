<script lang="ts">
	import { disableWindowDrag } from '$lib/dragutil.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		over?: boolean;
		onDrop?: (files: File[]) => void;
		children?: Snippet;
		class?: string;
	}

	let { over = $bindable(false), onDrop, children, class: cls }: Props = $props();

	async function doOnDrop(dev: DragEvent): Promise<void> {
		if (!dev.dataTransfer) return;

		const items = [...dev.dataTransfer.items]
			.map((item) => item.getAsFile())
			.filter((f): f is File => !!f);

		if (items.length > 0) {
			onDrop?.(items);
		}
	}

	disableWindowDrag();
</script>

<div
	role="form"
	ondrop={doOnDrop}
	ondragenter={(dev) => {
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
