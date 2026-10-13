// Marks the editable texts in the pages so the admin console (Site Content) can find them.
// It wraps each text in <!--c:key-->...<!--/c--> and tags editable links with data-c.
// Safe to rerun: anything already marked is left alone. It changes no visible text.
//   node tools/add-content-slots.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const C = require('../admin/content.js');

let html, file, added = 0, missing = [];
const has = key => html.includes('<!--c:' + key + '-->');
const hasAttr = key => html.includes('data-c="' + key + '"');

// wrap(key, re): re has three groups (before)(the text)(after). scope narrows the search to one block.
function wrap(key, re, scope, optional) {
  if (has(key)) return;
  let from = 0, chunk = html;
  if (scope) { const m = scope.exec(html); if (!m) { if (!optional) missing.push(file + ' ' + key + ' (block)'); return; } from = m.index; chunk = m[0]; }
  const m = re.exec(chunk);
  if (!m) { if (!optional) missing.push(file + ' ' + key); return; }
  const out = chunk.slice(0, m.index) + m[1] + '<!--c:' + key + '-->' + m[2] + '<!--/c-->' + m[3] + chunk.slice(m.index + m[0].length);
  html = html.slice(0, from) + out + html.slice(from + chunk.length);
  added++;
}
// link(key, re): re matches the opening tag of the link
function link(key, re, scope, optional) {
  if (hasAttr(key)) return;
  let from = 0, chunk = html;
  if (scope) { const m = scope.exec(html); if (!m) { if (!optional) missing.push(file + ' ' + key + ' (block)'); return; } from = m.index; chunk = m[0]; }
  const m = re.exec(chunk);
  if (!m) { if (!optional) missing.push(file + ' ' + key); return; }
  const tag = m[0].replace(/^<(\w+)/, '<$1 data-c="' + key + '"');
  html = html.slice(0, from) + chunk.slice(0, m.index) + tag + chunk.slice(m.index + m[0].length) + html.slice(from + chunk.length);
  added++;
}
function page(f, fn) {
  file = f; const full = path.join(ROOT, f); html = fs.readFileSync(full, 'utf8'); const before = html;
  fn();
  if (html !== before) fs.writeFileSync(full, html);
}
const sec = id => new RegExp('<section[^>]*id="' + id + '"[\\s\\S]*?</section>');

// ── Main site ──
page('PNTC Main Landing Page/index.html', () => {
  const hero = sec('hero'), btns = /<div class="hero-btns">[\s\S]*?<\/div>/, cta = sec('cta'), cbtns = /<div class="cta-btns">[\s\S]*?<\/div>/;
  wrap('main.hero.pill', /(<span class="hero-pill-dot"><\/span>\s*)([^<]+?)(\s*<\/div>)/, hero);
  wrap('main.hero.line3', /(<\/svg><\/span><\/span>\s*<span class="hl"><span>)([^<]*)(<\/span>)/, hero);
  wrap('main.hero.line2', /(<span class="hl"><span class="gold">)([^<]*)(<svg)/, hero);
  wrap('main.hero.line1', /(<\/span>\s*<span class="hl"><span>)([^<]*)(<\/span><\/span>\s*<span class="hl"><span class="gold">)/, hero);
  wrap('main.hero.sub', /(<p class="hero-sub">\s*)([^<]*?)(\s*<\/p>)/, hero);
  link('main.hero.btn1.href', /<a href="[^"]*" class="btn-gold">/, btns);
  link('main.hero.btn2.href', /<a href="[^"]*"\s+class="btn-outline-white">/, btns);
  wrap('main.hero.btn1', /(class="btn-gold">)([^<]*)(<\/a>)/, btns);
  wrap('main.hero.btn2', /(class="btn-outline-white">)([^<]*)(<\/a>)/, btns);
  wrap('main.hero.wall', /(<span class="hc-tag"><i><\/i>)([^<]*)(<\/span>)/, hero);
  // call to action: the whole second line sits in the highlight span, which reads the same on the yellow band
  if (!has('main.cta.line2')) html = html.replace(/(<h2 class="cta-h2">[^<]*<br>)the <span class="gold">([^<]*)<\/span>/, '$1<span class="gold">the $2</span>');
  wrap('main.cta.eyebrow', /(<p class="eyebrow cta-eyebrow">)([^<]*)(<\/p>)/, cta);
  wrap('main.cta.line1', /(<h2 class="cta-h2">)([^<]*)(<br>)/, cta);
  wrap('main.cta.line2', /(<br><span class="gold">)([^<]*)(<\/span>)/, cta);
  wrap('main.cta.sub', /(<p class="cta-sub">)([^<]*)(<\/p>)/, cta);
  [1, 2, 3].forEach(n => {
    link('main.cta.btn' + n + '.href', /<a href="[^"]*"\s+class="btn-(?:gold|outline-white)">/, cbtns);
    wrap('main.cta.btn' + n, /(<a data-c="main\.cta\.btn\d\.href" href="[^"]*"\s+class="btn-(?:gold|outline-white)">)([^<]*)(<\/a>)/, cbtns);
  });
});

// ── Colleges: hero and values ──
page('PNTC Colleges/index.html', () => {
  const hero = sec('hero'), proof = /<div class="hx-proof">[\s\S]*?<\/div>/;
  wrap('college.hero.pill', /(<span class="hx-pill-dot"><\/span>)([^<]*)(<\/p>)/, hero);
  wrap('college.hero.line2', /(<span class="hl"><span>)([^<]*)(<svg class="hx-swoosh")/, hero);
  wrap('college.hero.line1', /(<\/em> )([^<]*)(<\/span><\/span>)/, hero);
  wrap('college.hero.mark', /(<span class="hl"><span><em>)([^<]*)(<\/em>)/, hero);
  wrap('college.hero.bold', /(<strong class="hx-onward">)([^<]*)(<\/strong>)/, hero);
  wrap('college.hero.sub', /(<p class="hx-sub">)([^<]*?)(\s*<strong class="hx-onward">)/, hero);
  link('college.hero.btn1.href', /<a href="[^"]*" class="hx-btn hx-btn-main">/, hero);
  link('college.hero.btn2.href', /<a href="[^"]*" class="hx-btn hx-btn-ghost">/, hero);
  wrap('college.hero.btn1', /(class="hx-btn hx-btn-main">)([^<]*)(<\/a>)/, hero);
  wrap('college.hero.btn2', /(class="hx-btn hx-btn-ghost">[\s\S]*?<\/svg><\/span>)([^<]*)(<\/a>)/, hero);
  wrap('college.hero.proof', /(<\/strong>\s*)([^<]*?)(\s*<\/p>)/, proof);
  wrap('college.hero.proofn', /(<p><strong>)([^<]*)(<\/strong>)/, proof);
  for (let i = 1; i <= 6; i++) {
    wrap(`college.value${i}.name`, /(<h3 class="vb-name">)([^<]*)(<\/h3>)/);
    wrap(`college.value${i}.desc`, /(<p class="vb-desc">)([^<]*)(<\/p>)/);
  }
});

// ── Colleges: program details ──
page('PNTC Colleges/programs.html', () => {
  for (const id of ['bsmt', 'bsmare', 'bstm', 'bscrim', 'bscusad', 'bsoa']) {
    const s = sec('prog-' + id), k = 'college.prog.' + id + '.';
    wrap(k + 'college', /(<p class="pd-eyebrow">)([^<]*)(<\/p>)/, s);
    wrap(k + 'name', /(<h2 class="pd-title">)([^<]*)(<\/h2>)/, s);
    wrap(k + 'tagline', /(<p class="pd-tagline">)([^<]*)(<\/p>)/, s);
    wrap(k + 'points', /(<ul class="pd-points">)([\s\S]*?)(<\/ul>)/, s);
    wrap(k + 'careers', /(<ul class="pd-careers">)([\s\S]*?)(<\/ul>)/, s);
    wrap(k + 'now', /(<p class="pd-label">Why Now<\/p><p>)([^<]*)(<\/p>)/, s);
    link(k + 'cta.href', /<a class="pd-cta" href="[^"]*">/, s);
    wrap(k + 'cta', /(class="pd-cta" href="[^"]*">)([^<]*)(<\/a>)/, s);
  }
});

// ── Colleges: admissions ──
page('PNTC Colleges/admissions.html', () => {
  const head = /<div class="ap-head reveal">[\s\S]*?<\/div>/;
  wrap('college.adm.eyebrow', /(<p class="ap-eyebrow">)([^<]*)(<\/p>)/, head);
  wrap('college.adm.h2', /(<h2>[^<]*<span>)([^<]*)(<\/span><\/h2>)/, head);
  wrap('college.adm.h1', /(<h2>)([^<]*?)(\s*<span>)/, head);
  wrap('college.adm.finish', /(<\/span><p>)([^<]*)(<)/, /<div class="ap-finish[\s\S]*?<\/div>/);
  // each phase title appears in the overview and above its steps, so both carry the same key
  [1, 2].forEach(n => {
    const key = 'college.adm.phase' + n;
    if (has(key)) return;
    const a = new RegExp('(<p class="ap-ov-label">Phase ' + n + ' · )([^<]*)(</p>)'), b = new RegExp('(<span class="ap-marker-tag">Phase ' + n + '</span><h3>)([^<]*)(</h3>)');
    if (!a.test(html) || !b.test(html)) { missing.push(file + ' ' + key); return; }
    html = html.replace(a, '$1<!--c:' + key + '-->$2<!--/c-->$3').replace(b, '$1<!--c:' + key + '-->$2<!--/c-->$3'); added++;
  });
  for (let n = 1; n <= 11; n++) {
    const s = new RegExp('<article class="ap-step[^>]*id="step-' + n + '"[\\s\\S]*?</article>'), k = 'college.adm.step' + n + '.';
    wrap(k + 'short', new RegExp('(<a href="#step-' + n + '"><span class="ap-ov-dot">\\d+</span><span class="ap-ov-name">)([^<]*)(</span>)'));
    wrap(k + 'office', /(<h4 class="ap-office">)([^<]*)(<\/h4>)/, s);
    wrap(k + 'tasks', /(<ul class="ap-tasks">)([\s\S]*?)(<\/ul>)/, s);
    wrap(k + 'note', /(<p class="ap-note">)([^<]*)(<\/p>)/, s, true);
    link(k + 'email', /<a href="mailto:[^"]*">/, s, true);
    wrap(k + 'email', /(href="mailto:[^"]*">[\s\S]*?<span>)([^<]*)(<\/span><\/a>)/, s, true);
    wrap(k + 'follow', /(<span>Follow <strong>)([^<]*)(<\/strong>)/, s, true);
  }
});

// ── Senior High School hero ──
page('SHS/index.html', () => {
  const hero = sec('hero');
  wrap('shs.hero.tag', /(<span class="sh-dot"><\/span>)([^<]*)(<\/div>)/, hero);
  wrap('shs.hero.line3', /(<span class="hl"><span><em>)([^<]*)(<svg)/, hero);
  wrap('shs.hero.line2', /(<\/span><\/span><span class="hl"><span>)([^<]*)(<\/span><\/span><span class="hl"><span><em>)/, hero);
  wrap('shs.hero.line1', /(<span class="hl"><span>)([^<]*)(<\/span><\/span><span class="hl"><span>)/, hero);
  wrap('shs.hero.desc', /(<p class="hero-desc">)([^<]*)(<\/p>)/, hero);
  wrap('shs.hero.btn1', /(<button class="btn-enroll">)([^<]*)(<\/button>)/, hero);
  wrap('shs.hero.btn2', /(<button class="btn-learn">)([^<]*)(<\/button>)/, hero);
});

// ── Training Center hero ──
page('PNTC Maritime Training and Assessment Center/index.html', () => {
  const hero = sec('hero');
  wrap('training.hero.pill', /(<span class="th-pill-dot"><\/span>)([^<]*)(<\/div>)/, hero);
  wrap('training.hero.line3', /(<span class="hl"><span><em>)([^<]*)(<svg)/, hero);
  wrap('training.hero.line2', /(<\/span><\/span><span class="hl"><span>)([^<]*)(<\/span><\/span><span class="hl"><span><em>)/, hero);
  wrap('training.hero.line1', /(<span class="hl"><span>)([^<]*)(<\/span><\/span><span class="hl"><span>)/, hero);
  wrap('training.hero.sub', /(<p class="hero-sub">\s*)([^<]*?)(\s*<\/p>)/, hero);
  link('training.hero.btn1.href', /<a href="[^"]*" class="btn-primary-hero">/, hero);
  link('training.hero.btn2.href', /<a href="[^"]*" class="btn-ghost-hero">/, hero);
  wrap('training.hero.btn1', /(class="btn-primary-hero">\s*)([^<]*?)(\s*<svg)/, hero);
  wrap('training.hero.btn2', /(class="btn-ghost-hero">\s*<svg[\s\S]*?<\/svg>\s*)([^<]*?)(\s*<\/a>)/, hero);
});

console.log('marked', added, 'new texts and links');
if (missing.length) { console.log('NOT FOUND:\n  ' + missing.join('\n  ')); process.exitCode = 1; }

// Report: every field in the schema should now be readable from its first page (optional step fields may be absent)
let unread = [];
for (const g of C.GROUPS) {
  const h = fs.readFileSync(path.join(ROOT, g.files[0]), 'utf8');
  for (const f of g.fields) if (C.readField(h, f) === null && !/\.step\d+\.(note|email|follow)$/.test(f.key)) unread.push(g.id + ' ' + f.key);
}
console.log(unread.length ? 'fields not yet on their page:\n  ' + unread.join('\n  ') : 'every field can be read from its page');
