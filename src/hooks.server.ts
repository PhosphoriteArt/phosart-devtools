import { error, type Handle } from '@sveltejs/kit';
import { psk } from '$lib/psk';

export const handle: Handle = async ({ event, resolve }) => {
	if (
		event.route.id &&
		event.route.id.startsWith('/api') &&
		event.request.method.toUpperCase() !== 'GET' &&
		event.request.headers.get('authorization')?.toLowerCase() !== `psk ${psk}`
	) {
		return error(401, { message: 'Unauthenticated' });
	}

	return await resolve(event);
};
