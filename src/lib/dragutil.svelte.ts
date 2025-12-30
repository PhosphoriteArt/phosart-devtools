import { onMount } from 'svelte';

export function disableWindowDrag() {
	onMount(() => {
		const f = (e: DragEvent) => {
			if ([...(e.dataTransfer?.items ?? [])].some((item) => item.kind === 'file')) {
				e.preventDefault();
			}
		};
		window.addEventListener('drop', f);
		window.addEventListener('dragover', f);
		return () => {
			window.removeEventListener('drop', f);
			window.removeEventListener('dragover', f);
		};
	});
}
