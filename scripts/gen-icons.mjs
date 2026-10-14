import { createRequire } from 'node:module'; const sharp = createRequire(import.meta.url)('/opt/npm-tools/node_modules/sharp');
import { mkdirSync, readFileSync } from 'node:fs';
const R = '/home/claude/fusion-sleep/android-src/res';
const icon = readFileSync('/home/claude/fusion-sleep/assets/icon.svg');
const fg = readFileSync('/home/claude/fusion-sleep/assets/icon-foreground.svg');
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const round = (s) => Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s/2}" cy="${s/2}" r="${s/2}" fill="#fff"/></svg>`);
const rr = (s) => Buffer.from(`<svg width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${s*0.22}" fill="#fff"/></svg>`);
for (const [d, k] of Object.entries(dens)) {
  const dir = `${R}/mipmap-${d}`; mkdirSync(dir, { recursive: true });
  const s = Math.round(48 * k), f = Math.round(108 * k);
  await sharp(icon, { density: 300 }).resize(s, s).composite([{ input: rr(s), blend: 'dest-in' }]).png().toFile(`${dir}/ic_launcher.png`);
  await sharp(icon, { density: 300 }).resize(s, s).composite([{ input: round(s), blend: 'dest-in' }]).png().toFile(`${dir}/ic_launcher_round.png`);
  await sharp(fg, { density: 300 }).resize(f, f).png().toFile(`${dir}/ic_launcher_foreground.png`);
}
mkdirSync(`${R}/drawable-nodpi`, { recursive: true });
await sharp(fg, { density: 300 }).resize(480, 480).png().toFile(`${R}/drawable-nodpi/splash_logo.png`);
await sharp(icon, { density: 300 }).resize(512, 512).png().toFile('/home/claude/fusion-sleep/assets/icon-512.png');
console.log('icons done');
