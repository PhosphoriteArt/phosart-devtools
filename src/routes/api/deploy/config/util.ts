import { createLogger } from '$lib/log';
import { $ART } from '@phosart/common/server';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import z from 'zod';

const logger = createLogger();

export const ZDeploySettings = z.object({
	last_used: z.literal(['CloudFlare', 'Git', 'ZIP']).optional(),
	cloudflare_project_name: z.string().optional()
});

export type DeploySettings = z.infer<typeof ZDeploySettings>;

export async function readDeploySettings(): Promise<DeploySettings> {
	try {
		const res = await readFile(join($ART(), 'deployment.json'), { encoding: 'utf-8' });
		return ZDeploySettings.parse(JSON.parse(res));
	} catch (e) {
		logger.warn('Could not read deployment file:', e);
		return {};
	}
}

export async function writeDeploySettings(ds: DeploySettings): Promise<void> {
	try {
		await writeFile(join($ART(), 'deployment.json'), JSON.stringify(ZDeploySettings.decode(ds)), {
			encoding: 'utf-8'
		});
		logger.info('Wrote deployment settings', ds);
	} catch (e) {
		logger.warn('Could not read deployment file:', e);
	}
}
