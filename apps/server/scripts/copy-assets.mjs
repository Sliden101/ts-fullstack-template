import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, 'src');
const outDir = join(root, 'dist');

async function collectGraphql(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectGraphql(full)));
    } else if (entry.name.endsWith('.graphql')) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await collectGraphql(srcDir);
  for (const file of files) {
    const target = join(outDir, relative(srcDir, file));
    await mkdir(dirname(target), { recursive: true });
    await cp(file, target);
  }
  console.log(`[copy-assets] copied ${files.length} .graphql file(s) to dist`);
}

main().catch((error) => {
  console.error('[copy-assets] failed:', error);
  process.exit(1);
});
