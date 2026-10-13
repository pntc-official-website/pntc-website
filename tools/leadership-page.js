// Main site > About > Leadership. Builds the leadership tree in
// PNTC Main Landing Page/about-leadership.html, following the organizational chart.
// Only positions with a name are shown. The list of leaders is LEADERS in admin/content.js.
// Names and titles stay editable in the admin (Site Content). Rebuilding keeps whatever was saved there.
// Rerunnable:  node tools/leadership-page.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const FILE = path.join(__dirname, '..', 'PNTC Main Landing Page', 'about-leadership.html');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slot = (key, v) => `<!--c:${key}-->${esc(v || '')}<!--/c-->`;

const PEOPLE = C.LEADERS;
const card = (id, cls = '') => {
  const p = PEOPLE.find(x => x.id === id);
  if (!p) throw new Error('unknown leader ' + id);
  return `<article class="ld-card ${cls}"${p.accent ? ` style="--ac:${p.accent}"` : ''}>
            <span class="ld-av" aria-hidden="true"></span>
            <div class="ld-info">
              <p class="ld-role">${slot(`lead.${id}.role`, p.role)}</p>
              <h3 class="ld-name">${slot(`lead.${id}.name`, p.name)}</h3>
              ${p.unit ? `<p class="ld-unit">${slot(`lead.${id}.unit`, p.unit)}</p>` : ''}
            </div>
          </article>`;
};
const cards = (ids, cls) => ids.map(id => card(id, cls)).join('\n          ');
// A department on the chart: its head first, then the people under that head
const dept = (n, name, top, under = [], cls = '') => `<section class="lt-dept ${cls} reveal">
          <header><span class="lt-n">${n}</span><h3>${name}</h3></header>
          <div class="lt-body">
          ${cards(top, 'ld-lead')}
          ${under.length ? `<div class="lt-under">\n          ${cards(under)}\n          </div>` : ''}
          </div>
        </section>`;
const group = (label, ids, cls = '') => `<div class="lt-group ${cls}">
            <p class="lt-lbl">${label}</p>
            <div class="lt-cards lt-c${ids.length}">
          ${cards(ids)}
            </div>
          </div>`;

const section = `<section id="leadership" class="ld">
  <span class="ld-ghost" aria-hidden="true">PNTC</span>
  <div class="ld-wrap">
    <div class="ld-head reveal">
      <p class="eyebrow">${slot('lead.eyebrow', 'Leadership')}</p>
      <h2 class="ld-h2"><span class="ld-mark">${slot('lead.mark', 'The People')}<svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10 C 70 2, 190 2, 297 8" fill="none" stroke="#F3CF33" stroke-width="5" stroke-linecap="round"/></svg></span> ${slot('lead.rest', 'Who Lead PNTC')}</h2>
    </div>

    <div class="lt-apex reveal">
      ${card('chairman', 'ld-big')}
      <span class="lt-v" aria-hidden="true"></span>
      ${card('president', 'ld-big')}
      <span class="lt-v" aria-hidden="true"></span>
    </div>

    <div class="lt-depts">
        <section class="lt-dept lt-wide reveal">
          <header><span class="lt-n">01</span><h3>Academic Affairs Department</h3></header>
          <div class="lt-body">
          ${card('vp-acad', 'ld-lead')}
          ${group('College of Maritime Education', ['dean-maritime', 'head-bsmt', 'head-bsmare', 'head-obt'], 'lt-maritime')}
          ${group('Deans', ['dean-business', 'dean-crim', 'dean-osa'])}
          ${group('Heads', ['head-gened', 'head-research', 'head-registrar'])}
          </div>
        </section>
        ${dept('02', 'Maritime Training and Assessment Center', ['vp-training'])}
        ${dept('03', 'Quality Department', ['head-quality'])}
        ${dept('04', 'Marketing Department', ['mgr-college', 'mgr-mtc'])}
        ${dept('05', 'Finance Department', ['sup-finance'], [], 'lt-half')}
        ${dept('06', 'Administration Department', ['vp-admin'], ['sup-hrdm'], 'lt-half')}
    </div>
  </div>
</section>`;

const CSS = fs.readFileSync(path.join(__dirname, 'leadership-page.css'), 'utf8').replace(/\r\n/g, '\n').trim();
const SCRIPT = `<script id="leaders-js">
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.ld-card').forEach(function(c){
    var n=(c.querySelector('.ld-name').textContent||'').trim();
    while(/^([A-Za-z]+\\.|[A-Za-z0-9]{1,2}\\/[A-Za-z]{1,2})\\s+/.test(n))n=n.replace(/^\\S+\\s+/,'');
    var w=n.split(/\\s+/).filter(Boolean);
    c.querySelector('.ld-av').textContent=w.length?(w[0][0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase():'';
  });
});
</script>`;

const before = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
let h = before;
const start = h.search(/<section id="(coming-soon|leadership)"/);
if (start < 0) throw new Error('leadership section not found');
const end = h.indexOf('<!-- ===================== FOOTER');
if (end < start) throw new Error('footer marker not found');
h = h.slice(0, start) + section + '\n\n\n\n' + h.slice(end);
h = h.replace(/<style id="leaders-modern">[\s\S]*?<\/script>\n/, '');
h = h.replace('<meta name="description"', `<style id="leaders-modern">\n${CSS}\n</style>\n${SCRIPT}\n<meta name="description"`);
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('leadership page built:', (section.match(/class="ld-card/g) || []).length, 'of', PEOPLE.length, 'leaders placed');
