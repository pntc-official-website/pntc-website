// Main site > About > Leadership. Builds the leaders and the organization chart in
// PNTC Main Landing Page/about-leadership.html.
// Names and titles stay editable in the admin (Site Content). Rebuilding keeps whatever was saved there.
// Rerunnable:  node tools/leadership-page.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const FILE = path.join(__dirname, '..', 'PNTC Main Landing Page', 'about-leadership.html');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slot = (key, v) => `<!--c:${key}-->${esc(v || '')}<!--/c-->`;

// [id, role, name, unit, accent]
const PEOPLE = C.LEADERS;
const person = id => PEOPLE.find(p => p.id === id);
const card = (id, cls = '') => {
  const p = person(id);
  return `<article class="ld-card ${cls} reveal"${p.accent ? ` style="--ac:${p.accent}"` : ''}>
          <span class="ld-av" aria-hidden="true"></span>
          <div class="ld-info">
            <p class="ld-role">${slot(`lead.${id}.role`, p.role)}</p>
            <h3 class="ld-name">${slot(`lead.${id}.name`, p.name)}</h3>
            ${p.unit ? `<p class="ld-unit">${slot(`lead.${id}.unit`, p.unit)}</p>` : ''}
          </div>
        </article>`;
};
const tier = (label, ids, cls) => `<div class="ld-tier">
        <p class="ld-tier-lbl reveal"><span>${label}</span></p>
        <div class="ld-grid ${cls}">
        ${ids.map(id => card(id)).join('\n        ')}
        </div>
      </div>`;

// Head of a unit on the chart: a named leader (same text as the card above) or a blank line to fill in later
const head = u => u.lead
  ? (Array.isArray(u.lead) ? u.lead : [u.lead]).map(id => `<span class="og-head">${slot(`lead.${id}.name`, person(id).name)}</span>`).join('')
  : `<span class="og-head">${slot(`org.${u.id}.head`, '')}</span>`;
const unit = (u, cls = '') => `<div class="og-box ${cls}"><strong>${esc(u.name)}</strong>${head(u)}</div>`;
const office = u => `<li><strong>${esc(u.name)}</strong>${head(u)}</li>`;
const dept = d => `<article class="og-dept reveal">
          <header><span class="og-n">${d.n}</span><div><h3>${esc(d.name)}</h3>${head(d)}</div></header>
          ${d.committees.length ? `<div class="og-coms"><p class="og-lbl">Committees</p><ul>${d.committees.map(c => `<li${c.sub ? ' class="og-sub"' : ''}>${esc(c.name)}</li>`).join('')}</ul></div>` : ''}
          ${d.offices.length ? `<div class="og-offs"><p class="og-lbl">${d.offLabel || 'Offices'}</p><ul>${d.offices.map(office).join('')}</ul></div>` : '<p class="og-none">Reports to the Office of the Executive Vice President</p>'}
        </article>`;

const O = C.ORG;
const section = `<section id="leadership" class="ld">
  <span class="ld-ghost" aria-hidden="true">PNTC</span>
  <div class="ld-wrap">
    <div class="ld-head reveal">
      <p class="eyebrow">${slot('lead.eyebrow', 'Leadership')}</p>
      <h2 class="ld-h2"><span class="ld-mark">${slot('lead.mark', 'The People')}<svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10 C 70 2, 190 2, 297 8" fill="none" stroke="#F3CF33" stroke-width="5" stroke-linecap="round"/></svg></span> ${slot('lead.rest', 'Who Lead PNTC')}</h2>
    </div>

    <div class="ld-top">
      ${card('chairman', 'ld-big')}
      ${card('president', 'ld-big ld-gold')}
    </div>
    ${tier('Vice Presidents', ['vp-admin', 'vp-acad', 'vp-training'], 'ld-g3')}
    ${tier('Deans', ['dean-maritime', 'dean-business', 'dean-crim', 'dean-osa'], 'ld-g4')}
    ${tier('Managers', ['mgr-college', 'mgr-mtc'], 'ld-g2')}
  </div>
</section>

<!-- ORGANIZATION CHART -->
<section id="structure" class="og">
  <div class="ld-wrap">
    <div class="og-headline reveal">
      <div>
        <p class="eyebrow">${slot('org.eyebrow', 'Organization')}</p>
        <h2 class="ld-h2 ld-h2-sm">${slot('org.title', 'Departments, Offices, and Committees')}</h2>
      </div>
      <div class="og-legend"><span class="og-k1">Office</span><span class="og-k2">Committee</span></div>
    </div>

    <div class="og-tree reveal">
      ${unit(O.president, 'og-pres')}
      <span class="og-v" aria-hidden="true"></span>
      <div class="og-row">
        ${unit(O.secretary)}
        ${unit(O.evp, 'og-evp')}
        ${unit(O.treasurer)}
      </div>
      <div class="og-stem" aria-hidden="true"><span class="og-com">Executive Committee</span></div>
    </div>

    <div class="og-depts">
        ${O.departments.map(dept).join('\n        ')}
    </div>
  </div>
</section>`;

const CSS = fs.readFileSync(path.join(__dirname, 'leadership-page.css'), 'utf8').replace(/\r\n/g, '\n').trim();
const SCRIPT = `<script id="leaders-js">
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.ld-card').forEach(function(c){
    var n=(c.querySelector('.ld-name').textContent||'').trim();
    while(/^(Atty\\.|Dr\\.|Engr\\.|Capt\\.|Prof\\.|Mr\\.|Ms\\.|Mrs\\.|C\\/E|C\\/M|2\\/M|3\\/M)\\s+/i.test(n))n=n.replace(/^\\S+\\s+/,'');
    var w=n.split(/\\s+/).filter(Boolean);
    c.querySelector('.ld-av').textContent=w.length?(w[0][0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase():'';
  });
});
</script>`;

const before = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
let h = before;
const start = h.search(/<section id="(coming-soon|leadership)"/);
const lastId = h.includes('<section id="structure"') ? '<section id="structure"' : '<section id="coming-soon"';
const end = h.indexOf('</section>', h.indexOf(lastId)) + '</section>'.length;
if (start < 0) throw new Error('leadership section not found');
h = h.slice(0, start) + section + h.slice(end);
h = h.replace(/<style id="leaders-modern">[\s\S]*?<\/script>\n/, '');
h = h.replace('<meta name="description"', `<style id="leaders-modern">\n${CSS}\n</style>\n${SCRIPT}\n<meta name="description"`);
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('leadership page built:', PEOPLE.length, 'leaders,', O.departments.length, 'departments');
