// Working buttons across the site.
//  1. College and SHS: every Apply Now / Enroll Now / Start My Application button opens a popup that asks
//     New Student or Old Student, each going to its enrollment link (Site Content: Enrollment popup).
//  2. Footers: Facebook and TikTok links on every site, Training Center with its own Facebook page
//     (Site Content: Social links). Instagram, YouTube and LinkedIn stay hidden until a link is set.
//  3. Footer links that went nowhere (Privacy Policy, Terms of Use, Accessibility) are taken out until those pages exist.
// Rerunnable:  node tools/site-buttons.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const ROOT = path.join(__dirname, '..');
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;

const LINK = {
  fb: 'https://www.facebook.com/pntc.edu/',
  tiktok: 'https://www.tiktok.com/@pntc.edu',
  mtcFb: 'https://www.facebook.com/pntc.mtc',
  newStudent: 'https://pntc-colleges.orangeapps.ph/landing/pntc/',
  oldStudent: 'https://pntc-colleges.orangeapps.ph/landing/enrollment/pntc/',
};
const pages = dir => fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.html')).map(f => dir + '/' + f);
const COLLEGE = pages('PNTC Colleges'), SHS = pages('SHS'), MAIN = pages('PNTC Main Landing Page').filter(f => /footer-socials/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
const TRAINING_HOME = 'PNTC Maritime Training and Assessment Center/index.html';

const TIKTOK_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.2a7.4 7.4 0 0 0 4.3 1.4V7.5a4.3 4.3 0 0 1-3.2-1.7z"/></svg>';
const ext = 'target="_blank" rel="noopener"';

// ── 1. enrollment popup ──
function popup(site) {
  const p = site + '.enroll';
  const title = site === 'shs' ? 'Enroll at PNTC Senior High School' : 'Apply to PNTC Colleges';
  return `<div class="ep" id="enroll-pop" role="dialog" aria-modal="true" aria-labelledby="ep-title" hidden>
  <div class="ep-back" data-ep-close></div>
  <div class="ep-box">
    <button type="button" class="ep-x" data-ep-close aria-label="Close">&times;</button>
    <p class="ep-tag">${slot(p + '.tag', 'Academic Year 2027-2028')}</p>
    <h2 class="ep-title" id="ep-title">${slot(p + '.title', title)}</h2>
    <p class="ep-sub">${slot(p + '.sub', 'Are you a new student or an old student?')}</p>
    <div class="ep-choices">
      <a class="ep-choice" data-c="${p}.new.href" href="${LINK.newStudent}" ${ext}><span class="ep-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span><span><b>${slot(p + '.new', 'New Student')}</b><small>${slot(p + '.new.sub', 'First time enrolling at PNTC')}</small></span><i aria-hidden="true">&rarr;</i></a>
      <a class="ep-choice" data-c="${p}.old.href" href="${LINK.oldStudent}" ${ext}><span class="ep-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/></svg></span><span><b>${slot(p + '.old', 'Old Student')}</b><small>${slot(p + '.old.sub', 'Continuing or returning to PNTC')}</small></span><i aria-hidden="true">&rarr;</i></a>
    </div>
  </div>
</div><!--/enroll-pop-->`;
}
function popupStyle(site) {
  const c = site === 'shs' ? { navy: '#181D71', gold: '#FFCC00' } : { navy: '#1C1650', gold: '#F3CF33' };
  return `<style id="enroll-pop-css">
.ep{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:1.2rem;font-family:'Montserrat',sans-serif}
.ep[hidden]{display:none}
.ep-back{position:absolute;inset:0;background:rgba(11,8,38,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:ep-fade .3s ease both}
.ep-box{position:relative;width:min(100%,480px);background:#fff;border-radius:24px;padding:2.2rem 1.8rem 1.8rem;box-shadow:0 40px 80px -30px rgba(0,0,0,.6);border-top:6px solid ${c.gold};animation:ep-pop .45s cubic-bezier(.2,.9,.3,1.2) both}
.ep-x{position:absolute;top:.8rem;right:.9rem;width:38px;height:38px;border-radius:50%;border:0;background:#F1F2F7;color:${c.navy};font-size:1.5rem;line-height:1;cursor:pointer}
.ep-x:hover{background:${c.navy};color:#fff}
.ep-tag{margin:0;font-size:.68rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${c.navy};opacity:.86}
.ep-title{margin:.5rem 0 .4rem;font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;font-size:clamp(1.8rem,5vw,2.3rem);line-height:1;color:${c.navy}}
.ep-sub{margin:0 0 1.4rem;font-size:.95rem;line-height:1.6;color:rgba(28,22,80,.86)}
.ep-choices{display:grid;gap:.8rem}
.ep-choice{display:flex;align-items:center;gap:1rem;padding:1rem 1.1rem;border-radius:16px;border:1.5px solid rgba(28,22,80,.12);text-decoration:none;color:${c.navy};transition:border-color .25s,background .25s,transform .25s}
.ep-choice:hover,.ep-choice:focus-visible{border-color:${c.navy};background:${c.navy};color:#fff;transform:translateY(-2px)}
.ep-ico{display:grid;place-items:center;width:46px;height:46px;flex:none;border-radius:13px;background:${c.gold};color:${c.navy}}
.ep-ico svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.ep-choice b{display:block;font-size:1.02rem}
.ep-choice small{display:block;font-size:.8rem;margin-top:.15rem;opacity:.86}
.ep-choice i{margin-left:auto;font-style:normal;font-size:1.3rem;transition:transform .25s}
.ep-choice:hover i{transform:translateX(4px)}
@keyframes ep-fade{from{opacity:0}}
@keyframes ep-pop{from{opacity:0;transform:translateY(24px) scale(.96)}}
@media(prefers-reduced-motion:reduce){.ep-back,.ep-box{animation:none}}
</style>`;
}
const POP_JS = `<script id="enroll-pop-js">
/* Apply and Enroll buttons ask New Student or Old Student first */
document.addEventListener('DOMContentLoaded',function(){
  var pop=document.getElementById('enroll-pop');if(!pop)return;var from=null;
  function open(e){e.preventDefault();from=document.activeElement;pop.hidden=false;document.body.style.overflow='hidden';var f=pop.querySelector('.ep-choice');if(f)f.focus();}
  function close(){pop.hidden=true;document.body.style.overflow='';if(from&&from.focus)from.focus();}
  document.addEventListener('click',function(e){var b=e.target.closest('[data-enroll]');if(b)open(e);});
  pop.addEventListener('click',function(e){if(e.target.closest('[data-ep-close]'))close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pop.hidden)close();});
});
</script>`;

// buttons that open the popup: by their words, never the "How to" links
const ENROLL_TEXT = /^(Apply Now|Enroll Now|Start My Application)\s*(→|&rarr;)?$/;
function markEnroll(h) {
  return h.replace(/<a\s([^>]*)>([\s\S]{0,160}?)<\/a>/g, (m, attrs, inner) => {
    const text = inner.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!ENROLL_TEXT.test(text) || /data-enroll/.test(attrs)) return m;
    let a = attrs.replace(/href="#"/, 'href="#enroll"');
    return `<a ${a} data-enroll>${inner}</a>`;
  });
}

// ── 2. social links ──
const hideEmpty = `<style id="social-links-css">a[data-c^="social."][href=""],a[data-c^="mtc.social."][href=""]{display:none!important}</style>`;
function collegeLikeSocial(h, cls) {
  // footer icons: Facebook, then TikTok, then Instagram and YouTube (hidden until they have a link)
  return h.replace(new RegExp(`<a href="[^"]*" class="${cls}" aria-label="Facebook"`, 'g'), `<a href="${LINK.fb}" ${ext} class="${cls}" aria-label="Facebook" data-c="social.fb"`)
    .replace(new RegExp(`<a href="[^"]*" class="${cls}" aria-label="Instagram"`, 'g'), `<a href="" ${ext} class="${cls}" aria-label="Instagram" data-c="social.ig"`)
    .replace(new RegExp(`<a href="[^"]*" class="${cls}" aria-label="YouTube"`, 'g'), `<a href="" ${ext} class="${cls}" aria-label="YouTube" data-c="social.yt"`)
    .replace(new RegExp(`(<a href="[^"]*" ${ext} class="${cls}" aria-label="Facebook" data-c="social.fb"[^>]*>(?:(?!</a>)[\\s\\S])*</a>)(?!\\s*<a[^>]*aria-label="TikTok")`),`$1\n        <a href="${LINK.tiktok}" ${ext} class="${cls}" aria-label="TikTok" data-c="social.tiktok">${TIKTOK_SVG.replace('<svg ', cls === 'social-btn' ? '<svg width="15" height="15" ' : '<svg ')}</a>`);
}
function mainSocial(h) {
  return h.replace(/<a href="[^"]*"(?: target="_blank" rel="noopener")? aria-label="Facebook"(?: data-c="social\.fb")?>FB<\/a>/, `<a href="${LINK.fb}" ${ext} aria-label="Facebook" data-c="social.fb">FB</a>`)
    .replace(/<a href="[^"]*"(?: target="_blank" rel="noopener")? aria-label="Instagram"(?: data-c="social\.ig")?>IG<\/a>/, `<a href="" ${ext} aria-label="Instagram" data-c="social.ig">IG</a>`)
    .replace(/<a href="[^"]*"(?: target="_blank" rel="noopener")? aria-label="YouTube"(?: data-c="social\.yt")?>YT<\/a>/, `<a href="" ${ext} aria-label="YouTube" data-c="social.yt">YT</a>`)
    .replace(/<a href="[^"]*"(?: target="_blank" rel="noopener")? aria-label="LinkedIn"(?: data-c="social\.li")?>IN<\/a>/, `<a href="" ${ext} aria-label="LinkedIn" data-c="social.li">IN</a>`)
    .replace(/(<a [^>]*data-c="social\.fb">FB<\/a>)(?!\s*<a[^>]*aria-label="TikTok")/, `$1\n          <a href="${LINK.tiktok}" ${ext} aria-label="TikTok" data-c="social.tiktok">TT</a>`);
}

function finish(file, h) {
  h = h.replace(/<style id="social-links-css">[\s\S]*?<\/style>\n/, '').replace('</head>', hideEmpty + '\n</head>');
  return h;
}

let changed = 0;
function edit(rel, fn) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  const crlf = before.includes('\r\n');
  let h = before.replace(/\r\n/g, '\n');
  h = fn(h);
  h = C.preserveSlots(before.replace(/\r\n/g, '\n'), h);
  const out = crlf ? h.replace(/\n/g, '\r\n') : h;
  if (out !== before) { fs.writeFileSync(file, out); changed++; }
}

for (const [list, site, socialCls] of [[COLLEGE, 'college', 'soc-btn'], [SHS, 'shs', 'social-btn']]) {
  for (const rel of list) edit(rel, h => {
    h = markEnroll(h);
    h = h.replace(/\n?<div class="ep" id="enroll-pop"[\s\S]*?<\/div><!--\/enroll-pop-->/, '')
      .replace(/<style id="enroll-pop-css">[\s\S]*?<\/style>\n/, '').replace(/<script id="enroll-pop-js">[\s\S]*?<\/script>\n/, '');
    h = h.replace('</head>', popupStyle(site) + '\n</head>');
    h = h.replace('</body>', popup(site) + '\n' + POP_JS + '\n</body>');
    h = collegeLikeSocial(h, socialCls);
    // links with nowhere to go yet
    h = h.replace(/ \| <a href="#">Privacy Policy<\/a>/g, '');
    if (site === 'shs') h = h.replace(/<a href="#" class="adm-cta-link">Got questions\? Check the FAQ →<\/a>/, '<a href="/shs/directory" class="adm-cta-link">Got questions? Contact the SHS office →</a>');
    return finish(rel, h);
  });
}
for (const rel of MAIN) edit(rel, h => {
  h = mainSocial(h);
  h = h.replace(/<a href="#">Privacy Policy<\/a><a href="#">Terms of Use<\/a><a href="#">Accessibility<\/a>/g, '');
  return finish(rel, h);
});
edit(TRAINING_HOME, h => {
  h = h.replace(/\s*<a href="#">Privacy<\/a>/, '');
  if (!/data-c="mtc\.social\.fb"/.test(h)) h = h.replace(/(<div class="footer-links">\s*<a href="mailto:[^"]*">Contact<\/a>)/, `$1\n      <a href="${LINK.mtcFb}" ${ext} data-c="mtc.social.fb">Facebook</a>\n      <a href="${LINK.tiktok}" ${ext} data-c="mtc.social.tiktok">TikTok</a>`);
  return finish(TRAINING_HOME, h);
});
console.log('pages changed:', changed, '| College', COLLEGE.length, 'SHS', SHS.length, 'Main', MAIN.length);
module.exports = { COLLEGE, SHS, MAIN, TRAINING_HOME };
