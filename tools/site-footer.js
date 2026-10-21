// One footer format on every page, the PNTC Colleges layout: a gold call to action band, then the navy footer
// (logo and socials, a links column, Contact Us, Find Us map, copyright line).
// Each site keeps its own band message and its own contact details:
//   Main Site (main.cta.*), PNSC (pnsc.cta.*), College (college.cta.*), SHS (shs.cta.*), Training Center (training.cta.*).
// Sub pages use their site's band. All texts sit in Site Content slots (group footer-<site>), socials in social.* / mtc.social.*.
// The old footers and the old closing bands are removed. The block sits between <!--site-footer--> and <!--/site-footer-->.
// Rerunnable:  node tools/site-footer.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const ROOT = path.join(__dirname, '..');
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;
const ext = 'target="_blank" rel="noopener"';

const MAP_DASMA = 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d247363.3781383172!2d120.9056777!3d14.3663575!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d50588e2b783%3A0x20356e452f77b4d3!2sPNTC%20Colleges!5e0!3m2!1sen!2sph!4v1788877666745!5m2!1sen!2sph';
const MAP_MTC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.1887763424843!2d120.97542267510593!3d14.588316535896592!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397ca22e6b75c0d%3A0x9bc898732b45df21!2sPNTC%20Colleges%20-%20Maritime%20Training%20Center!5e0!3m2!1sen!2sph!4v1789025534686!5m2!1sen!2sph';

const MAIN = 'PNTC Main Landing Page/', COL = 'PNTC Colleges/', MTC = 'PNTC Maritime Training and Assessment Center/';
const SITES = {
  main: {
    pages: ['index.html', 'about.html', 'about-history.html', 'about-leadership.html', 'careers.html'].map(f => MAIN + f), landing: MAIN + 'index.html',
    gold: '#F3CF33', navy: '#100B33',
    band: { eyebrow: ['main.cta.eyebrow', 'Your Journey Begins Here'], line1: ['main.cta.line1', 'Ready to Become Part of'], line2: ['main.cta.line2', 'the PNTC Community?'],
      sub: ['main.cta.sub', 'Enrollment is open for Academic Year 2027-2028. Whether you are a Grade 10 completer, a college applicant, or a seafarer seeking certification, PNTC has a place for you.'],
      btns: [['main.cta.btn1', 'Apply to College →', '/college/', 'main.cta.btn1.href'], ['main.cta.btn2', 'Apply to SHS →', '/shs/', 'main.cta.btn2.href'], ['main.cta.btn3', 'MTC Training Rates →', '/training/', 'main.cta.btn3.href']] },
    tagline: 'PNTC Colleges, Inc.', desc: 'With Virtue and Quality at the heart of its policies, PNTC Colleges is a well-known maritime school and training center and a growing institution for business education.',
    linksTitle: 'Explore', links: [['About PNTC', '/about'], ['PNTC Colleges', '/college/'], ['Senior High School', '/shs/'], ['Maritime Training Center', '/training/'], ['PhilNautical Shipping (PNSC)', '/philnautical'], ['Careers', '/careers']],
    contact: { addr: "Governor's Drive, Brgy. Paliparan I, Dasmariñas, Cavite 4114", phone: ['(046) 323-2424', 'tel:+63463232424'], email: 'info@pntc.edu.ph' },
    map: MAP_DASMA, copy: 'PNTC Colleges, Inc.', badge: 'CHED and MARINA Accredited', social: 'social',
  },
  pnsc: {
    pages: ['philnautical.html', 'philnautical-onboard-training.html'].map(f => MAIN + f), landing: MAIN + 'philnautical.html',
    gold: '#F3CF33', navy: '#100B33',
    band: { eyebrow: ['pnsc.cta.tag', 'Get in Touch'], line1: ['pnsc.cta.title', 'Ask us about on board training with PNSC'],
      sub: ['pnsc.cta.sub', 'Call or email us and our team will walk you through the On Board Training Program.'],
      btns: [['pnsc.cta.phone', '(046) 323-2424', 'tel:+63463232424', 'pnsc.cta.phone.href'], ['pnsc.cta.email', 'info@pntc.edu.ph', 'mailto:info@pntc.edu.ph', 'pnsc.cta.email']] },
    tagline: 'PhilNautical Shipping Corporation', desc: 'Part of the PNTC network, home of the training vessel MV Aman Sinaya and the On Board Training Program for maritime cadets.',
    linksTitle: 'PNSC', links: [['Overview', '/philnautical'], ['On Board Training Program', '/philnautical/onboard-training'], ['MV Aman Sinaya', '/philnautical#vessel'], ['PNTC Main Site', '/']],
    contact: { addr: "Governor's Drive, Brgy. Paliparan I, Dasmariñas, Cavite 4114", phone: ['(046) 323-2424', 'tel:+63463232424'], email: 'info@pntc.edu.ph' },
    map: MAP_DASMA, copy: 'PhilNautical Shipping Corporation', badge: 'Part of the PNTC Network', social: 'social',
  },
  college: {
    pages: fs.readdirSync(path.join(ROOT, COL)).filter(f => f.endsWith('.html')).map(f => COL + f), landing: COL + 'index.html',
    gold: '#F3CF33', navy: '#100B33',
    band: { eyebrow: ['college.cta.eyebrow', 'Choose PNTC'], line1: ['college.cta.line1', 'Begin Your Journey'], line2: ['college.cta.line2', 'at PNTC Colleges'],
      sub: ['college.cta.sub', 'For over 30 years, PNTC Colleges has educated and trained professionals who serve the Philippines and the world. We invite you to be part of that legacy.'],
      btns: [['college.cta.btn', 'Apply Now', '#enroll', null, true]] },
    tagline: 'PNTC Colleges Dasmariñas', desc: 'Private, non-sectarian maritime and business school in Dasmariñas, Cavite. CHED-recognized. MARINA-accredited. ISO 9001:2015 certified.',
    linksTitle: 'Programs', links: ['BS Marine Transportation', 'BS Marine Engineering', 'BS Tourism Management', 'BS Criminology', 'BS Customs Administration', 'BS Office Administration'].map(x => [x, '/college/programs']),
    contact: { addr: 'Brgy Zone 3, Amuntay Rd, Dasmariñas, 4114 Cavite', phone: ['0917 159 4966', 'tel:+639171594966'], email: 'info@pntc.edu.ph', hours: 'Monday to Friday, 7:00 AM to 5:30 PM' },
    map: MAP_DASMA, copy: 'PNTC Colleges Dasmariñas, Inc.', badge: 'CHED Recognized &amp; MARINA Accredited', social: 'social',
  },
  shs: {
    pages: fs.readdirSync(path.join(ROOT, 'SHS')).filter(f => f.endsWith('.html')).map(f => 'SHS/' + f), landing: 'SHS/index.html',
    gold: '#FFCC00', navy: '#12155A',
    band: { eyebrow: ['shs.cta.eyebrow', 'Choose PNTC SHS'], line1: ['shs.cta.line1', 'Start Your Journey'], line2: ['shs.cta.line2', 'at PNTC Senior High'],
      sub: ['shs.cta.sub', 'Enrollment is open for Academic Year 2027-2028. Choose your strand and begin senior high school with a clear direction.'],
      btns: [['shs.cta.btn', 'Enroll Now', '#enroll', null, true], ['shs.cta.btn2', 'Explore Strands', '/shs/strands', 'shs.cta.btn2.href']] },
    tagline: 'PNTC Senior High School', desc: 'Shaping future leaders through quality maritime and academic education since 1994.',
    linksTitle: 'Explore', links: [['Strands', '/shs/strands'], ['How to Enroll', '/shs/admissions'], ['Scholarships', '/shs/scholarships'], ['Student Life', '/shs/student-life'], ['Calendar', '/shs/calendar'], ['Directory', '/shs/directory']],
    contact: { addr: 'Brgy. Zone 3, Amuntay Road, Dasmariñas, 4114 Cavite', phone: ['0917 159 4966', 'tel:+639171594966'], email: 'info@pntc.edu.ph' },
    map: MAP_DASMA, copy: 'PNTC Colleges Senior High School', badge: '#OnwardPNTC', social: 'social',
  },
  training: {
    pages: fs.readdirSync(path.join(ROOT, MTC)).filter(f => f.endsWith('.html')).map(f => MTC + f), landing: MTC + 'index.html',
    gold: '#F3CF33', navy: '#100B33',
    band: { eyebrow: ['training.cta.eyebrow', 'Get In Touch'], line1: ['training.cta.mark', 'PNTC Maritime'], line2: ['training.cta.rest', 'Training and Assessment Center'],
      sub: ['training.cta.sub', 'Our admissions staff are ready to assist you. Visit us in person or contact us through any of the channels below. We usually respond within the same business day.'],
      btns: [['training.cta.btn1', 'Email Admissions', 'mailto:admissions@mypntc.edu.ph', 'training.cta.btn1.href'], ['training.cta.btn2', '0917 182 9158', 'tel:+639171829158', 'training.cta.btn2.href']],
      note: ['training.cta.note', 'Walk-in inquiries are welcome Monday to Saturday, 8:00 AM to 5:30 PM, at the 5th Floor, Intramuros Corporate Plaza, Manila.'] },
    tagline: 'Maritime Training and Assessment Center', desc: 'STCW and MARINA courses and competence assessment for seafarers in Intramuros, Manila.',
    linksTitle: 'Training', links: [['Maritime Courses', '/training/maritime-courses'], ['Assessment', '/training/assessment'], ['Review App', '/training/review-app'], ['Corporate', '/training/corporate'], ['TESDA', '/training/tesda'], ['Verify Certificate', 'https://secur-a-print.net/pntc2.sap'], ['PNTC Main Site', '/']],
    contact: { addr: '5th Floor, Intramuros Corporate Plaza, Recoletos St, Intramuros, Manila 1002', phone: ['0917 182 9158', 'tel:+639171829158'], email: 'admissions@mypntc.edu.ph', hours: 'Monday to Saturday, 8:00 AM to 5:30 PM' },
    map: MAP_MTC, copy: 'PNTC Maritime Training and Assessment Center', badge: 'Part of the PNTC Education Group', social: 'mtc.social',
  },
};

const ICON = {
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.1 2C10.9 2 10.2 4.4 10.2 6v2.5H8v3.8h2.2V22H14v-9.7h2.8l.4-3.8z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.2a7.4 7.4 0 0 0 4.3 1.4V7.5a4.3 4.3 0 0 1-3.2-1.7z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 7.2a3 3 0 0 0-2.1-2.1C18.5 4.6 12 4.6 12 4.6s-6.5 0-8.4.5A3 3 0 0 0 1.5 7.2 31 31 0 0 0 1 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.4.5 8.4.5s6.5 0 8.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 12a31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.4 3.1z"/></svg>',
  li: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><path d="M12 2.9 4 6v5c0 5 3.4 9.4 8 10.6 4.6-1.2 8-5.6 8-10.6V6z"/></svg>',
};

function block(id, s) {
  const b = s.band, f = 'footer.' + id;
  const btns = b.btns.map(([key, label, href, hrefKey, enroll], i) => {
    const dc = hrefKey ? ` data-c="${hrefKey}"` : '';
    return `<a class="pf-btn${i ? ' pf-btn-line' : ''}"${dc} href="${href}"${enroll ? ' data-enroll' : ''}${/^https?:/.test(href) ? ' ' + ext : ''}>${slot(key, label)}</a>`;
  }).join('\n      ');
  const soc = [['fb', 'Facebook'], ['tiktok', 'TikTok'], ['ig', 'Instagram'], ['yt', 'YouTube'], ...(s.social === 'social' ? [['li', 'LinkedIn']] : [])]
    .map(([k, label]) => `<a class="pf-soc" href="" ${ext} aria-label="${label}" data-c="${s.social}.${k}">${ICON[k]}</a>`).join('');
  const c = s.contact;
  const rows = [
    `<div class="pf-row">${ICON.pin}<span>${slot(f + '.addr', c.addr)}</span></div>`,
    `<div class="pf-row">${ICON.phone}<a data-c="${f}.phone.href" href="${c.phone[1]}">${slot(f + '.phone', c.phone[0])}</a></div>`,
    `<div class="pf-row">${ICON.mail}<a data-c="${f}.email" href="mailto:${c.email}">${slot(f + '.email', c.email)}</a></div>`,
    c.hours ? `<div class="pf-row">${ICON.clock}<span>${slot(f + '.hours', c.hours)}</span></div>` : '',
  ].filter(Boolean).join('\n        ');
  return `<!--site-footer-->
<section class="pf-cta pf-${id}" id="join">
  <p class="pf-eyebrow">${slot(b.eyebrow[0], b.eyebrow[1])}</p>
  <h2 class="pf-h2">${slot(b.line1[0], b.line1[1])}${b.line2 ? `<br>${slot(b.line2[0], b.line2[1])}` : ''}</h2>
  <p class="pf-sub">${slot(b.sub[0], b.sub[1])}</p>
  <div class="pf-btns">
      ${btns}
  </div>${b.note ? `\n  <p class="pf-note">${slot(b.note[0], b.note[1])}</p>` : ''}
</section>
<footer class="pf pf-${id}">
  <div class="pf-grid">
    <div class="pf-brand">
      <img src="/college/PNTC%20Logo.png" alt="PNTC" width="88" height="88" loading="lazy">
      <div class="pf-tagline">${slot(f + '.tagline', s.tagline)}</div>
      <p>${slot(f + '.desc', s.desc)}</p>
      <div class="pf-socials">${soc}</div>
    </div>
    <div class="pf-col">
      <h4>${s.linksTitle}</h4>
      <ul>${s.links.map(([t, h]) => `<li><a href="${h}"${/^https?:/.test(h) ? ' ' + ext : ''}>${t}</a></li>`).join('')}</ul>
    </div>
    <div class="pf-col">
      <h4>Contact Us</h4>
      <div class="pf-contact">
        ${rows}
      </div>
    </div>
    <div class="pf-col">
      <h4>Find Us</h4>
      <div class="pf-map"><iframe src="${s.map}" title="Map to ${s.tagline}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
    </div>
  </div>
  <div class="pf-bottom">
    <p>&copy; 2026 ${slot(f + '.copy', s.copy)}. All rights reserved.</p>
    <div class="pf-badge">${ICON.check}<span>${s.badge}</span></div>
  </div>
</footer>
<!--/site-footer-->`;
}

const css = s => `<style id="site-footer-css">
/* one footer format on every site, built by tools/site-footer.js */
body section.pf-cta{--pf-gold:${s.gold};--pf-ink:#100B33;position:relative;z-index:2;display:block;margin:-44px 0;padding:calc(112px + 10px) clamp(1.5rem,6vw,5rem);background:var(--pf-gold);text-align:center;clip-path:polygon(0 44px,100% 0,100% calc(100% - 44px),0 100%);font-family:'Montserrat',sans-serif;color:var(--pf-ink);border:0;max-width:none;width:auto}
body .pf-cta .pf-eyebrow{margin:0 0 .75rem;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;color:var(--pf-ink);opacity:.85;background:none;padding:0}
body .pf-cta .pf-eyebrow::before,body .pf-cta .pf-eyebrow::after{content:none}
body .pf-cta .pf-h2{margin:0 auto 1.1rem;max-width:none;font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;font-size:clamp(2.6rem,6.2vw,5.5rem);line-height:.92;letter-spacing:0;color:var(--pf-ink);background:none;padding:0}
body .pf-cta .pf-sub{margin:0 auto 2.5rem;max-width:46ch;font-size:.95rem;line-height:1.75;color:rgba(16,11,51,.86)}
body .pf-cta .pf-btns{display:flex;flex-wrap:wrap;gap:.9rem;justify-content:center}
body .pf-cta .pf-btn{display:inline-block;padding:.95rem 3rem;background:var(--pf-ink);color:#fff;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:.95rem;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;border:0;border-radius:0;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));transition:background .25s,color .25s,transform .25s}
body .pf-cta .pf-btn:hover{background:#2B2275;transform:translateY(-2px)}
body .pf-cta .pf-btn-line{background:transparent;color:var(--pf-ink);box-shadow:inset 0 0 0 2px var(--pf-ink)}
body .pf-cta .pf-btn-line:hover{background:var(--pf-ink);color:#fff}
body .pf-cta .pf-note{margin:1.6rem auto 0;max-width:60ch;font-size:.82rem;line-height:1.6;color:rgba(16,11,51,.86)}
body footer.pf{--pf-gold:${s.gold};position:relative;display:block;margin:0;padding:calc(96px + 44px) clamp(1.5rem,6vw,5rem) 0;background:${s.navy};color:#fff;font-family:'Montserrat',sans-serif;border:0;text-align:left}
body .pf a{text-decoration:none}
body .pf-grid{display:grid;grid-template-columns:2fr 1fr 2fr 1.47fr;gap:3rem;max-width:1200px;margin:0 auto;padding:0 0 3rem}
body .pf-brand img{display:block;width:88px;height:88px;object-fit:contain;margin:0 0 1rem}
body .pf-tagline{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.88);margin:0 0 .5rem}
body .pf-brand p{margin:0 0 1.3rem;max-width:32ch;font-size:.8rem;line-height:1.78;color:rgba(255,255,255,.88)}
body .pf-socials{display:flex;gap:.65rem}
body .pf-soc{display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);color:#fff;transition:background .25s,color .25s,border-color .25s}
body .pf-soc:hover{background:var(--pf-gold);border-color:var(--pf-gold);color:#100B33}
body .pf-soc svg{width:15px;height:15px;display:block}
body .pf-soc[href=""]{display:none}
body .pf-col h4{margin:0 0 1.2rem;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:.82rem;letter-spacing:.16em;text-transform:uppercase;color:var(--pf-gold)}
body .pf-col ul{list-style:none;margin:0;padding:0;display:grid;gap:.6rem}
body .pf-col ul a{font-size:.82rem;line-height:1.5;color:rgba(255,255,255,.88);transition:color .2s}
body .pf-col ul a:hover{color:var(--pf-gold)}
body .pf-contact{display:grid;gap:.9rem}
body .pf-row{display:flex;gap:.65rem;align-items:flex-start}
body .pf-row svg{flex:none;width:14px;height:14px;margin-top:3px;fill:none;stroke:var(--pf-gold);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
body .pf-row span,body .pf-row a{font-size:.8rem;line-height:1.55;color:rgba(255,255,255,.88)}
body .pf-row a:hover{color:var(--pf-gold)}
body .pf-map{width:100%;max-width:280px;aspect-ratio:4/3;border:1px solid rgba(255,255,255,.1);border-radius:4px;overflow:hidden}
body .pf-map iframe{width:100%;height:100%;border:0;display:block}
body .pf-bottom{display:flex;flex-wrap:wrap;gap:.75rem 1.5rem;justify-content:space-between;align-items:center;max-width:1200px;margin:0 auto;padding:1.4rem 0;border-top:1px solid rgba(255,255,255,.1)}
body .pf-bottom p{margin:0;font-size:.7rem;color:rgba(255,255,255,.88)}
body .pf-badge{display:flex;align-items:center;gap:.45rem;font-size:.66rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.88)}
body .pf-badge svg{width:13px;height:13px;fill:none;stroke:var(--pf-gold);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@media(max-width:1024px){body .pf-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){body section.pf-cta{padding:calc(80px + 10px) 1.4rem;clip-path:polygon(0 24px,100% 0,100% calc(100% - 24px),0 100%);margin:-24px 0}body footer.pf{padding-top:calc(64px + 24px)}body .pf-grid{grid-template-columns:1fr;gap:2.2rem}body .pf-cta .pf-btn{padding:.9rem 2rem}}
</style>`;

// old closing bands that the new band replaces
const OLD_BANDS = [/\n?<section id="cta">[\s\S]*?<\/section>\n?/, /\n?<section class="ps-cta">[\s\S]*?<\/section>\n?/, /\n?<section id="enroll">[\s\S]*?<\/section>\n?/, /\n?<section id="contact">[\s\S]*?<\/section>\n?/];

let changed = 0;
const landingValues = {};
for (const [id, s] of Object.entries(SITES)) {
  const land = fs.readFileSync(path.join(ROOT, s.landing), 'utf8');
  landingValues[id] = land;
  for (const rel of s.pages) {
    const file = path.join(ROOT, rel);
    const raw = fs.readFileSync(file, 'utf8');
    const crlf = raw.includes('\r\n');
    const before = raw.replace(/\r\n/g, '\n');
    let h = before;
    let at = h.indexOf('<!--site-footer-->');
    if (at > -1) h = h.replace(/<!--site-footer-->[\s\S]*?<!--\/site-footer-->\n?/, '<!--SF-->\n');
    else {
      for (const re of OLD_BANDS) h = h.replace(re, '\n');
      if (/<footer[\s>]/.test(h)) h = h.replace(/<footer[\s>][\s\S]*?<\/footer>\n?/, '<!--SF-->\n');
      else if (h.includes('<script src="/admin/chat-widget.js"')) h = h.replace('<script src="/admin/chat-widget.js"', '<!--SF-->\n\n<script src="/admin/chat-widget.js"');
      else h = h.replace('</body>', '<!--SF-->\n</body>');
    }
    h = h.replace('<!--SF-->', block(id, s));
    // in place when it is already there, so the page tools never reorder each other's style blocks
    h = /<style id="site-footer-css">/.test(h) ? h.replace(/<style id="site-footer-css">[\s\S]*?<\/style>/, () => css(s)) : h.replace('</head>', css(s) + '\n</head>');
    // texts the admin console already holds on this page or on the site's landing page
    h = C.preserveSlots(before, h);
    h = C.preserveSlots(land.replace(/\r\n/g, '\n'), h);
    // links that pointed at the old bands now point at the new one
    h = h.replace(/href="(\/|\/college\/)?#cta"/g, (m, p) => `href="${p || ''}#join"`)
      .replace(/href="\/training\/maritime-courses#enroll"/g, 'href="/training/maritime-courses#join"');
    const out = crlf ? h.replace(/\n/g, '\r\n') : h;
    if (out !== raw) { fs.writeFileSync(file, out); changed++; }
  }
}
// social links: keep the addresses already set in the admin console, defaults otherwise
const SOC = { 'social.fb': 'https://www.facebook.com/pntc.edu/', 'social.tiktok': 'https://www.tiktok.com/@pntc.edu', 'mtc.social.fb': 'https://www.facebook.com/pntc.mtc', 'mtc.social.tiktok': 'https://www.tiktok.com/@pntc.edu' };
for (const s of Object.values(SITES)) for (const rel of s.pages) {
  const file = path.join(ROOT, rel);
  let h = fs.readFileSync(file, 'utf8');
  const b = h;
  for (const [k, v] of Object.entries(SOC)) h = h.replace(new RegExp(`(<a class="pf-soc" href=")("[^>]*data-c="${k.replace('.', '\\.')}")`), `$1${v}$2`);
  if (h !== b) fs.writeFileSync(file, h);
}
console.log('pages changed:', changed);
module.exports = { SITES };
