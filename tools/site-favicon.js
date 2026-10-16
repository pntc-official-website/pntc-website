// Browser tab icon on every page: the white PNTC crest on navy (favicon.png, favicon-32.png, favicon.ico,
// apple-touch-icon.png in the Main Site folder, served from the site root).
// Also adds it to the blog page templates in admin/server.js and admin/republish-to-github.js, so new posts get it.
// Rerunnable:  node tools/site-favicon.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const TAGS = '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="icon" type="image/png" sizes="192x192" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">';
const MARK = /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32\.png">[^\n]*?<link rel="apple-touch-icon" href="\/apple-touch-icon\.png">/g;

function add(text) {
  text = text.replace(MARK, '');
  // right after the charset line when there is one, otherwise just before </head>
  if (/<meta charset[^>]*>/i.test(text)) return text.replace(/(<meta charset[^>]*>)/i, `$1${TAGS}`);
  return text.replace('</head>', TAGS + '\n</head>');
}

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.git', '.vercel', 'tools', 'content'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) files.push(p);
  }
})(ROOT);
let n = 0;
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  if (!/<\/head>/i.test(before)) continue;
  const after = add(before);
  if (after !== before) { fs.writeFileSync(f, after); n++; }
}
// blog page templates: only the first <meta charset> of each built page head
for (const rel of ['admin/server.js', 'admin/republish-to-github.js']) {
  const f = path.join(ROOT, rel);
  const before = fs.readFileSync(f, 'utf8');
  const after = before.replace(MARK, '').replace(/<meta charset="UTF-8">/g, `<meta charset="UTF-8">${TAGS}`);
  if (after !== before) { fs.writeFileSync(f, after); n++; }
}
console.log('files updated:', n, 'of', files.length + 2);
