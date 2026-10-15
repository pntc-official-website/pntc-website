// College home page: photos so the page does not read as text only.
//  - a photo on top of each "Why Choose PNTC" card (Home - Our Story / Our People / Our Promise .jpg, and the Engine Room Simulator facility photo)
//  - a Campus Life photo band after the values (Campus Life 01.jpg to 11.jpg), two rows drifting in opposite directions
//  - photo bubbles beside the closing "Begin Your Journey" band that pop up, float, fade and pop up again with the next photo
// The photos sit in the PNTC Colleges folder, so they can be replaced from the admin Images screen under the same names.
// The Campus Life heading is in Site Content (group college-life).
// Rerunnable:  node tools/college-home-photos.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const FILE = path.join(__dirname, '..', 'PNTC Colleges', 'index.html');
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;
const before = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
let h = before;

// 1. card photos, in card order
const CARD = [
  ['Home - Our Story.jpg', 'PNTC maritime graduates in white uniforms at commencement'],
  ['Facility - Engine Room Simulator.jpg', 'The engine room simulator at PNTC Colleges'],
  ['Home - Our People.jpg', 'PNTC maritime cadets with their training officer'],
  ['Home - Our Promise.jpg', 'PNTC Colleges graduates in their togas'],
];
h = h.replace(/<figure class="usp-photo">[\s\S]*?<\/figure>\n?\s*/g, '');
let k = 0;
h = h.replace(/<article class="usp">\n/g, m => {
  const c = CARD[k++];
  return c ? `${m}      <figure class="usp-photo"><img src="${c[0]}" alt="${c[1]}" loading="lazy" width="1000" height="666"></figure>\n` : m;
});
if (k !== 4) throw new Error('expected 4 cards, found ' + k);

// 2. Campus Life band after the values
const LIFE = ['Color run on campus', 'A cadet officer at the parade', 'Cadets on the steps of the main building', 'The majorettes at the parade', 'The PNTC drum and bugle corps', 'Students between classes', 'Cadets marching in the rain', 'Students on campus', 'The Philippine flag and the PNTC Colleges flag', 'A graduate with his mother at the awarding', 'Cadets with the class name boards'];
const pic = (i) => `<figure><img src="Campus Life ${String(i + 1).padStart(2, '0')}.jpg" alt="${LIFE[i]}" loading="lazy" width="900" height="600"></figure>`;
const rowA = [0, 1, 2, 3, 4, 5], rowB = [6, 7, 8, 9, 10, 2];
const track = (ids) => { const set = ids.map(pic).join(''); return `<div class="cl-track">${set}${set.replace(/alt="[^"]*"/g, 'alt=""')}</div>`; };
const LIFE_HTML = `<!-- ══════ CAMPUS LIFE ══════ -->
<section id="campus-life" aria-label="Campus life at PNTC Colleges">
  <div class="cl-head reveal">
    <div class="eyebrow">${slot('college.life.eyebrow', 'Life at PNTC')}</div>
    <h2>${slot('college.life.title', 'Campus')} <span>${slot('college.life.mark', 'Life')}</span></h2>
    <p>${slot('college.life.lead', 'Parades, ceremonies, celebrations and the friendships that last long after graduation.')}</p>
  </div>
  <div class="cl-rows">
    <div class="cl-row">${track(rowA)}</div>
    <div class="cl-row cl-rev">${track(rowB)}</div>
  </div>
</section>
`;
h = h.replace(/<!-- ══════ CAMPUS LIFE ══════ -->\n<section id="campus-life"[\s\S]*?<\/section>\n\n?/, '');
const v = h.indexOf('<section id="values">');
const vEnd = h.indexOf('</section>', v) + '</section>'.length;
if (v < 0) throw new Error('values section not found');
h = h.slice(0, vEnd) + '\n\n' + LIFE_HTML + h.slice(vEnd).replace(/^\n+/, '\n');

// 3. photo bubbles beside the closing band: each pops up, floats, fades, and pops up again with the next photo
const POOL = ['Home - Join Us 1.jpg', 'Home - Join Us 2.jpg', 'Home - Our Story.jpg', 'Home - Our People.jpg', 'Home - Our Promise.jpg',
  ...Array.from({ length: 11 }, (_, i) => 'Campus Life ' + String(i + 1).padStart(2, '0') + '.jpg')];
// side, distance from the page edge and size (both as parts of the free space beside the text), distance from the top in %
const BUBBLES = [['l', .05, .46, 10], ['l', .55, .3, 54], ['l', .12, .32, 64], ['l', .62, .22, 6],
  ['r', .05, .48, 9], ['r', .56, .28, 56], ['r', .1, .34, 62], ['r', .64, .2, 5]];
h = h.replace(/\s*<figure class="cta-photo[^>]*>[\s\S]*?<\/figure>/g, '');
h = h.replace(/\s*<div class="cta-bubbles"[\s\S]*?<\/div><!--\/cta-bubbles-->/g, '');
const bub = BUBBLES.map(([s, x, z, t], i) => `<span class="cta-bub" style="${s === 'l' ? 'left' : 'right'}:calc(var(--zone) * ${x});top:${t}%;--sz:${z};animation-delay:${(i * 1.55).toFixed(2)}s"><img src="${POOL[i]}" alt="" loading="lazy"></span>`).join('');
h = h.replace('<section id="cta">', `<section id="cta">\n  <div class="cta-bubbles" aria-hidden="true" data-pool="${POOL.join('|')}">${bub}</div><!--/cta-bubbles-->`);
const JS = `<script id="cta-bubbles-js">
/* each bubble shows the next photo every time it pops up again */
document.addEventListener('DOMContentLoaded',function(){
  var box=document.querySelector('.cta-bubbles');if(!box)return;
  var pool=box.getAttribute('data-pool').split('|'),next=box.children.length;
  [].forEach.call(box.children,function(b){b.addEventListener('animationiteration',function(){b.querySelector('img').src=pool[next%pool.length];next++;});});
});
</script>`;
h = h.replace(/<script id="cta-bubbles-js">[\s\S]*?<\/script>\n/, '');
h = h.replace('</body>', JS + '\n</body>');

const CSS = `<style id="home-photos">
/* photos on the Why Choose PNTC cards */
.usp-photo{margin:-2rem -1.6rem 0;height:clamp(150px,13vw,190px);overflow:hidden;position:relative}
.usp-photo::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(16,11,51,0) 45%,rgba(16,11,51,.45))}
.usp-photo img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.usp:hover .usp-photo img{transform:scale(1.07)}
.usp-photo + .usp-num{color:rgba(255,255,255,.85)!important;text-shadow:0 2px 10px rgba(0,0,0,.35);z-index:2}
.usp-photo ~ .usp-ico{position:relative;z-index:2;margin-top:-27px;border:3px solid #fff}
/* Campus Life band */
#campus-life{background:#ECEEF7;padding:clamp(4.5rem,8vw,6.5rem) 0;overflow:hidden;position:relative}
.cl-head{max-width:760px;margin:0 auto clamp(2.2rem,4vw,3rem);padding:0 1.5rem;text-align:center}
.cl-head .eyebrow{display:inline-flex;margin-bottom:.8rem}
.cl-head h2{font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;font-size:clamp(2.4rem,5vw,4rem);line-height:.95;color:#1C1650;margin:0}
.cl-head h2 span{background:linear-gradient(transparent 62%,#F3CF33 62%,#F3CF33 92%,transparent 92%);padding:0 .08em}
.cl-head p{margin:1rem auto 0;max-width:56ch;font-size:1rem;line-height:1.7;color:rgba(28,22,80,.7)}
.cl-rows{display:grid;gap:1.1rem;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.cl-row{overflow:hidden}
.cl-track{display:flex;gap:1.1rem;width:max-content;animation:cl-move 60s linear infinite}
.cl-rev .cl-track{animation-direction:reverse;animation-duration:70s}
.cl-rows:hover .cl-track{animation-play-state:paused}
.cl-track figure{margin:0;height:clamp(170px,19vw,250px);aspect-ratio:3/2;border-radius:18px;overflow:hidden;flex:none;box-shadow:0 18px 30px -20px rgba(28,22,80,.55);transition:transform .45s cubic-bezier(.2,.7,.2,1),box-shadow .45s}
.cl-track figure:nth-child(odd){transform:rotate(-1.2deg)}
.cl-track figure:nth-child(even){transform:rotate(1.2deg) translateY(6px)}
.cl-track figure:hover{transform:rotate(0) scale(1.05);box-shadow:0 26px 40px -20px rgba(28,22,80,.7);z-index:1}
.cl-track img{width:100%;height:100%;object-fit:cover;display:block}
@keyframes cl-move{to{transform:translateX(calc(-50% - .55rem))}}
.cl-head .eyebrow{color:#1C1650!important}
/* photo bubbles beside the closing band: a slow pop up, float, fade, rest, then pop up again with the next photo */
#cta{position:relative;overflow:hidden}
#cta > :not(.cta-bubbles){position:relative;z-index:2}
.cta-bubbles{position:absolute;inset:0;z-index:1;pointer-events:none;--zone:calc((100vw - 780px) / 2)}
.cta-bub{position:absolute;width:min(200px,calc(var(--zone) * var(--sz)));aspect-ratio:1;border-radius:50%;overflow:hidden;border:5px solid #fff;box-shadow:0 22px 40px -18px rgba(16,11,51,.55),0 0 0 8px rgba(255,255,255,.18);opacity:0;transform:scale(.2);animation:cta-pop 12.4s cubic-bezier(.3,.7,.3,1) infinite both}
.cta-bub img{width:100%;height:100%;object-fit:cover;display:block}
.cta-bub::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.45),rgba(255,255,255,0) 38%)}
@keyframes cta-pop{
  0%{opacity:0;transform:scale(.2) translateY(30px)}
  9%{opacity:1;transform:scale(1.1) translateY(0)}
  13%{transform:scale(.96)}
  17%{transform:scale(1)}
  40%{transform:scale(1) translateY(-8px)}
  58%{opacity:1;transform:scale(1) translateY(-14px)}
  70%{opacity:0;transform:scale(.92) translateY(-26px)}
  100%{opacity:0;transform:scale(.2) translateY(30px)}
}
@media(max-width:1180px){.cta-bubbles{display:none}}
@media(prefers-reduced-motion:reduce){.cl-track{animation:none}.cl-row{overflow-x:auto}.cta-bub{animation:none;opacity:1;transform:none}}
</style>`;
h = h.replace(/<style id="home-photos">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '\n</head>');
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('college home photos applied');
