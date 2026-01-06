const CLIENT_ID = 'Iv23ligolIXXVSYrPwJx';

export type LoginState =
	| {
			stage: 'start';
	  }
	| {
			stage: 'has_code';
			device_code: string;
			user_code: string;
			verification_uri: string;
			last_attempt?: TokenError;
	  }
	| { stage: 'completed' };

export async function requestDeviceCode(): Promise<{
	verification_uri: string;
	user_code: string;
	device_code: string;
	interval: number;
}> {
	const fd = new FormData();
	fd.append('client_id', CLIENT_ID);
	return await fetch('https://github.com/login/device/code', {
		body: fd,
		headers: { Accept: 'application/json' }
	}).then((r) => r.json());
}

type TokenError = 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied';
export async function requestToken(
	deviceCode: string
): Promise<{ access_token?: string; error?: TokenError }> {
	const fd = new FormData();
	fd.append('client_id', CLIENT_ID);
	fd.append('device_code', deviceCode);
	fd.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
	return await fetch('https://github.com/login/oauth/access_token', {
		body: fd,
		headers: { Accept: 'application/json' }
	}).then((r) => r.json());
}
