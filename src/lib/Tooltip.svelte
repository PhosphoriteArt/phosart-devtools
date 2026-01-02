<script lang="ts" module>
	export interface TooltipOptions {
		tooltip?: string | Snippet | undefined;
		placement?: Placement;
	}
</script>

<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import {
		computePosition,
		flip,
		shift,
		offset,
		autoUpdate,
		arrow,
		type Placement
	} from '@floating-ui/dom';

	interface Props extends TooltipOptions {
		children?: Snippet<[attach: Attachment<HTMLElement>]>;
	}

	const { tooltip, children, placement }: Props = $props();

	let tooltipEl: HTMLElement | null = $state.raw(null);
	let attachedEl: HTMLElement | null = $state.raw(null);
	let arrowEl: HTMLElement | null = $state.raw(null);

	$effect(() => {
		if (!tooltipEl) return;

		if (!attachedEl) {
			return;
		}

		function updatePosition() {
			if (!attachedEl || !tooltipEl || !arrowEl) return;

			computePosition(attachedEl, tooltipEl, {
				placement: placement ?? 'top',
				middleware: [offset(8), flip(), shift({ padding: 5 }), arrow({ element: arrowEl })]
			}).then(({ x, y, middlewareData, placement }) => {
				if (!tooltipEl) return;
				Object.assign(tooltipEl.style, { left: `${x}px`, top: `${y}px` });

				if (!arrowEl) return;
				const { x: arrowX, y: arrowY } = middlewareData.arrow!;

				const staticSide = {
					top: 'bottom',
					right: 'left',
					bottom: 'top',
					left: 'right'
				}[placement.split('-')[0]]!;

				Object.assign(arrowEl.style, {
					left: arrowX != null ? `${arrowX}px` : '',
					top: arrowY != null ? `${arrowY}px` : '',
					right: '',
					bottom: '',
					[staticSide]: '-4px'
				});
			});
		}

		const f = (ev: Event) => {
			if (!tooltipEl) return;

			if (attachedEl?.contains(ev.target as Node)) {
				tooltipEl.classList.add('opacity-100');
				tooltipEl.classList.remove('opacity-0');
			} else {
				tooltipEl.classList.add('opacity-0');
				tooltipEl.classList.remove('opacity-100');
			}
		};

		window.addEventListener('mousemove', f);

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		placement;
		const cleanup = autoUpdate(attachedEl, tooltipEl, updatePosition);
		return () => {
			cleanup();
			window.removeEventListener('mousemove', f);
		};
	});

	function portalTooltip(el: HTMLElement) {
		tooltipEl = el;
		document.body.appendChild(el);
		tooltipEl.classList.add('w-max', 'absolute');
		tooltipEl.style.top = '0';
		tooltipEl.style.left = '0';
	}
	function attachTooltip(el: HTMLElement) {
		attachedEl = el;
	}
</script>

{#if tooltip}
	<div
		class="pointer-events-none rounded-sm bg-[#222] p-0.5 px-1 text-sm text-white opacity-0 transition-opacity select-none"
		{@attach portalTooltip}
	>
		{#if typeof tooltip === 'string'}
			{tooltip}
		{:else}
			{@render tooltip()}
		{/if}
		<div class="arrow" bind:this={arrowEl}></div>
	</div>
{/if}

{@render children?.(attachTooltip)}

<style>
	.arrow {
		position: absolute;
		background: #222;
		width: 8px;
		height: 8px;
		transform: rotate(45deg);
	}
</style>
