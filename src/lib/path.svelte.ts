import { page } from '$app/state';

export function usePath(): string[] {
	const spath = page.url.searchParams.get('path') ?? '/';
	const fpath = spath.split('/').filter((s) => !!s);
	return fpath;
}
