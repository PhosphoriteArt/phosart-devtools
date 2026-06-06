<script lang="ts">
	import { disableWindowDrag } from '$lib/dragutil.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		over?: boolean;
		onDrop?: (files: File[]) => void;
		children?: Snippet;
		class?: string;
		disabled?: boolean;
		unstyled?: boolean;
		disableClick?: boolean;
		targetOverride?: Window | HTMLElement;
	}

	let {
		over = $bindable(false),
		onDrop,
		children,
		class: cls,
		disabled,
		unstyled,
		disableClick,
		targetOverride
	}: Props = $props();

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
	let defaultInp: HTMLDivElement | null = $state(null);

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

	function attach(el: Window | HTMLElement) {
		function onDragEnter(dev: DragEvent) {
			if (disabled) return;
			if (dev.dataTransfer) {
				over = true;
			}
		}
		function onDragExit() {
			over = false;
		}
		function onClick() {
			if (disableClick) return;

			doAskUpload();
		}

		el.addEventListener('drop', doOnDrop as unknown as EventListener);
		el.addEventListener('dragenter', onDragEnter as unknown as EventListener);
		el.addEventListener('dragexit', onDragExit as unknown as EventListener);
		el.addEventListener('click', onClick);

		return () => {
			el.removeEventListener('drop', doOnDrop as unknown as EventListener);
			el.removeEventListener('dragenter', onDragEnter as unknown as EventListener);
			el.removeEventListener('dragexit', onDragExit as unknown as EventListener);
			el.removeEventListener('click', onClick);
		};
	}

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		disableClick;
		const target = targetOverride ?? defaultInp;

		if (target) {
			return attach(target);
		}
	});

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
	class={cls}
	class:cursor-copy={!unstyled}
	class:outline-2={over && !unstyled}
	class:outline-green-700={over && !unstyled}
	class:text-green-700={over && !unstyled}
	title="Drag a file over to upload"
	bind:this={defaultInp}
>
	{@render children?.()}
</div>
