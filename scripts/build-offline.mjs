import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
async function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...await listFiles(new URL(entry.name + '/', directory), prefix + entry.name + '/'));
    else if (entry.name !== 'sw.js') files.push('./' + prefix + entry.name);
  }
  return files.sort();
}
const files = await listFiles(root);
const template = await readFile(new URL('sw-template.js', import.meta.url), 'utf8');
const hash = createHash('sha256').update(template);
for (const file of files) { hash.update(file); hash.update(await readFile(new URL(file, root))); }
const version = hash.digest('hex').slice(0, 16);
await writeFile(new URL('sw.js', root), template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(files, null, 2)));
console.log(`Offline release ${version}: ${files.length} files`);
