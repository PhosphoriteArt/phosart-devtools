import { requestDeviceCode, type LoginState } from '$lib/server/gitops/github';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const state: LoginState = await request.json();
	if (state.stage !== 'start') {
		return error(400, 'wrong stage');
	}
	const resp = await requestDeviceCode();

	return json({
		stage: 'has_code',
		device_code: resp.device_code,
		user_code: resp.user_code,
		verification_uri: resp.verification_uri
	} satisfies LoginState);
};
