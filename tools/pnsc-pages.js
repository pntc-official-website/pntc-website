// PhilNautical Shipping Corporation (PNSC): the overview page with MV Aman Sinaya, and the On Board Training Program page.
// Vessel facts and the story of the name come from PNTC's own published page on the training vessel.
// Partner names are a list in Site Content. Partner logos are picked up by file name (pnsc-partner-01.png, 02, ...)
// from the Main Site image folder, so uploading a logo there fills the matching tile.
// Rerunnable:  node tools/pnsc-pages.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const DIR = path.join(__dirname, '..', 'PNTC Main Landing Page');
const CSS = fs.readFileSync(path.join(__dirname, 'pnsc-pages.css'), 'utf8').replace(/\r\n/g, '\n').trim();
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;
const SHIP = '/pnsc-aman-sinaya.jpg';

const src = path.join(__dirname, '..', 'Aman Sinaya', 'Facility - Training Vessel Aman Sinaya.jpg');
const dst = path.join(DIR, 'pnsc-aman-sinaya.jpg');
if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);

const ICON = {
  wheel: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v4.5M12 17.500V22M2 12h4.500M17.500 12H22M5 5l3.200 3.200M15.800 15.800 19 19M19 5l-3.200 3.200M8.200 15.800 5 19"/></svg>',
  ship: '<svg viewBox="0 0 24 24"><path d="M3 17l1.500 3h15l1.500-3M4 17l1-6h14l1 6M8 11V7h8v4M12 7V4"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.500 2"/></svg>',
  people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.500a6.500 6.500 0 0 1 3.500 5.500"/></svg>',
}; for (const k in ICON) ICON[k] = ICON[k].replace(/(\d)\.500/g, '$1.5').replace(/([ MLHVmlhva-])\.500/g, '$1.5').replace(/(\d)\.(\d)00\b/g, '$1.$2');

const cta = `<section class="ps-cta">
  <div class="ps-cta-in">
    <div>
      <p>${slot('pnsc.cta.tag', 'Get in Touch')}</p>
      <h2>${slot('pnsc.cta.title', 'Ask us about on board training with PNSC')}</h2>
    </div>
    <div class="ps-cta-btns">
      <a class="ps-btn ps-btn-navy" data-c="pnsc.cta.phone.href" href="tel:+63463232424">${slot('pnsc.cta.phone', '(046) 323-2424')}</a>
      <a class="ps-btn ps-btn-navy" data-c="pnsc.cta.email" href="mailto:info@pntc.edu.ph">${slot('pnsc.cta.email', 'info@pntc.edu.ph')}</a>
    </div>
  </div>
</section>`;

const overview = `<section class="ps-hero" id="pnsc">
  <img class="ps-hero-img" src="${SHIP}" alt="MV Aman Sinaya, the PNTC training vessel, alongside the pier">
  <div class="ps-hero-in">
    <p class="ps-tag"><i></i>${slot('pnsc.hero.tag', 'Part of the PNTC Network')}</p>
    <h1 class="ps-h1">${slot('pnsc.hero.line1', 'PhilNautical Shipping Corporation')}</h1>
    <p class="ps-sub">${slot('pnsc.hero.sub', 'PhilNautical Shipping Corporation (PNSC) is part of the PNTC network. Its On Board Training Program gives maritime cadets shipboard experience aboard MV Aman Sinaya.')}</p>
    <div class="ps-hero-btns">
      <a class="ps-btn ps-btn-gold" href="/philnautical/onboard-training">${slot('pnsc.hero.btn1', 'On Board Training Program')} <span aria-hidden="true">&rarr;</span></a>
      <a class="ps-btn ps-btn-line" href="#vessel">${slot('pnsc.hero.btn2', 'Meet the Vessel')}</a>
    </div>
    <ul class="ps-facts"><li>Passenger Vessel</li><li>Coastwise Trading</li><li>Homeport Batangas</li><li>Built in Norway</li></ul>
  </div>
</section>

<section class="ps-sec" id="vessel">
  <div class="ps-wrap">
    <div class="ps-two">
      <div class="reveal">
        <p class="ps-eyebrow">${slot('pnsc.vessel.eyebrow', 'Our Training Vessel')}</p>
        <h2 class="ps-h2">${slot('pnsc.vessel.title', 'MV')} <em>${slot('pnsc.vessel.mark', 'Aman Sinaya')}</em></h2>
        <p class="ps-lead">${slot('pnsc.vessel.p1', 'A dedicated training vessel lets our students serve on board a passenger vessel and complete the required length of seagoing service for graduation without delay.')}</p>
        <p class="ps-lead">${slot('pnsc.vessel.p2', 'On board, cadets are trained in actual passenger vessel operations, building leadership skills and technical competencies in a systematic way.')}</p>
      </div>
      <div class="ps-photo reveal"><img src="${SHIP}" alt="MV Aman Sinaya" loading="lazy"></div>
    </div>
    <div class="ps-nums reveal">
      <div class="ps-num"><b>2,075</b><span>Gross Tonnage</span></div>
      <div class="ps-num"><b>968</b><span>Net Tonnage</span></div>
      <div class="ps-num"><b>72.48 m</b><span>Length Overall</span></div>
      <div class="ps-num"><b>11.50 m</b><span>Breadth</span></div>
      <div class="ps-num"><b>4.50 m</b><span>Depth</span></div>
      <div class="ps-num"><b>2</b><span>Main Engines</span></div>
    </div>
    <ul class="ps-specs reveal">
      <li><span>Type of Ship</span><b>Passenger</b></li>
      <li><span>Trading Area</span><b>Coastwise</b></li>
      <li><span>Homeport</span><b>Batangas</b></li>
      <li><span>Place Built</span><b>Norway</b></li>
      <li><span>Builder</span><b>A/S Trondheim Mek Verksted</b></li>
      <li><span>Hull Material</span><b>Steel</b></li>
      <li><span>Engine Make</span><b>Niigata and Normo</b></li>
      <li><span>Engine Power</span><b>950.78 kW each</b></li>
    </ul>
  </div>
</section>

<section class="ps-sec ps-soft" id="name">
  <div class="ps-wrap ps-story">
    <div class="reveal">
      <p class="ps-eyebrow">${slot('pnsc.name.eyebrow', 'Behind the Name')}</p>
      <h2 class="ps-h2">${slot('pnsc.name.title', 'Who is')} <em>${slot('pnsc.name.mark', 'Aman Sinaya?')}</em></h2>
      <p class="ps-lead">${slot('pnsc.name.lead', 'The vessel is named after Aman Sinaya, the goddess of the sea in early Tagalog belief.')}</p>
      <p class="ps-quote">${slot('pnsc.name.note', 'The Filipino word pasinaya, which means debut or inauguration, comes from pa-Sinaya, which means for Sinaya.')}</p>
    </div>
    <ol class="ps-story-steps">
      <li class="reveal">Long before the first humans, only the gods Bathala, Aman Sinaya and Amihan existed. Aman Sinaya, goddess of the sea, and Bathala, god of the sky, were rivals who fought many battles.</li>
      <li class="reveal">In one of their duels, Aman Sinaya sent her storms into the skies. Bathala answered by hurling boulders at the seas.</li>
      <li class="reveal">Amihan, the North Wind, took the form of a bird and flew between them until sky and sea were drawn close enough to meet. The two gods made peace, and the boulders became the Philippine islands.</li>
      <li class="reveal">When people came to be, fisherfolk called on Aman Sinaya for protection during voyages and offered her their first catch.</li>
    </ol>
  </div>
</section>

<section class="ps-sec" id="program">
  <div class="ps-wrap">
    <div class="ps-band reveal">
      <div>
        <p class="ps-eyebrow">${slot('pnsc.band.eyebrow', 'For Maritime Cadets')}</p>
        <h2>${slot('pnsc.band.title', 'On Board Training Program')}</h2>
        <p>${slot('pnsc.band.text', 'Shipboard training for BS Marine Transportation and BS Marine Engineering students, with our maritime partners.')}</p>
        <span class="ps-was">${slot('pnsc.band.was', 'Formerly PNTC Shipboard Training')}</span>
      </div>
      <a class="ps-btn ps-btn-gold" href="/philnautical/onboard-training">${slot('pnsc.band.btn', 'See the Program')} <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>

`;

const PARTNERS = Array.from({ length: 8 }, (_, i) => `<li>Maritime Partner ${i + 1}</li>`).join('');
const obt = `<section class="ps-hero" id="obt">
  <img class="ps-hero-img" src="${SHIP}" alt="MV Aman Sinaya, the PNTC training vessel, alongside the pier">
  <div class="ps-hero-in">
    <p class="ps-tag"><i></i>${slot('obt.hero.tag', 'Formerly PNTC Shipboard Training')}</p>
    <h1 class="ps-h1">${slot('obt.hero.line1', 'On Board')} <em>${slot('obt.hero.line2', 'Training Program')}</em></h1>
    <p class="ps-sub">${slot('obt.hero.sub', 'On board training for maritime cadets through PhilNautical Shipping Corporation, aboard MV Aman Sinaya and with our maritime partners.')}</p>
    <div class="ps-hero-btns">
      <a class="ps-btn ps-btn-gold" href="#partners">${slot('obt.hero.btn1', 'Our Maritime Partners')}</a>
      <a class="ps-btn ps-btn-line" href="/philnautical#vessel">${slot('obt.hero.btn2', 'Meet the Vessel')}</a>
    </div>
  </div>
</section>

<section class="ps-sec" id="about-program">
  <div class="ps-wrap">
    <div class="reveal">
      <p class="ps-eyebrow">${slot('obt.about.eyebrow', 'The Program')}</p>
      <h2 class="ps-h2">${slot('obt.about.title', 'Sea Time That')} <em>${slot('obt.about.mark', 'Counts')}</em></h2>
      <p class="ps-lead">${slot('obt.about.lead', 'The program opens opportunities for maritime students by developing their leadership skills and technical competencies in a systematic manner.')}</p>
    </div>
    <div class="ps-cards">
      <div class="ps-card reveal"><span class="ps-ico">${ICON.wheel}</span><h3>${slot('obt.card1.title', 'Structured Training')}</h3><p>${slot('obt.card1.text', 'Leadership skills and technical competencies are developed step by step, not left to chance.')}</p></div>
      <div class="ps-card reveal"><span class="ps-ico">${ICON.ship}</span><h3>${slot('obt.card2.title', 'A Real Passenger Vessel')}</h3><p>${slot('obt.card2.text', 'Cadets serve aboard MV Aman Sinaya and are trained in actual passenger vessel operations.')}</p></div>
      <div class="ps-card reveal"><span class="ps-ico">${ICON.clock}</span><h3>${slot('obt.card3.title', 'Graduate Without Delay')}</h3><p>${slot('obt.card3.text', 'A dedicated training vessel helps students complete the required length of seagoing service on time.')}</p></div>
      <div class="ps-card reveal"><span class="ps-ico">${ICON.people}</span><h3>${slot('obt.card4.title', 'For Deck and Engine Cadets')}</h3><p>${slot('obt.card4.text', 'For BS Marine Transportation and BS Marine Engineering students. Maritime students from other schools are also accepted.')}</p></div>
    </div>
  </div>
</section>

<section class="ps-sec ps-soft" id="partners">
  <div class="ps-wrap">
    <div class="reveal">
      <p class="ps-eyebrow">${slot('obt.partners.eyebrow', 'Our Maritime Partners')}</p>
      <h2 class="ps-h2">${slot('obt.partners.title', 'Training With the')} <em>${slot('obt.partners.mark', 'Industry')}</em></h2>
      <p class="ps-lead">${slot('obt.partners.lead', 'Our maritime partners take PNTC cadets on board their vessels for training.')}</p>
    </div>
    <ul class="ps-partners reveal" id="ps-partners">${slot('obt.partners.list', PARTNERS)}</ul>
    <p class="ps-partners-note">${slot('obt.partners.note', 'Partner names and logos will be posted here soon.')}</p>
  </div>
</section>

<section class="ps-sec" id="vessel-teaser">
  <div class="ps-wrap ps-two">
    <div class="ps-photo reveal"><img src="${SHIP}" alt="MV Aman Sinaya" loading="lazy"></div>
    <div class="reveal">
      <p class="ps-eyebrow">${slot('obt.vessel.eyebrow', 'Our Training Vessel')}</p>
      <h2 class="ps-h2">${slot('obt.vessel.title', 'MV')} <em>${slot('obt.vessel.mark', 'Aman Sinaya')}</em></h2>
      <p class="ps-lead">${slot('obt.vessel.text', 'A passenger vessel of 2,075 gross tonnage, 72.48 meters long, homeported in Batangas and built in Norway.')}</p>
      <p style="margin-top:1.6rem"><a class="ps-btn ps-btn-navy" href="/philnautical#vessel">${slot('obt.vessel.btn', 'Vessel Details')} <span aria-hidden="true">&rarr;</span></a></p>
    </div>
  </div>
</section>

`;

const SCRIPT = `<script id="pnsc-js">
document.addEventListener('DOMContentLoaded',function(){
  /* keep the hero text clear of the fixed navigation */
  function fit(){var m=0;document.querySelectorAll('nav,header').forEach(function(e){var p=getComputedStyle(e).position;if(p==='fixed'||p==='sticky'){var r=e.getBoundingClientRect();if(r.top<200&&r.height<200)m=Math.max(m,r.bottom);}});var h=document.querySelector('.ps-hero');if(h&&m>0)h.style.setProperty('--ps-nav',Math.round(m)+'px');}
  fit();window.addEventListener('load',fit);window.addEventListener('resize',fit);
  /* partner logos: a file named pnsc-partner-01.png (02, 03 ...) fills the matching tile. jpg and webp also work */
  var list=document.getElementById('ps-partners');if(!list)return;
  var exts=['png','jpg','webp'];
  var tiles=[].slice.call(list.children);
  /* one tile at a time, and stop at the first number with no file, so an empty folder costs only a few requests */
  (function tile(i){if(i>=tiles.length)return;var li=tiles[i],n=('0'+(i+1)).slice(-2),k=0;
    (function next(){if(k>=exts.length)return;var img=new Image();img.alt=li.textContent.trim();img.onload=function(){li.insertBefore(img,li.firstChild);li.classList.add('has-logo');tile(i+1);};img.onerror=function(){k++;next();};img.src='/pnsc-partner-'+n+'.'+exts[k];})();
  })(0);
});
</script>`;

function build(name, body, title, desc, navLabel) {
  const file = path.join(DIR, name);
  const before = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  let h = before;
  const a = h.search(/<section (id="page-banner"|class="ps-hero")/);
  const b = h.indexOf('<!-- ===================== FOOTER');
  if (a < 0 || b < a) throw new Error(name + ': page body not found');
  h = h.slice(0, a) + body + '\n\n\n\n' + h.slice(b);
  h = h.replace(/<style id="pnsc-css">[\s\S]*?<\/style>\n<script id="pnsc-js">[\s\S]*?<\/script>\n/, '');
  h = h.replace('<meta name="description"', `<style id="pnsc-css">\n${CSS}\n</style>\n${SCRIPT}\n<meta name="description"`);
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`).replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
  h = h.split('>Onboard Training Program</a>').join('>On Board Training Program</a>');
  h = C.preserveSlots(before, h);
  fs.writeFileSync(file, h);
  console.log(name, 'built');
}
build('philnautical.html', overview, 'PhilNautical Shipping Corporation (PNSC) and MV Aman Sinaya | PNTC Colleges, Inc.', 'PhilNautical Shipping Corporation (PNSC), part of the PNTC network, and its training vessel MV Aman Sinaya, with vessel details and the On Board Training Program.');
build('philnautical-onboard-training.html', obt, 'On Board Training Program for Maritime Cadets | PhilNautical Shipping Corporation', 'The On Board Training Program of PhilNautical Shipping Corporation for maritime cadets, aboard MV Aman Sinaya and with our maritime partners.');
