#!/usr/bin/env node

import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rt = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(rt, 'build', 'index.js');

const index = readFileSync(indexPath, { encoding: 'utf-8' }).replace("env('HOST', '0.0.0.0')", "env('HOST', '127.0.0.1')");

writeFileSync(indexPath, '#!/usr/bin/env node\n' + index, { encoding: 'utf-8' });
chmodSync(indexPath, 0o755)

console.log("Successfully updated build/index.js")