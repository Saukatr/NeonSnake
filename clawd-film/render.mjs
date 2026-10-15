// Headless frame renderer: serves the project, drives film.html frame by frame,
// and writes JPEG frames to disk.
// usage: node render.mjs --from 0 --to 1800 --out frames [--w 1920 --h 1080] [--step 1]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1]]);
  return a;
}, []));
const from = +(args.from ?? 0), to = +(args.to ?? 1800), step = +(args.step ?? 1);
const W = +(args.w ?? 1920), H = +(args.h ?? 1080);
const out = args.out ?? 'frames';
const port = +(args.port ?? 8123);
const quality = +(args.q ?? 0.96);
const skipExisting = args.skip !== '0';
fs.mkdirSync(out, { recursive: true });

const root = path.dirname(new URL(import.meta.url).pathname);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--no-sandbox', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => { console.error('[pageerror]', e); process.exitCode = 1; });
await page.goto(`http://localhost:${port}/film.html?w=${W}&h=${H}`);
await page.waitForFunction(() => window.filmReady === true, null, { timeout: 120000 });

const t0 = Date.now();
let n = 0;
const list = args.frames ? args.frames.split(',').map(Number) : null;
const seq = list || Array.from({ length: Math.ceil((to - from) / step) }, (_, i) => from + i * step);
for (const f of seq) {
  const file = path.join(out, `f${String(f).padStart(5, '0')}.jpg`);
  if (skipExisting && fs.existsSync(file)) continue;
  const dataUrl = await page.evaluate(([f, q]) => window.renderFrame(f, q), [f, quality]);
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  n++;
  if (n % 10 === 0 || n === 1) {
    const el = (Date.now() - t0) / 1000;
    console.log(`frame ${f}  ${(el / n).toFixed(2)}s/frame`);
  }
}
console.log(`done ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close();
server.close();
