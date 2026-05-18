import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'build', 'icon.svg');
const buildDir = path.join(root, 'build');
const publicDir = path.join(root, 'public');

mkdirSync(buildDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const svg = readFileSync(svgPath);

const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
const pngBuffers = {};

for (const size of sizes) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer();
    pngBuffers[size] = buf;
}

writeFileSync(path.join(buildDir, 'icon.png'), pngBuffers[512]);
writeFileSync(path.join(publicDir, 'icon.png'), pngBuffers[256]);

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const ico = await pngToIco(icoSizes.map(s => pngBuffers[s]));
writeFileSync(path.join(buildDir, 'icon.ico'), ico);

console.log('Generated:');
console.log('  build/icon.png  (512x512)');
console.log('  build/icon.ico  (multi-res)');
console.log('  public/icon.png (256x256)');
