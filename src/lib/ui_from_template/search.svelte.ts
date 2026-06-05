import fz from 'fuzzysort';

export const sharedQuery = $state({
	query: ''
});

export function qsearch<T>(
	search: string | null | undefined,
	arr: readonly T[],
	...key: ReadonlyArray<(t: T) => string>
): readonly T[] {
	if (!search) {
		return arr;
	}
	return fz.go(search, arr, { keys: key, threshold: 0.3 }).map((res) => res.obj);
}

export function qsearchObj<T>(
	search: string | null | undefined,
	obj: Record<string, T>,
	...key: ReadonlyArray<(t: T, key: string) => string>
): Record<string, T> {
	if (!search) {
		return obj;
	}

	return Object.fromEntries(
		qsearch<[string, T]>(
			search,
			Object.entries(obj),
			...key.map(
				(f) =>
					([k, v]: [string, T]) =>
						f(v, k)
			)
		)
	);
}
