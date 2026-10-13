// SHS > Strands: detailed strand guide below the intro. One card per strand, grouped by track,
// with an interest filter. Text comes from the strand descriptions already on the SHS site.
// SHS keeps its own palette (navy #181D71, yellow #FFCC00, green #00925D).
// Rerunnable:  node tools/shs-strands.js
const fs = require('fs');
const FILE = require('path').join(__dirname, '..', 'SHS', 'strands.html');
const C = require('../admin/content.js');
const slot = (key, inner) => '<!--c:' + key + '-->' + inner + '<!--/c-->';
const sid = c => 'shs.strand.' + c.toLowerCase() + '.';
const NAVY = '#181D71', YEL = '#FFCC00', GREEN = '#00925D';

const TRACKS = {
  academic: { name: 'Academic Track', desc: "PNTC's Academic Track prepares students for college and university. Each program is designed around a specific career path." },
  techpro: { name: 'Technical-Professional Track', desc: 'The Technical-Professional Track gives students practical maritime skills recognized by TESDA and STCW, preparing them for employment in the maritime industry after graduation.' },
};
// interests: maritime, tourism, science, humanities, uniformed
const STRANDS = [
  { code: 'ADSC', track: 'academic', name: "Doorway to Ship's Catering", tags: ['maritime', 'tourism'],
    desc: "Culinary arts foundation tailored for careers in ship's catering and maritime hospitality aboard merchant vessels.",
    focus: ['Culinary Arts'], leads: ["Ship's Catering", 'Maritime Hospitality'] },
  { code: 'ADT', track: 'academic', name: 'Doorway to Tourism', tags: ['tourism'],
    desc: 'A foundation in hospitality, travel management, and tourism operations, suited for degrees in Hotel and Restaurant Management or Tourism.',
    focus: ['Hospitality', 'Travel Management', 'Tourism Operations'], leads: ['Hotel and Restaurant Management', 'Tourism'] },
  { code: 'ADMarE', track: 'academic', name: 'Doorway to Marine Engineering', tags: ['maritime', 'science'],
    desc: 'A pre-engineering track designed to give students a strong foundation before entering BS Marine Engineering at PNTC Colleges.',
    focus: ['Pre-Engineering'], leads: ['BS Marine Engineering'], next: ['BS Marine Engineering at PNTC Colleges', '/college/programs#prog-bsmare'] },
  { code: 'ADMT', track: 'academic', name: 'Doorway to Marine Transportation', tags: ['maritime'],
    desc: "A pre-maritime deck track for aspiring ship officers and the direct academic path to PNTC's BS Marine Transportation program.",
    focus: ['Pre-Maritime Deck'], leads: ['Ship Officer', 'BS Marine Transportation'], next: ['BS Marine Transportation at PNTC Colleges', '/college/programs#prog-bsmt'] },
  { code: 'AESH', track: 'academic', name: 'English, Social Sciences and Humanities', tags: ['humanities'],
    desc: 'A humanities track that develops communication, critical thinking, and social science skills, suited for studies in law, communication, psychology, and education.',
    focus: ['Communication', 'Critical Thinking', 'Social Science'], leads: ['Law', 'Communication', 'Psychology', 'Education'] },
  { code: 'ASTEM', track: 'academic', name: 'Science, Technology, Engineering and Mathematics', tags: ['science'],
    desc: 'A strong STEM foundation in physics, chemistry, biology, and advanced mathematics that prepares students for degrees in engineering, medicine, and technology.',
    focus: ['Physics', 'Chemistry', 'Biology', 'Advanced Mathematics'], leads: ['Engineering', 'Medicine', 'Technology'] },
  { code: 'AUP', track: 'academic', name: 'Uniformed Personnel', tags: ['uniformed'],
    desc: 'Structured academic track for students pursuing careers in the military, police, coast guard, fire protection, or other government uniformed services.',
    focus: [], leads: ['Military', 'Police', 'Coast Guard', 'Fire Protection'] },
  { code: 'TPDM', track: 'techpro', name: 'Doorway to Maritime', tags: ['maritime'],
    desc: 'An introductory technical maritime program covering basic seamanship, deck operations, and safety protocols. It prepares students for maritime careers or advanced Tech-Pro studies.',
    focus: ['Basic Seamanship', 'Deck Operations', 'Safety Protocols'], leads: ['Ordinary Seaman', 'Entry-Level Maritime'] },
  { code: 'TPM', track: 'techpro', name: 'Maritime (Tech-Pro)', tags: ['maritime'],
    desc: 'Full technical maritime training with STCW certifications and TESDA NC qualifications. Graduates are qualified to work as Able Seamen or Engine Cadets in international shipping fleets.',
    focus: ['STCW Certified', 'TESDA Certified'], leads: ['Able Seaman', 'Engine Cadet'] },
];
const INTERESTS = [['all', 'All Strands'], ['maritime', 'Maritime'], ['tourism', 'Tourism and Hospitality'], ['science', 'Science and Engineering'], ['humanities', 'Humanities'], ['uniformed', 'Uniformed Service']];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const id = c => 'strand-' + c.toLowerCase();
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const card = (s, n) => `        <article class="sg-card sg-${s.track}" id="${id(s.code)}" data-tags="${s.tags.join(' ')}">
          <header><span class="sg-code">${esc(s.code)}</span><span class="sg-num" aria-hidden="true">${String(n).padStart(2, '0')}</span></header>
          <h3>${slot(sid(s.code) + 'name', esc(s.name))}</h3>
          <p class="sg-desc">${slot(sid(s.code) + 'desc', esc(s.desc))}</p>
${s.focus.length ? `          <div class="sg-row"><span>What you focus on</span><ul>${slot(sid(s.code) + 'focus', s.focus.map(f => `<li>${esc(f)}</li>`).join(''))}</ul></div>\n` : ''}          <div class="sg-row sg-leads"><span>Where it leads</span><ul>${slot(sid(s.code) + 'leads', s.leads.map(f => `<li>${esc(f)}</li>`).join(''))}</ul></div>
${s.next ? `          <a class="sg-next" href="${s.next[1]}">Continue to ${esc(s.next[0])} ${ARROW}</a>\n` : ''}        </article>`;

let n = 0;
const trackBlock = key => {
  const list = STRANDS.filter(s => s.track === key);
  return `    <div class="sg-track sg-t-${key}" data-track="${key}">
      <div class="sg-track-head">
        <div><p class="sg-kicker">${list.length} Programs</p><h2>${TRACKS[key].name}</h2></div>
        <p>${slot('shs.track.' + key + '.desc', esc(TRACKS[key].desc))}</p>
      </div>
      <div class="sg-grid">
${list.map(s => card(s, ++n)).join('\n')}
      </div>
    </div>`;
};

const section = `<section id="strand-guide" class="sg">
  <div class="sg-in">
    <div class="sg-head">
      <p class="sg-kicker">Find Your Strand</p>
      <h2>Nine Programs in <span>Two Tracks</span></h2>
      <p>Pick what you are interested in to see the strands that fit. Each strand shows what you will focus on and where it can lead.</p>
      <div class="sg-chips" role="group" aria-label="Show strands for">
${INTERESTS.map(([k, l], i) => `        <button type="button" class="sg-chip${i ? '' : ' on'}" data-i="${k}">${l}</button>`).join('\n')}
      </div>
    </div>
${trackBlock('academic')}
${trackBlock('techpro')}
    <div class="sg-cta">
      <p>Found the strand for you?</p>
      <a href="/shs/admissions#admission" class="sg-btn">Enroll Now ${ARROW}</a>
    </div>
  </div>
  <script>
  (function(){
    var root=document.getElementById('strand-guide');if(!root)return;
    var chips=[].slice.call(root.querySelectorAll('.sg-chip')),cards=[].slice.call(root.querySelectorAll('.sg-card'));
    function apply(k){
      chips.forEach(function(c){c.classList.toggle('on',c.getAttribute('data-i')===k);});
      cards.forEach(function(c){c.hidden=!(k==='all'||(' '+c.getAttribute('data-tags')+' ').indexOf(' '+k+' ')>=0);});
      [].forEach.call(root.querySelectorAll('.sg-track'),function(t){t.hidden=![].some.call(t.querySelectorAll('.sg-card'),function(c){return !c.hidden;});});
    }
    chips.forEach(function(c){c.addEventListener('click',function(){apply(c.getAttribute('data-i'));});});
    // a link to one strand always shows it, even if a filter is on
    function fromHash(){var t=location.hash&&root.querySelector(location.hash);if(t&&t.classList.contains('sg-card'))apply('all');}
    window.addEventListener('hashchange',fromHash);fromHash();
  })();
  </script>
</section>`;

const CSS = `<style id="strand-guide-css">
/* SHS strands page: clearer intro heading and the detailed strand guide */
#shs-section .shs-h2{color:${NAVY};text-shadow:none}
#shs-section .shs-body{color:#3d4160}
.sg{background:#fff;padding:clamp(3.5rem,7vw,6rem) clamp(1.1rem,5vw,4.5rem);font-family:'Montserrat',sans-serif;color:${NAVY};scroll-margin-top:120px}
.sg-in{max-width:1200px;margin:0 auto}
.sg-kicker{font-size:.72rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${GREEN};margin:0 0 .6rem}
.sg-head{text-align:center;max-width:780px;margin:0 auto clamp(2.2rem,4vw,3.2rem)}
.sg-head h2{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(2.3rem,5vw,3.6rem);line-height:1;text-transform:uppercase;margin:0 0 .9rem;color:${NAVY}}
.sg-head h2 span{background:linear-gradient(transparent 60%,${YEL} 60%);padding:0 .1em}
.sg-head>p{font-size:1rem;line-height:1.7;color:#3d4160;margin:0 0 1.5rem}
.sg-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem}
.sg-chip{font-family:'Montserrat',sans-serif;font-size:.82rem;font-weight:700;color:${NAVY};background:#fff;border:1.5px solid rgba(24,29,113,.22);border-radius:999px;padding:.55rem 1.15rem;cursor:pointer;transition:background .2s,color .2s,border-color .2s,transform .2s}
.sg-chip:hover{border-color:${NAVY};transform:translateY(-2px)}
.sg-chip.on{background:${NAVY};color:#fff;border-color:${NAVY}}
.sg-track{--t:${NAVY};margin-bottom:clamp(2.5rem,5vw,3.8rem)}
.sg-track[hidden]{display:none}
.sg-t-techpro{--t:${GREEN}}
.sg-track-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:1rem 3rem;align-items:end;border-left:6px solid var(--t);padding-left:1.2rem;margin-bottom:1.5rem}
.sg-track-head .sg-kicker{color:var(--t)}
.sg-track-head h2{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(1.8rem,3.4vw,2.6rem);line-height:1;text-transform:uppercase;margin:0;color:${NAVY}}
.sg-track-head>p{margin:0;font-size:.95rem;line-height:1.7;color:#3d4160}
.sg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(.9rem,1.6vw,1.3rem)}
.sg-t-techpro .sg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.sg-card{position:relative;display:flex;flex-direction:column;background:linear-gradient(165deg,#fff 0%,#F5F7FF 100%);border:1px solid rgba(24,29,113,.12);border-radius:22px;padding:clamp(1.2rem,2vw,1.6rem);overflow:hidden;scroll-margin-top:140px;transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s,border-color .3s}
.sg-card[hidden]{display:none}
.sg-card::before{content:'';position:absolute;left:0;top:0;right:0;height:6px;background:var(--t)}
.sg-card:hover{transform:translateY(-6px);box-shadow:0 26px 44px -26px rgba(24,29,113,.55);border-color:var(--t)}
.sg-card:target{box-shadow:0 0 0 3px ${YEL},0 26px 44px -26px rgba(24,29,113,.55)}
.sg-card header{display:flex;align-items:flex-start;justify-content:space-between;margin:.4rem 0 .9rem}
.sg-code{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(1.5rem,2.4vw,2rem);line-height:1;letter-spacing:.03em;background:var(--t);color:#fff;padding:.42rem .85rem;border-radius:12px}
.sg-techpro .sg-code{color:#fff}
.sg-num{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:2.6rem;line-height:.9;color:transparent;-webkit-text-stroke:1.5px rgba(24,29,113,.18)}
.sg-card h3{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:clamp(1.25rem,1.9vw,1.5rem);line-height:1.12;text-transform:uppercase;margin:0 0 .6rem;color:${NAVY}}
.sg-desc{font-size:.9rem;line-height:1.65;color:#3d4160;margin:0 0 1.1rem}
.sg-row{margin-top:auto;padding-top:.2rem}
.sg-row+.sg-row{margin-top:.9rem}
.sg-row>span{display:block;font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(24,29,113,.6);margin-bottom:.45rem}
.sg-row ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.35rem}
.sg-row li{font-size:.76rem;font-weight:600;color:${NAVY};background:rgba(24,29,113,.07);border-radius:999px;padding:.3rem .7rem}
.sg-leads li{background:${YEL};color:${NAVY};font-weight:700}
.sg-next{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.1rem;font-size:.8rem;font-weight:700;color:${NAVY};text-decoration:none;border-top:1px dashed rgba(24,29,113,.25);padding-top:.9rem}
.sg-next svg,.sg-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s;flex:none}
.sg-next:hover svg,.sg-btn:hover svg{transform:translateX(4px)}
.sg-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem 2rem;background:${NAVY};color:#fff;border-radius:24px;padding:clamp(1.4rem,3vw,2.2rem) clamp(1.4rem,3.5vw,2.8rem)}
.sg-cta p{margin:0;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(1.6rem,3vw,2.3rem);line-height:1;text-transform:uppercase}
.sg-btn{display:inline-flex;align-items:center;gap:.6rem;background:${YEL};color:${NAVY};font-weight:800;font-size:.9rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:.95rem 1.8rem;border-radius:999px;transition:transform .2s,box-shadow .2s}
.sg-btn:hover{transform:translateY(-3px);box-shadow:0 14px 26px -12px rgba(255,204,0,.7)}
@media(max-width:1000px){.sg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sg-track-head{grid-template-columns:minmax(0,1fr)}}
@media(max-width:640px){.sg-grid,.sg-t-techpro .sg-grid{grid-template-columns:minmax(0,1fr)}.sg-chips{justify-content:flex-start;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 -1.1rem;padding:0 1.1rem .3rem}.sg-chips::-webkit-scrollbar{display:none}.sg-chip{flex:none}.sg-head{text-align:left}}
@media(prefers-reduced-motion:reduce){.sg-card,.sg-chip,.sg-btn{transition:none}}
</style>
`;

let h = fs.readFileSync(FILE, 'utf8');
const before = h;
if (h.includes('<section id="strand-guide"')) {
  const a = h.indexOf('<section id="strand-guide"'), b = h.indexOf('</section>', h.indexOf('</script>', a)) + '</section>'.length;
  h = h.slice(0, a) + section + h.slice(b);
} else {
  const a = h.indexOf('<section class="shs-section" id="shs-section">'), b = h.indexOf('</section>', a) + '</section>'.length;
  if (a < 0) throw new Error('intro section not found');
  h = h.slice(0, b) + '\n\n' + section + h.slice(b);
}
// intro chips jump to each strand's card instead of the pop-up lists
for (const s of STRANDS) {
  const re = new RegExp('<a href="#(?:modal-academic|modal-techpro|strand-[a-z]+)" class="(strand-chip[^"]*)">' + s.code + '</a>');
  if (!re.test(h)) throw new Error('chip not found: ' + s.code);
  h = h.replace(re, `<a href="#${id(s.code)}" class="$1">${s.code}</a>`);
}
h = h.replace(/<style id="strand-guide-css">[\s\S]*?<\/style>\n?/, '');
h = h.replace('</head>', CSS + '</head>');
h = C.preserveSlots(before, h);   // keep strand texts edited in the admin
fs.writeFileSync(FILE, h);
console.log('strand guide built with', STRANDS.length, 'strands');
