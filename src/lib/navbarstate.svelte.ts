import { createContext } from 'svelte';

interface NavbarState {
	open: boolean;
}

export const [getNavbarOpen, setNavbarOpen] = createContext<NavbarState>();
