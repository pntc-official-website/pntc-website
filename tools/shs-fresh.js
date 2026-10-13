// Senior High School: keeps the playful format and adds life to it (scroll pop-ins, tilted card pile, running strip,
// taped photos, numbers that count up). Also wires up links that went nowhere and marks texts for the admin.
// Rerunnable:  node tools/shs-fresh.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const DIR = path.join(__dirname, '..', 'SHS');
const CSS = fs.readFileSync(path.join(__dirname, 'shs-fresh.css'), 'utf8').replace(/\r\n/g, '\n').trim();
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;
const hasSlot = (h, key) => h.includes(`<!--c:${key}-->`);

const SCRIPT = `<script id="shs-fresh-js">
document.addEventListener('DOMContentLoaded',function(){
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* buttons in the hero go somewhere */
  var go={'.hero .btn-enroll':'/shs/admissions#admission','.hero .btn-learn':'#shs-section'};
  Object.keys(go).forEach(function(s){var b=document.querySelector(s);if(b)b.addEventListener('click',function(){var t=go[s];if(t.charAt(0)==='#'){var e=document.querySelector(t);if(e)e.scrollIntoView({behavior:still?'auto':'smooth'});}else location.href=t;});});
  var arrow=document.querySelector('.hero-arrow');if(arrow)arrow.addEventListener('click',function(){var e=document.getElementById('shs-section');if(e)e.scrollIntoView({behavior:still?'auto':'smooth'});});
  if(!('IntersectionObserver' in window))return;
  /* pop in on scroll */
  var groups=[['.shs-img-wrap,.shs-label,.shs-h2,.shs-body,.shs-actions',.08],['.shs-strands .strand-chip',.05],['.usp-intro',0],['.usp-stack',.09],['.usp-stats',0],['.ew-header',0],['.ew-photo-card',.12],['.events-header',0],['.ev-card',.08],['.adm-section > *',.06]];
  var all=[];
  groups.forEach(function(g){[].forEach.call(document.querySelectorAll(g[0]),function(el,i){el.classList.add('fx');el.style.setProperty('--fxd',(i*g[1]).toFixed(2)+'s');all.push(el);});});
  document.documentElement.classList.add('fx-on');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('fx-in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  all.forEach(function(el){io.observe(el);});
  /* safety net: anything on screen is shown even if the observer never fires */
  function sweep(){all.forEach(function(el){if(el.classList.contains('fx-in'))return;var r=el.getBoundingClientRect();if(r.top<innerHeight*.96&&r.bottom>0)el.classList.add('fx-in');});}
  setTimeout(sweep,900);window.addEventListener('scroll',sweep,{passive:true});window.addEventListener('load',sweep);
  /* light follows the pointer across the cards */
  [].forEach.call(document.querySelectorAll('.stack-face'),function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');c.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');});});
  /* numbers count up */
  var band=document.querySelector('.usp-stats');
  if(band&&!still){
    var items=[].slice.call(band.querySelectorAll('.usp-stat-num')).map(function(el){var m=/^([\\d,]+)(.*)$/.exec(el.textContent.trim());return m?{el:el,to:parseInt(m[1].replace(/,/g,''),10),tail:m[2]}:null;}).filter(Boolean);
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io2.disconnect();var t0=performance.now();(function tick(now){var p=Math.min(1,(now-t0)/1300),k=1-Math.pow(1-p,3);items.forEach(function(i){i.el.textContent=Math.round(i.to*k)+i.tail;});if(p<1)requestAnimationFrame(tick);})(t0);});},{threshold:.4});
    io2.observe(band);
  }
});
</script>`;

function inject(h) {
  h = h.replace(/<style id="shs-fresh">[\s\S]*?<\/style>\n<script id="shs-fresh-js">[\s\S]*?<\/script>\n/, '');
  return h.replace('</head>', `<style id="shs-fresh">\n${CSS}\n</style>\n${SCRIPT}\n</head>`);
}

// ── home page ──
{
  const file = path.join(DIR, 'index.html');
  const before = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  let h = before;

  // strand chips open the matching card on the Strands page
  h = h.replace(/<a href="#modal-(?:academic|techpro)" class="(strand-chip[^"]*)">([A-Za-z]+)<\/a>/g, (_, cls, code) => `<a href="/shs/strands#strand-${code.toLowerCase()}" class="${cls}">${code}</a>`);
  // the Enroll Today button beside the heading
  h = h.replace('<a href="#" class="usp-cta-btn">', '<a href="/shs/admissions#admission" class="usp-cta-btn">');

  // running strip between the program block and the cards
  if (!h.includes('class="shs-ticker"')) {
    const words = [slot('shs.ticker1', '#OnwardPNTC'), slot('shs.ticker2', 'Spread Your Strands')];
    const run = Array.from({ length: 8 }, (_, i) => `<span>${words[i % 2]}</span>`).join('');
    const at = h.indexOf('<!-- USP SECTION');
    if (at < 0) throw new Error('USP section not found');
    h = h.slice(0, at) + `<!-- RUNNING STRIP -->\n<div class="shs-ticker-wrap"><div class="shs-ticker" aria-hidden="true"><div class="shs-ticker-track">${run}${run}</div></div></div>\n\n` + h.slice(at);
  }
  if (!h.includes('class="shs-ticker-wrap"')) h = h.replace(/<div class="shs-ticker" aria-hidden="true">[\s\S]*?<\/div><\/div>/, m => '<div class="shs-ticker-wrap">' + m + '</div>');

  // card texts and numbers become editable
  let n = 0;
  h = h.replace(/<h3 class="stack-title">([^<]*)<\/h3>\s*<p class="stack-body">([^<]*)<\/p>/g, (m, t, b) => { n++; return `<h3 class="stack-title">${slot(`shs.why${n}.title`, t)}</h3>\n          <p class="stack-body">${slot(`shs.why${n}.body`, b)}</p>`; });
  let s = 0;
  h = h.replace(/<div class="usp-stat-num">([^<]*)<\/div>\s*<div class="usp-stat-label">([^<]*)<\/div>/g, (m, num, lbl) => {
    s++;
    if (/employment/i.test(lbl)) { num = 'Growing'; lbl = 'Stronger'; }      // the school does not quote an employment rate
    return `<div class="usp-stat-num">${slot(`shs.stat${s}.n`, num)}</div>\n      <div class="usp-stat-label">${slot(`shs.stat${s}.l`, lbl)}</div>`;
  });
  if (!hasSlot(h, 'shs.why.eyebrow')) {
    h = h.replace('<p class="usp-eyebrow">Why Choose PNTC</p>', `<p class="usp-eyebrow">${slot('shs.why.eyebrow', 'Why Choose PNTC')}</p>`);
    h = h.replace('<h2 class="usp-heading">Built for the<br><em>Future You.</em></h2>', `<h2 class="usp-heading">${slot('shs.why.line1', 'Built for the')}<br><em>${slot('shs.why.line2', 'Future You.')}</em></h2>`);
    h = h.replace(/<p class="usp-sub">([^<]*)<\/p>/, (m, t) => `<p class="usp-sub">${slot('shs.why.sub', t)}</p>`);
  }
  h = inject(h);
  h = C.preserveSlots(before, h);
  fs.writeFileSync(file, h);
  console.log('index.html updated');
}

// ── other pages that share the same blocks ──
for (const name of ['student-life.html', 'admissions.html', 'strands.html']) {
  const file = path.join(DIR, name);
  let h = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  h = inject(h);
  fs.writeFileSync(file, h);
  console.log(name, 'updated');
}
