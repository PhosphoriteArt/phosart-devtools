import { randomBytes } from 'node:crypto';

export const psk = randomBytes(16).toString('hex');
