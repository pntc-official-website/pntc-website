// Main site > Careers. Modern layout for PNTC Main Landing Page/careers.html.
// The job cards themselves come from the admin (Landing Content > Careers) through admin/careers.js.
// This script restyles the page and re-renders the cards already on it with that same builder.
// Rerunnable:  node tools/careers-page.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const CAREERS = require('../admin/careers.js');
const FILE = path.join(__dirname, '..', 'PNTC Main Landing Page', 'careers.html');
const START = '<!-- PNTC_CAREERS_START -->', END = '<!-- PNTC_CAREERS_END -->';

const dec = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;

const before = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
let h = before;

// 1. job cards: read what is on the page (old or new markup) and render it again
const s = h.indexOf(START), e = h.indexOf(END);
if (s < 0 || e < s) throw new Error('careers markers not found');
const block = h.slice(s + START.length, e);
const pick = (c, cls) => { const m = new RegExp(`class="${cls}[^"]*"[^>]*>([\\s\\S]*?)</(?:div|p|h3|span)>`).exec(c); return m ? dec(m[1].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').replace(/^📍\s*/, '')) : ''; };
const items = (block.match(/<(?:div|article) class="job-card[\s\S]*?(?=<(?:div|article) class="job-card|<\/div>\s*$)/g) || []).map(c => ({
  department: pick(c, 'job-dept'), title: pick(c, 'job-title'), location: pick(c, 'job-meta'), description: pick(c, 'job-desc'), badgeType: pick(c, 'job-badge') || 'Full-Time',
}));
if (!items.length) console.warn('no job cards found on the page');
h = h.slice(0, s + START.length) + '\n' + CAREERS.build(items) + '\n    ' + h.slice(e);

// 2. section around the cards
const secStart = h.indexOf('<section id="careers"');
const secHeadEnd = h.indexOf(START);
const secEnd = h.indexOf('</section>', h.indexOf(END)) + '</section>'.length;
const head = `<section id="careers" class="cr">
  <span class="cr-ghost" aria-hidden="true">Careers</span>
  <div class="careers-wrap">
    <div class="cr-head reveal">
      <p class="eyebrow">${slot('careers.eyebrow', 'Join Our Team')}</p>
      <h2 class="cr-h2"><span class="cr-mark">${slot('careers.mark', 'Careers')}<svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10 C 70 2, 190 2, 297 8" fill="none" stroke="#F3CF33" stroke-width="5" stroke-linecap="round"/></svg></span> ${slot('careers.rest', 'at PNTC')}</h2>
    </div>

    <div class="cr-bar reveal">
      <label class="cr-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input type="search" id="cr-q" placeholder="Search by role or department" aria-label="Search job openings"></label>
      <div class="cr-chips" id="cr-chips" role="group" aria-label="Filter by employment type"></div>
      <p class="cr-count" id="cr-count" aria-live="polite"></p>
    </div>

    `;
const tail = `
    <p class="cr-empty" id="cr-empty" hidden>${slot('careers.empty', 'No openings match your search.')}</p>
  </div>

  <div class="cr-cta reveal">
    <div class="cr-cta-in">
      <div>
        <p class="cr-cta-tag">${slot('careers.cta.tag', 'Apply')}</p>
        <h3 class="cr-cta-h">${slot('careers.cta.title', 'Send your application to our HR office')}</h3>
      </div>
      <a class="cr-cta-btn" id="cr-email" data-c="careers.email" href="mailto:${CAREERS.HR_EMAIL}">${slot('careers.email', CAREERS.HR_EMAIL)}</a>
    </div>
  </div>
</section>`;
h = h.slice(0, secStart) + head + h.slice(secHeadEnd, h.indexOf(END) + END.length) + tail + h.slice(secEnd);

// 3. styles and script
const CSS = fs.readFileSync(path.join(__dirname, 'careers-page.css'), 'utf8').replace(/\r\n/g, '\n').trim();
const SCRIPT = `<script id="careers-js">
document.addEventListener('DOMContentLoaded',function(){
  var cards=[].slice.call(document.querySelectorAll('#careers .job-card')),q=document.getElementById('cr-q'),chips=document.getElementById('cr-chips'),count=document.getElementById('cr-count'),empty=document.getElementById('cr-empty'),mail=document.getElementById('cr-email'),type='All';
  if(!chips)return;
  /* apply buttons follow the HR email shown on the page */
  var addr=mail?(mail.getAttribute('href')||'').replace(/^mailto:/,'').split('?')[0]:'';
  if(addr)cards.forEach(function(c){var a=c.querySelector('.job-apply'),t=c.querySelector('.job-title');if(a)a.href='mailto:'+addr+'?subject='+encodeURIComponent('Application for '+(t?t.textContent.trim():'a position'));});
  var types=['All'];cards.forEach(function(c){var t=c.getAttribute('data-type');if(t&&types.indexOf(t)<0)types.push(t);});
  types.forEach(function(t){var b=document.createElement('button');b.type='button';b.className='cr-chip'+(t==='All'?' on':'');b.textContent=t;b.addEventListener('click',function(){type=t;[].forEach.call(chips.children,function(x){x.classList.toggle('on',x===b);});run();});chips.appendChild(b);});
  if(types.length<3)chips.hidden=true;
  function run(){
    var s=(q.value||'').toLowerCase().trim(),n=0;
    cards.forEach(function(c){var ok=(type==='All'||c.getAttribute('data-type')===type)&&(!s||c.textContent.toLowerCase().indexOf(s)>-1);c.hidden=!ok;if(ok){n++;c.classList.add('in');}});
    count.textContent=n+(n===1?' opening':' openings');
    empty.hidden=n>0;
  }
  q.addEventListener('input',run);run();
});
</script>`;
h = h.replace(/<style id="careers-modern">[\s\S]*?<\/script>\n/, '');
h = h.replace('<meta name="description"', `<style id="careers-modern">\n${CSS}\n</style>\n${SCRIPT}\n<meta name="description"`);
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('careers page built:', items.length, 'job cards');
