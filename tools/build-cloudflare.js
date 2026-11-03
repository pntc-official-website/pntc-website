// Cloudflare build: copies the public website into dist/ with the final web addresses, and writes dist/_redirects.
//   PNTC Main Landing Page  ->  /            (about, careers, philnautical ...)
//   PNTC Colleges           ->  /college/
//   SHS                     ->  /shs/
//   PNTC Maritime Training and Assessment Center  ->  /training/   (also reachable as /maritime/)
//   admin/public            ->  /admin/
// Only website files are copied, so the tools, the admin server code, the schema and the guides stay private.
// The admin server (/api/*) runs in the Worker (worker/index.js), see wrangler.jsonc.
// Run:  node tools/build-cloudflare.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const MAP = [
  ['PNTC Main Landing Page', ''],
  ['PNTC Colleges', 'college'],
  ['SHS', 'shs'],
  ['PNTC Maritime Training and Assessment Center', 'training'],
  ['Aman Sinaya', 'aman-sinaya'],
  ['admin/public', 'admin'],
];
// file types the website serves (raw camera files and source documents are left out)
const PUBLIC = /\.(html?|css|js|json|png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|woff2?|ttf|otf|pdf|txt|xml)$/i;
const SKIP_DIR = new Set(['node_modules', '.git']);

fs.rmSync(DIST, { recursive: true, force: true });
let files = 0, bytes = 0;
function copyDir(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { copyDir(s, d); continue; }
    if (!PUBLIC.test(e.name)) continue;
    const size = fs.statSync(s).size;
    if (size > 25 * 1024 * 1024) { console.warn('skipped, over 25 MB:', path.relative(ROOT, s)); continue; }
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.copyFileSync(s, d);
    files++; bytes += size;
  }
}
for (const [from, to] of MAP) copyDir(path.join(ROOT, from), path.join(DIST, to));

// addresses that are not simply folder/file names
const enc = s => s.split('/').map(encodeURIComponent).join('/');
const redirects = [
  '# Built by tools/build-cloudflare.js',
  '/about/history     /about-history  200',
  '/about/leadership  /about-leadership  200',
  '/philnautical/onboard-training  /philnautical-onboard-training  200',
  '/maritime        /training/  302',
  '/maritime/       /training/  302',
  '/maritime/*      /training/:splat  200',
  // the admin Images screen previews files by their folder names
  ...MAP.map(([from, to]) => `/site-files/${enc(from)}/*  /${to ? to + '/' : ''}:splat  200`),
];
fs.writeFileSync(path.join(DIST, '_redirects'), redirects.join('\n') + '\n');
// keep the admin pages and the API out of search engines
fs.writeFileSync(path.join(DIST, '_headers'), '/admin/*\n  X-Robots-Tag: noindex\n');
console.log(`dist ready: ${files} files, ${(bytes / 1048576).toFixed(1)} MB`);
