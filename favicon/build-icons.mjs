import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const faviconDir = join(root, 'favicon');
const themes = ['green', 'yellow', 'purple', 'blue'];

const render = (size, input) =>
	sharp(input, { density: 72 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

const square = (svg) => Buffer.from(svg.replace('rx="5.4"', 'rx="0"'));

const ICO_SIZES = [16, 32, 48];

async function buildTheme(theme) {
	const themeDir = join(faviconDir, `icon-${theme}`);
	const sourceSvg = await readFile(join(themeDir, 'icon.svg'), 'utf8');
	const source = Buffer.from(sourceSvg);
	const squareSvg = square(sourceSvg);

	const icoParts = [];
	for (const size of ICO_SIZES) {
		icoParts.push({ size, data: await render(size, source) });
	}

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

	const icoData = Buffer.concat([header, ...entries, ...icoParts.map((p) => p.data)]);
	await writeFile(join(themeDir, 'favicon.ico'), icoData);
	await writeFile(join(themeDir, 'favicon-192.png'), await render(192, source));
	await writeFile(join(themeDir, 'favicon-512.png'), await render(512, source));
	await writeFile(join(themeDir, 'apple-touch-icon.png'), await render(180, squareSvg));

	console.log(`✓ ${theme}: favicon.ico, favicon-192.png, favicon-512.png, apple-touch-icon.png`);
}

async function main() {
	for (const theme of themes) {
		await buildTheme(theme);
	}
	console.log('Semua tema selesai.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});