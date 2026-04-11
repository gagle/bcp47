import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');

const raw = readFileSync(resolve(root, 'package.json'), 'utf-8');
const adjusted = raw.replaceAll('./dist/', './');
const pkg = JSON.parse(adjusted);

delete pkg.scripts;
delete pkg.devDependencies;
pkg.files = ['*.mjs', '*.cjs', '*.d.mts', '*.d.cts', '*.map'];

writeFileSync(resolve(distDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

copyFileSync(resolve(root, 'README.md'), resolve(distDir, 'README.md'));
copyFileSync(resolve(root, 'LICENSE'), resolve(distDir, 'LICENSE'));
