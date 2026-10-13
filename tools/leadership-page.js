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
const dept = (name, top, under = [], cls = '') => `<section class="lt-dept ${cls} reveal">
          <header><h3>${name}</h3></header>
          <div class="lt-body">
          ${cards(top, 'ld-lead')}
          ${under.length ? `<div class="lt-under">\n          ${cards(under)}\n          </div>` : ''}
          </div>
        </section>`;
// A unit under a department head. "w" is how many people stand side by side in it, "color" highlights a college.
const group = (label, ids, o = {}) => `<div class="lt-group${o.color ? ' lt-col' : ''}" style="--w:${o.w || 1}${o.color ? ';--gc:' + o.color : ''}">
            <p class="lt-lbl">${label}</p>
            <div class="lt-cards">
          ${cards(ids)}
            </div>
            ${o.under ? `<div class="lt-under">\n          ${cards(o.under)}\n          </div>` : ''}
          </div>`;
// A department with its head on top and, on one level below, the units that report to that head
const big = (name, lead, groups) => `<section class="lt-dept lt-big reveal">
          <header><h3>${name}</h3></header>
          <div class="lt-body">
          ${card(lead, 'ld-lead')}
          <div class="lt-groups">
          ${groups.join('\n          ')}
          </div>
          </div>
        </section>`;

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
      <div class="lt-staff">
        <span class="lt-v" aria-hidden="true"></span>
        <div class="lt-staff-box">
          <p class="lt-lbl">Quality Department</p>
          ${card('head-quality')}
        </div>
      </div>
    </div>

    <nav class="lt-jump reveal" aria-label="Jump to a tree">
      <a href="#tree-colleges">${slot('lead.tree1', 'PNTC Colleges')}</a>
      <a href="#tree-training">${slot('lead.tree2', 'Maritime Training Center')}</a>
    </nav>
  </div>

  <div class="lt-trees">
    <div class="lt-tree" id="tree-colleges">
      <div class="lt-tree-head reveal"><h3>${slot('lead.tree1', 'PNTC Colleges')}</h3></div>
      <div class="lt-depts lt-level lt-l2 lt-split">
        ${big('Academic Affairs Department', 'vp-acad', [
          group('College of Maritime Education', ['dean-maritime'], { color: '#1244B8', under: ['head-bsmt', 'head-bsmare', 'head-obt'] }),
          group('College of Business and Management', ['dean-business'], { color: '#3d2f9e' }),
          group('College of Criminal Justice', ['dean-crim'], { color: '#8a1818' }),
          group('Student Affairs', ['dean-osa']),
          group('Senior High School', ['principal-shs'], { color: '#181D71' }),
          group('General Education', ['head-gened']),
          group('Registrar', ['head-registrar']),
        ])}
        ${big('Administration Department', 'vp-admin', [
          group('Marketing Department', ['mgr-college'], { under: ['sup-marketing'] }),
          group('Finance Department', ['sup-finance']),
          group('Research and Development', ['head-research']),
          group('HRDM', ['sup-hrdm']),
        ])}
      </div>
    </div>

    <div class="lt-tree lt-tree-b" id="tree-training">
      <div class="lt-tree-head reveal"><h3>${slot('lead.tree2', 'Maritime Training Center')}</h3></div>
      <div class="lt-depts lt-level lt-l2">
        ${dept('Maritime Training and Assessment Center', ['vp-training'])}
        ${dept('Marketing Department', ['mgr-mtc'])}
      </div>
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
// wording corrected by the school after the first build
const FIX = { 'lead.dean-business.role': ['Dean of Business and Management', 'Dean of the College of Business and Management'], 'lead.dean-crim.role': ['Dean of Criminal Justice', 'Dean of the College of Criminal Justice'], 'lead.level': ['These departments stand at the same level.', 'Academic Affairs and Administration stand at the same level.'] };
for (const k in FIX) if (C.getSlot(h, k) === FIX[k][0]) h = C.setSlot(h, k, FIX[k][1]);
fs.writeFileSync(FILE, h);
console.log('leadership page built:', (section.match(/class="ld-card/g) || []).length, 'of', PEOPLE.length, 'leaders placed');
