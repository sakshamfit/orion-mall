// Prepare the standalone Orion preview for the existing Vercel project's root.
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../orion-preview');
const output = resolve(here, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (entry.isFile() && ['.html', '.css', '.js'].includes(extname(entry.name))) {
    await cp(resolve(source, entry.name), resolve(output, entry.name));
  }
}
await cp(resolve(source, 'images'), resolve(output, 'images'), { recursive: true });
await mkdir(resolve(output, 'data'), { recursive: true });
await cp(resolve(source, 'data/brands.json'), resolve(output, 'data/brands.json'));
console.log('Prepared static Orion Mall preview in dist/');
