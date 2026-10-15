// College pages: stronger text colours. Every text colour set as faded navy or faded white
// (20% to 86% strength) is raised to 86% in place, in the page styles and inline styles,
// including CSS variables that are used as text colours. Only the strength changes, so every rule
// keeps its place in the cascade. Colours below 20% are decorative numerals and stay as they are.
// Rerunnable (colours already at 86% or more are left alone):  node tools/college-readability.js
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'PNTC Colleges');
const MIN = 0.86;

function boost(rgba) {
  const c = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/.exec(rgba);
  if (!c) return rgba;
  const [r, g, b, a] = [+c[1], +c[2], +c[3], +c[4]];
  const navy = r < 60 && g < 60 && b < 110, white = r > 240 && g > 240 && b > 240;
  if (!(navy || white) || a < 0.2 || a >= MIN) return rgba;
  return `rgba(${r},${g},${b},${white ? 0.88 : MIN})`;
}

let total = 0;
for (const name of fs.readdirSync(DIR).filter(f => f.endsWith('.html'))) {
  const file = path.join(DIR, name);
  const before = fs.readFileSync(file, 'utf8');
  let h = before.replace(/<style id="readability">[\s\S]*?<\/style>\r?\n/, '');
  let n = 0;
  // CSS variables that are used as text colours
  const textVars = new Set([...h.matchAll(/(?:^|[;{\s"])color\s*:\s*var\((--[\w-]+)/g)].map(m => m[1]));
  const fix = css => css
    .replace(/((?:^|[;{\s"])color\s*:\s*)(rgba\([^)]*\))/g, (m, p, c) => { const b = boost(c); if (b !== c) n++; return p + b; })
    .replace(/(--[\w-]+)(\s*:\s*)(rgba\([^)]*\))/g, (m, v, s, c) => { if (!textVars.has(v)) return m; const b = boost(c); if (b !== c) n++; return v + s + b; });
  h = h.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (m, a, css, z) => a + fix(css) + z);
  h = h.replace(/(\sstyle=")([^"]*)(")/g, (m, a, css, z) => a + fix(css) + z);
  // the faded label above the closing band
  h = h.replace(/(<div class="eyebrow" style="color:var\(--ink\);margin-bottom:\.75rem);opacity:\.6"/g, (m, a) => { n++; return a + ';opacity:.85"'; });
  if (h !== before) fs.writeFileSync(file, h);
  total += n;
  console.log(name, n, 'colours raised');
}
console.log('total', total);
