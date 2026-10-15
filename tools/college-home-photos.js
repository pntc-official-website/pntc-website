// College home page: photos so the page does not read as text only.
//  - a photo on top of each "Why Choose PNTC" card (Home - Our Story / Our People / Our Promise .jpg, and the Engine Room Simulator facility photo)
//  - a Campus Life gallery after the values (Campus Life 01.jpg to 11.jpg): slim photo panels, one opens wide at a time, slowly in turn
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
const panel = (i) => { const n = String(i + 1).padStart(2, '0'); return `<button type="button" class="cl-p${i === 0 ? ' on' : ''}" aria-label="${LIFE[i]}"><img src="Campus Life ${n}.jpg" alt="${LIFE[i]}" loading="lazy" width="900" height="600"><span class="cl-num" aria-hidden="true">${n}</span><span class="cl-cap"><b>${n}</b><span>${slot('college.life.cap' + (i + 1), LIFE[i])}</span></span><i class="cl-bar" aria-hidden="true"></i></button>`; };
const LIFE_HTML = `<!-- ══════ CAMPUS LIFE ══════ -->
<section id="campus-life" aria-label="Campus life at PNTC Colleges">
  <div class="cl-head reveal">
    <div class="eyebrow">${slot('college.life.eyebrow', 'Life at PNTC')}</div>
    <h2>${slot('college.life.title', 'Campus')} <span>${slot('college.life.mark', 'Life')}</span></h2>
    <p>${slot('college.life.lead', 'Parades, ceremonies, celebrations and the friendships that last long after graduation.')}</p>
  </div>
  <div class="cl-acc" id="cl-acc">${LIFE.map((x, i) => panel(i)).join('')}</div>
</section>
`;
h = h.replace(/<!-- ══════ CAMPUS LIFE ══════ -->\n<section id="campus-life"[\s\S]*?<\/section>\n\n?/, '');
const v = h.indexOf('<section id="values">');
const vEnd = h.indexOf('</section>', v) + '</section>'.length;
if (v < 0) throw new Error('values section not found');
h = h.slice(0, vEnd) + '\n\n' + LIFE_HTML + h.slice(vEnd).replace(/^\n+/, '\n');

// 3. the closing band stays plain: remove photos added there before
h = h.replace(/\s*<figure class="cta-photo[^>]*>[\s\S]*?<\/figure>/g, '');
h = h.replace(/\s*<div class="cta-bubbles"[\s\S]*?<\/div><!--\/cta-bubbles-->/g, '');
h = h.replace(/<script id="cta-bubbles-js">[\s\S]*?<\/script>\n/, '');

// the gallery opens the next panel by itself, pauses while pointed at, and opens a panel that is clicked
const JS = `<script id="cl-acc-js">
document.addEventListener('DOMContentLoaded',function(){
  var acc=document.getElementById('cl-acc');if(!acc)return;
  var ps=[].slice.call(acc.children),cur=0,t=null,still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function open(i){cur=(i+ps.length)%ps.length;ps.forEach(function(p,k){p.classList.toggle('on',k===cur);p.setAttribute('aria-expanded',k===cur);});}
  function play(){stop();if(!still)t=setInterval(function(){open(cur+1);},5200);acc.classList.remove('paused');}
  function stop(){if(t){clearInterval(t);t=null;}}
  ps.forEach(function(p,k){p.addEventListener('click',function(){open(k);play();});p.addEventListener('mouseenter',function(){if(window.matchMedia('(hover:hover)').matches&&k!==cur)open(k);});});
  acc.addEventListener('mouseenter',function(){stop();acc.classList.add('paused');});acc.addEventListener('mouseleave',play);
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)play();else stop();});},{threshold:.3}).observe(acc);}else play();
});
</script>`;
h = h.replace(/<script id="cl-acc-js">[\s\S]*?<\/script>\n/, '');
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
/* gallery: slim photo panels, the open one wide and in full colour */
.cl-acc{display:flex;gap:10px;height:clamp(380px,40vw,540px);max-width:1320px;margin:0 auto;padding:0 clamp(1rem,4vw,3rem)}
.cl-p{position:relative;flex:1 1 0;min-width:0;padding:0;border:0;border-radius:22px;overflow:hidden;cursor:pointer;background:#1C1650;box-shadow:0 20px 34px -24px rgba(28,22,80,.6);transition:flex-grow 1.1s cubic-bezier(.65,0,.25,1),box-shadow .6s}
.cl-p.on{flex-grow:9;box-shadow:0 34px 60px -30px rgba(28,22,80,.75)}
.cl-p img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(.85) brightness(.55);transform:scale(1.15);transition:filter 1.1s ease,transform 6s ease}
.cl-p.on img{filter:none;transform:scale(1)}
.cl-p::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(16,11,51,.85),rgba(16,11,51,0) 45%);opacity:0;transition:opacity .8s}
.cl-p.on::after{opacity:1}
.cl-num{position:absolute;left:50%;bottom:1.1rem;transform:translateX(-50%);font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:1.05rem;letter-spacing:.08em;color:rgba(255,255,255,.9);z-index:2;transition:opacity .4s}
.cl-p.on .cl-num{opacity:0}
.cl-cap{position:absolute;left:clamp(1.2rem,2.5vw,2rem);right:1.5rem;bottom:clamp(1.3rem,2.5vw,1.9rem);z-index:2;display:flex;align-items:flex-end;gap:1rem;text-align:left;opacity:0;transform:translateY(16px);transition:opacity .5s,transform .7s cubic-bezier(.2,.7,.2,1)}
.cl-p.on .cl-cap{opacity:1;transform:none;transition-delay:.55s}
.cl-cap b{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(3rem,5vw,4.6rem);line-height:.8;color:#F3CF33}
.cl-cap span{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;font-size:clamp(1.1rem,1.8vw,1.6rem);line-height:1.05;color:#fff;max-width:22ch;white-space:normal}
.cl-bar{position:absolute;left:0;bottom:0;height:4px;width:0;background:#F3CF33;z-index:3}
.cl-p.on .cl-bar{animation:cl-bar 5.2s linear forwards}
.cl-acc.paused .cl-p.on .cl-bar{animation-play-state:paused}
@keyframes cl-bar{to{width:100%}}
.cl-p:focus-visible{outline:3px solid #F3CF33;outline-offset:3px}
@media(max-width:760px){
  .cl-acc{flex-direction:column;height:auto;gap:8px}
  .cl-p{flex:none;height:46px;transition:height 1s cubic-bezier(.65,0,.25,1)}
  .cl-p.on{height:min(78vw,340px)}
  .cl-num{left:1.2rem;bottom:50%;transform:translateY(50%)}
}
@media(prefers-reduced-motion:reduce){.cl-p,.cl-p img{transition:none}.cl-p.on .cl-bar{animation:none}}
</style>`;
h = h.replace(/<style id="home-photos">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '\n</head>');
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('college home photos applied');
