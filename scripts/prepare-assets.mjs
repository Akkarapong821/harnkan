import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
const root = new URL('../dist/', import.meta.url);
await mkdir(new URL('fonts/', root), { recursive: true });
const cssResponse = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400..700&display=swap', { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' } });
if (!cssResponse.ok) throw new Error('Font download failed');
let css = await cssResponse.text();
const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(match => match[1]))];
for (const [i, url] of urls.entries()) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Font file download failed');
  const extension = new URL(url).pathname.endsWith('.ttf') ? 'ttf' : 'woff2';
  const filename = `noto-thai-${i}.${extension}`;
  await writeFile(new URL('fonts/' + filename, root), Buffer.from(await response.arrayBuffer()));
  css = css.replaceAll(url, './' + filename);
}
await writeFile(new URL('fonts/fonts.css', root), css);
const license = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/notosansthai/OFL.txt');
if (!license.ok) throw new Error('Font license download failed');
await writeFile(new URL('fonts/OFL.txt', root), await license.text());
const stylePath = new URL('style.css', root);
const style = (await readFile(stylePath, 'utf8')).replace(/^@import[^\n]+/, "@import url('./fonts/fonts.css');");
await writeFile(stylePath, style);

// Draw the existing division logo as installable PNG icons, without dependencies.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([length, type, data, crc]);
}
for (const size of [180, 192, 512]) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let ink = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
      const px = (x + (sx + .5) / 4) * 64 / size, py = (y + (sy + .5) / 4) * 64 / size;
      if ((px - 32) ** 2 + (py - 19) ** 2 <= 16 || (px - 32) ** 2 + (py - 45) ** 2 <= 16 || (px - Math.max(20, Math.min(44, px))) ** 2 + (py - 32) ** 2 <= 9) ink++;
    }
    const index = y * (size * 4 + 1) + 1 + x * 4;
    [101, 84, 192].forEach((base, channel) => raw[index + channel] = Math.round(base + (255 - base) * ink / 16));
    raw[index + 3] = 255;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  await writeFile(new URL(`icon-${size}.png`, root), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
console.log(`Prepared ${urls.length} local fonts and 3 app icons.`);
