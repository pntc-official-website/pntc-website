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
// A titled set of cards
const set = (label, ids, cols = 4) => `<div class="lc-set">
          <p class="lc-lbl reveal">${label}</p>
          <div class="lc-grid lc-g${cols}">
          ${ids.map(id => card(id, 'reveal')).join('\n          ')}
          </div>
        </div>`;
const block = (key, title, sets) => `<section class="lc-block">
        <h3 class="lc-h3 reveal"><span>${slot(key, title)}</span></h3>
        ${sets.join('\n        ')}
      </section>`;

const section = `<section id="leadership" class="ld">
  <span class="ld-ghost" aria-hidden="true">PNTC</span>
  <div class="ld-wrap">
    <div class="ld-head reveal">
      <p class="eyebrow">${slot('lead.eyebrow', 'Leadership')}</p>
      <h2 class="ld-h2"><span class="ld-mark">${slot('lead.mark', 'The People')}<svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10 C 70 2, 190 2, 297 8" fill="none" stroke="#F3CF33" stroke-width="5" stroke-linecap="round"/></svg></span> ${slot('lead.rest', 'Who Lead PNTC')}</h2>
    </div>

    <div class="lc-exec">
      <div class="lc-top">
        ${card('chairman', 'ld-big reveal')}
        ${card('president', 'ld-big reveal')}
      </div>
      <div class="lc-grid lc-g3 lc-vps">
        ${['vp-acad', 'vp-admin', 'vp-training'].map(id => card(id, 'ld-vp reveal')).join('\n        ')}
      </div>
    </div>

    <div class="lt-toggle reveal" role="tablist" aria-label="Choose a group">
      <button type="button" class="on" role="tab" aria-selected="true" data-panel="panel-colleges">${slot('lead.tree1', 'PNTC Colleges')}</button>
      <button type="button" role="tab" aria-selected="false" data-panel="panel-training">${slot('lead.tree2', 'Maritime Training Center')}</button>
    </div>

    <div class="lc-panel" id="panel-colleges">
      ${block('lead.acad', 'Academics', [
        set('Deans and Principal', ['dean-maritime', 'dean-business', 'dean-crim', 'dean-osa', 'principal-shs'], 5),
        set('Heads', ['head-bsmt', 'head-bsmare', 'head-obt', 'head-gened', 'head-registrar'], 5),
      ])}
      ${block('lead.admin', 'Administration', [
        set('Managers, Heads and Supervisors', ['mgr-college', 'sup-marketing', 'head-quality', 'sup-finance', 'head-research', 'sup-hrdm'], 3),
      ])}
    </div>

    <div class="lc-panel" id="panel-training">
      ${block('lead.tree2', 'Maritime Training Center', [
        set('Managers and Heads', ['mgr-mtc', 'head-quality'], 2),
      ])}
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
  /* Colleges or Training Center, one at a time */
  var tabs=document.querySelectorAll('.lt-toggle button');
  function show(id){
    tabs.forEach(function(b){var on=b.dataset.panel===id;b.classList.toggle('on',on);b.setAttribute('aria-selected',on?'true':'false');});
    document.querySelectorAll('.lc-panel').forEach(function(x){x.hidden=x.id!==id;if(x.id===id)x.querySelectorAll('.reveal').forEach(function(r){r.classList.add('in');});});
  }
  tabs.forEach(function(b){b.addEventListener('click',function(){show(b.dataset.panel);});});
  show(location.hash==='#training'?'panel-training':'panel-colleges');
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
