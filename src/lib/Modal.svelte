<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		open?: boolean | null;
		children?: Snippet;
		class?: string;
		right?: Snippet;
		modalRight?: Snippet;
	}

	let {
		title,
		subtitle,
		open = $bindable(false),
		children,
		class: cls,
		right,
		modalRight
	}: Props = $props();

	let dialog: HTMLDialogElement | null = $state(null);
	let childContainer: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (!dialog) return;

		const f = () => {
			open = false;
		};

		dialog?.addEventListener('close', f);
		return () => {
			dialog?.removeEventListener('close', f);
		};
	});

	$effect(() => {
		if (!dialog) return;

		if (open) {
			if (!dialog.open) {
				dialog.showModal();
			}
		} else {
			if (dialog.open) {
				childContainer?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
				dialog.close();
			}
		}
	});

	export function setOpen(flag: boolean) {
		open = flag;
	}
</script>

<div class="rounded-2xl border {cls}">
	<div
		role="button"
		tabindex="0"
		onkeypress={() => {
			open = !open;
		}}
		onclick={() => {
			open = !open;
		}}
		class="hover-effect flex h-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl px-3 select-none"
	>
		<div class="flex flex-col items-start p-2">
			<div class="font-semibold">{title}</div>
			{#if subtitle}
				<div class="text-xs text-gray-400">{subtitle}</div>
			{/if}
		</div>
		{#if right}
			<div>
				{@render right()}
			</div>
		{/if}
	</div>
</div>

<dialog bind:this={dialog}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed flex h-screen w-screen items-center justify-center bg-[#0004]"
		role="button"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				open = false;
			}
		}}
	>
		<div class="flex h-10/12 max-h-10/12 w-9/12 max-w-10/12 flex-col rounded-3xl bg-white">
			<div class="flex items-center justify-between border-b border-b-gray-400 p-4 py-0">
				<div class="flex flex-col items-start">
					<div class="font-semibold">{title}</div>
					{#if subtitle}
						<div class="text-xs text-gray-400">{subtitle}</div>
					{/if}
				</div>
				{#if modalRight}
					<div>
						{@render modalRight()}
					</div>
				{/if}
			</div>
			<div bind:this={childContainer} class="grow overflow-scroll p-4">
				{@render children?.()}
			</div>
		</div>
	</div>
</dialog>

<style lang="postcss">
	@reference "tailwindcss";

	.hover-effect:not(:has(*[data-blockhover]:hover)) {
		@apply hover:bg-gray-300 active:bg-gray-500;
	}
</style>
