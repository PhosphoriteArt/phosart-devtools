<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	const { onObservable, tickMs }: { onObservable: () => void; tickMs?: number } = $props();

	let isIntersecting = $state(false);

	$effect(() => {
		if (!tickMs || !isIntersecting) return;

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		onObservable;
		const handle = setInterval(() => {
			if (isIntersecting) {
				onObservable();
			}
		}, tickMs);

		return () => {
			clearInterval(handle);
		};
	});

	const sentinel: Attachment<HTMLDivElement> = (el) => {
		const cb: IntersectionObserverCallback = (entries) => {
			const ent = entries[0];
			if (!ent) return;

			isIntersecting = ent.isIntersecting;
			if (ent.isIntersecting) {
				onObservable();
			}
		};
		const io = new IntersectionObserver(cb);
		io.observe(el);

		return () => {
			io.disconnect();
		};
	};
</script>

<div {@attach sentinel}></div>
