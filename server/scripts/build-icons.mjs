import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = join(root, 'static');

const source = await readFile(join(staticDir, 'icon.svg'));
const square = Buffer.from(
	(await readFile(join(staticDir, 'icon.svg'), 'utf8')).replace('rx="11"', 'rx="0"')
);

const render = (size, input = source) =>
	sharp(input, { density: 72 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

const ICO_SIZES = [16, 32, 48];

const icoParts = [];
for (const size of ICO_SIZES) icoParts.push({ size, data: await render(size) });

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoParts.length, 4);

let offset = 6 + 16 * icoParts.length;
const entries = icoParts.map(({ size, data }) => {
	const entry = Buffer.alloc(16);
	entry.writeUInt8(size, 0);
	entry.writeUInt8(size, 1);
	entry.writeUInt32LE(data.length, 8);
	entry.writeUInt32LE(offset, 12);
	offset += data.length;
	return entry;
});

const written = [];
const emit = async (name, data) => {
	await writeFile(join(staticDir, name), data);
	written.push(name);
};

for (const name of await readdir(staticDir)) {
	if (/^favicon(\.ico|-\d+\.png)$/.test(name)) await rm(join(staticDir, name));
}

await emit('favicon.ico', Buffer.concat([header, ...entries, ...icoParts.map((p) => p.data)]));
await emit('favicon-192.png', await render(192));
await emit('favicon-512.png', await render(512));
await emit('apple-touch-icon.png', await render(180, square));

console.log('dibuat:', written.join(', '));
