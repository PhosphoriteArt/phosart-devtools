import { createContext } from 'svelte';

const [get, set] = createContext<{ epoch: number }>();

export function createSharedEpoch() {
	const epoch = $state({ epoch: 0 });
	set(epoch);
}

export function getEpoch(): { epoch: number } {
	return get();
}
