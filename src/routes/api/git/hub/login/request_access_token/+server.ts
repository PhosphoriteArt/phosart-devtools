import { requestToken, type LoginState } from '$lib/server/gitops/github';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { secrets } from '$lib/server/gitops/secrets';

export const POST: RequestHandler = async ({ request }) => {
	const state: LoginState = await request.json();
	if (state.stage !== 'has_code') {
		return error(400, 'wrong state');
	}
	const resp = await requestToken(state.device_code);

	if (resp.access_token) {
		secrets.write('gha_token', Buffer.from(resp.access_token, 'utf-8'));
		return json({ stage: 'completed' } satisfies LoginState);
	}

	state.last_attempt = resp.error;
	return json(state);
};
