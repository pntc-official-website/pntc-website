// Directory pages (College and SHS): quick facts, search, filters and modern office cards.
// Both pages show the same admin-managed office list, so they are built from one place and stay mirrored.
// The office list itself (between the PNTC_DIRECTORY markers) is written by the admin and is not touched here.
// Rerunnable:  node tools/college-directory.js
const fs = require('fs');
const path = require('path');

const PAGES = [
  { file: 'PNTC Colleges/directory.html', navy: '#1C1650', gold: '#F3CF33' },
  { file: 'SHS/directory.html', navy: '#181D71', gold: '#FFCC00' },   // SHS keeps its own palette
];
const HOURS = 'Monday to Friday, 7:00 AM to 5:30 PM';

const ICON = {
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
};
const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

const head = `<section id="directory">
  <div class="directory-wrap">
    <div class="dx-facts">
      <div class="dx-fact">${svg('pin')}<div><span>Where</span><strong>PNTC Colleges campus, Dasmariñas, Cavite</strong></div></div>
      <div class="dx-fact">${svg('clock')}<div><span>Office Hours</span><strong>${HOURS}</strong></div></div>
      <div class="dx-fact">${svg('phone')}<div><span>Trunk Line</span><strong><a href="tel:+63464388835">(046) 438-8835</a></strong></div></div>
    </div>
    <div class="dx-bar">
      <div>
        <p class="eyebrow" style="margin-bottom:.5rem;">Contact and Directory</p>
        <h2 class="sec-h2">Find the Right <span>Office</span></h2>
      </div>
      <label class="dx-search">${svg('search')}<input type="search" id="dxSearch" placeholder="Search an office or a need, like grades or uniform" autocomplete="off" aria-label="Search the directory"></label>
    </div>
    <div class="dx-chips" id="dxChips" role="group" aria-label="Show">
      <button type="button" class="dx-chip on" data-g="all">All</button>
      <button type="button" class="dx-chip" data-g="office">Student Services</button>
      <button type="button" class="dx-chip" data-g="college">Colleges and Training</button>
    </div>
    <p class="dx-empty" id="dxEmpty" hidden>No office matches that search. Try a different word, or call the trunk line.</p>

    `;

// Reads whatever cards the admin published and turns the contacts into clear rows.
// Handles emails, phone numbers and Facebook entries (a page name, with or without a link).
const SCRIPT = `<script id="dir-enhance">
(function(){
  var grid=document.querySelector('#directory .dir-grid');if(!grid)return;
  var cards=[].slice.call(grid.querySelectorAll('.dir-card'));
  var MAIL='${svg('mail')}',TEL='${svg('phone')}',FB='${svg('fb')}';
  var COLORS=[[/maritime education/i,'#1244B8'],[/tourism/i,'#1d661d'],[/criminal/i,'#8a1818'],[/business|customs/i,'#2a2a80']];
  function row(el,cls,icon,text){el.className='dx-c '+cls;el.innerHTML=icon+'<em></em>';el.querySelector('em').textContent=text;}
  cards.forEach(function(c){
    var name=(c.querySelector('.dir-name')||{}).textContent||'';
    c.setAttribute('data-g',/^\\s*college of|training/i.test(name)?'college':'office');
    COLORS.forEach(function(p){if(/^\\s*college of/i.test(name)&&p[0].test(name))c.style.setProperty('--acc',p[1]);});
    [].forEach.call(c.querySelectorAll('.dir-contacts > *'),function(a){
      var href=a.getAttribute('href')||'',t=a.textContent.replace(/\\s+/g,' ').trim(),fbName=t.replace(/^facebook\\s*:?\\s*/i,'');
      if(a.classList.contains('dir-fb')||/facebook\\.com|fb\\.com/i.test(href)){
        row(a,'dx-fb',FB,/^https?:/i.test(fbName)?'Facebook page':fbName);a.title='Facebook page';
        if(href){a.target='_blank';a.rel='noopener';}
      }else if(/^mailto:/i.test(href)&&href.indexOf('@')<0){
        var s=document.createElement('span');row(s,'dx-fb',FB,fbName);s.title='Facebook page';a.parentNode.replaceChild(s,a);
      }else if(/^mailto:/i.test(href)){row(a,'dx-mail',MAIL,t);
      }else if(/^tel:/i.test(href)){row(a,'dx-tel',TEL,t);
      }else{a.classList.add('dx-c');}
    });
  });
  document.getElementById('directory').classList.add('dx-on');
  var q=document.getElementById('dxSearch'),chips=[].slice.call(document.querySelectorAll('.dx-chip')),empty=document.getElementById('dxEmpty'),g='all';
  function apply(){
    var s=(q.value||'').toLowerCase().trim(),n=0;
    cards.forEach(function(c){var ok=(g==='all'||c.getAttribute('data-g')===g)&&(!s||c.textContent.toLowerCase().indexOf(s)>=0);c.hidden=!ok;if(ok)n++;});
    empty.hidden=n>0;
  }
  q.addEventListener('input',apply);
  chips.forEach(function(b){b.addEventListener('click',function(){g=b.getAttribute('data-g');chips.forEach(function(x){x.classList.toggle('on',x===b);});apply();});});
})();
</script>
`;

const css = (N, GOLD) => `<style id="dir-modern">
/* Directory: quick facts, search, filters and modern office cards */
#directory{background:#fff!important;padding:clamp(2.5rem,5vw,4rem) clamp(1rem,4vw,3rem) clamp(4rem,7vw,6rem)!important;--dxf:var(--font,'Montserrat',sans-serif);font-family:var(--dxf)}
.dx-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.9rem;background:${N};border-radius:24px;padding:clamp(1rem,2vw,1.4rem);margin-bottom:clamp(2rem,4vw,3rem);position:relative;overflow:hidden}
.dx-facts::before{content:'';position:absolute;inset:0;background:radial-gradient(40% 90% at 96% 0%,${GOLD}38,transparent 70%);pointer-events:none}
.dx-fact{position:relative;display:flex;align-items:center;gap:.9rem;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:1rem 1.1rem}
.dx-fact svg{flex:none;width:42px;height:42px;padding:10px;border-radius:12px;background:${GOLD};fill:none;stroke:${N};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.dx-fact span{display:block;font-family:var(--dxf);font-size:.66rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${GOLD};margin-bottom:.2rem}
.dx-fact strong{font-family:var(--dxf);font-size:.92rem;font-weight:600;line-height:1.35;color:#fff}
.dx-fact a{color:#fff;text-decoration:none}
.dx-bar{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1.2rem 2rem;margin-bottom:1.1rem}
#directory .dx-bar .eyebrow{color:${N}!important;opacity:.7}
#directory .dx-bar .sec-h2{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(2.2rem,4.6vw,3.4rem);line-height:1;letter-spacing:0;text-transform:uppercase;color:${N};margin:0}
#directory .dx-bar .sec-h2 span{background:linear-gradient(transparent 62%,${GOLD}cc 62%);padding:0 .1em}
.dx-search{flex:1 1 320px;max-width:480px;display:flex;align-items:center;gap:.7rem;background:#fff;border:1.5px solid ${N}33;border-radius:999px;padding:.2rem 1.1rem;transition:border-color .2s,box-shadow .2s}
.dx-search:focus-within{border-color:${N};box-shadow:0 0 0 4px ${GOLD}73}
.dx-search svg{flex:none;width:20px;height:20px;fill:none;stroke:${N};stroke-width:2.2;stroke-linecap:round}
.dx-search input{flex:1;min-width:0;border:0;outline:0;background:none;font-family:var(--dxf);font-size:.92rem;color:${N};padding:.8rem 0}
.dx-search input::placeholder{color:${N};opacity:.5}
.dx-chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.6rem}
.dx-chip{font-family:var(--dxf);font-size:.8rem;font-weight:700;color:${N};background:#fff;border:1.5px solid ${N}33;border-radius:999px;padding:.5rem 1.1rem;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.dx-chip:hover{border-color:${N}}
.dx-chip.on{background:${N};color:#fff;border-color:${N}}
.dx-empty{font-family:var(--dxf);font-size:.92rem;color:${N};border:1px dashed ${N}4d;border-radius:16px;padding:1.2rem 1.4rem;margin:0 0 1.2rem}
#directory .dir-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(.9rem,1.6vw,1.3rem)}
#directory .dir-card{--acc:${N};position:relative;display:flex;flex-direction:column;background:linear-gradient(165deg,#fff,#F7F7FB);border:1px solid #E6E7E8;border-radius:22px;padding:1.5rem 1.5rem 1.3rem;overflow:hidden;opacity:1;transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s,border-color .3s}
#directory .dir-card[hidden]{display:none}
#directory .dir-card::before{content:'';position:absolute;left:0;top:0;right:0;height:6px;background:var(--acc)}
#directory .dir-card:hover{transform:translateY(-6px);box-shadow:0 26px 44px -26px ${N}8c;border-color:var(--acc)}
#directory .dir-ico{width:54px;height:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:${N};box-shadow:0 10px 20px -10px ${N}b3;margin:.4rem 0 1rem;transition:transform .35s cubic-bezier(.2,.7,.2,1)}
#directory .dir-card:hover .dir-ico{transform:rotate(-8deg) scale(1.08)}
#directory .dir-name{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1.4rem;line-height:1.1;text-transform:uppercase;color:${N};margin-bottom:.5rem}
#directory .dir-desc{font-family:var(--dxf);font-size:.88rem;line-height:1.6;color:${N};opacity:.78;margin-bottom:1.1rem}
#directory .dir-contacts{margin-top:auto;display:grid;gap:.4rem;font-family:var(--dxf);font-size:.84rem;border-top:1px dashed ${N}33;padding-top:1rem}
#directory .dir-contacts a{white-space:normal;overflow:visible;color:${N}}
#directory.dx-on .dx-c{display:flex;align-items:center;gap:.65rem;font-weight:600;color:${N};text-decoration:none;border-radius:12px;padding:.45rem .55rem;margin:0 -.55rem;transition:background .2s}
#directory.dx-on a.dx-c:hover{background:${GOLD}59;color:${N}}
#directory.dx-on .dx-c svg{flex:none;width:30px;height:30px;padding:7px;border-radius:9px;background:${N}14;fill:none;stroke:${N};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#directory.dx-on .dx-fb svg{fill:${N};stroke:none}
#directory.dx-on .dx-c em{font-style:normal;min-width:0;overflow-wrap:anywhere}
#directory.dx-on .dx-fb{font-weight:500}
@media(max-width:960px){#directory .dir-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:860px){.dx-facts{grid-template-columns:minmax(0,1fr)}}
@media(max-width:600px){#directory .dir-grid{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){#directory .dir-card,#directory .dir-ico{transition:none}}
</style>
`;

for (const p of PAGES) {
  const FILE = path.join(__dirname, '..', p.file);
  let h = fs.readFileSync(FILE, 'utf8');
  const secStart = h.indexOf('<section id="directory">'), marker = h.indexOf('<!-- PNTC_DIRECTORY_START -->');
  if (secStart < 0 || marker < secStart) throw new Error('directory section or marker not found in ' + p.file);
  h = h.slice(0, secStart) + head + h.slice(marker);
  h = h.replace(/<script id="dir-enhance">[\s\S]*?<\/script>\n?/, '');
  h = h.replace('</body>', SCRIPT + '</body>');
  h = h.replace(/<style id="dir-modern">[\s\S]*?<\/style>\n?/, '');
  h = h.replace('</head>', css(p.navy, p.gold) + '</head>');
  fs.writeFileSync(FILE, h);
  console.log('directory updated:', p.file);
}
