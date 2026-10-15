// College home page: photos so the page does not read as text only.
//  - a photo on top of each "Why Choose PNTC" card (Home - Our Story / Our People / Our Promise .jpg, and the Engine Room Simulator facility photo)
//  - a Campus Life photo stage after the values (Campus Life 01.jpg to 11.jpg): photos only, one wide photo at a time with a slow zoom and a long crossfade
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
const photo = (i) => `Campus Life ${String(i + 1).padStart(2, '0')}.jpg`;
const slide = (i) => `<img class="cl-s${i === 0 ? ' on' : ''}" ${i < 2 ? 'src' : 'data-src'}="${photo(i)}" alt="${LIFE[i]}"${i === 0 ? '' : ' loading="lazy"'} width="900" height="600">`;
const LIFE_HTML = `<!-- ══════ CAMPUS LIFE ══════ -->
<section id="campus-life" aria-label="Campus life at PNTC Colleges">
  <div class="cl-head reveal">
    <div class="eyebrow">${slot('college.life.eyebrow', 'Life at PNTC')}</div>
    <h2>${slot('college.life.title', 'Campus')} <span>${slot('college.life.mark', 'Life')}</span></h2>
    <p>${slot('college.life.lead', 'Parades, ceremonies, celebrations and the friendships that last long after graduation.')}</p>
  </div>
  <div class="cl-stage" id="cl-stage" aria-roledescription="slideshow" aria-label="Campus life photos">${LIFE.map((a, i) => slide(i)).join("")}<i class="cl-bar" aria-hidden="true"></i></div>
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

// the stage: one photo at a time, a slow zoom and drift, then a long crossfade into the next photo
const JS = `<script id="cl-stage-js">
document.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('cl-stage');if(!box)return;
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var s=[].slice.call(box.querySelectorAll('.cl-s')),cur=0,timer=null;
  function load(i){var im=s[i%s.length];if(im.dataset.src){im.src=im.dataset.src;im.removeAttribute('data-src');}}
  function go(){var prev=s[cur];cur=(cur+1)%s.length;var nx=s[cur];load(cur+1);
    nx.classList.remove('kb0','kb1','kb2','kb3');void nx.offsetWidth;nx.classList.add('kb'+(cur%4),'on');
    prev.classList.add('was');prev.classList.remove('on');setTimeout(function(){prev.classList.remove('was');},2700);box.classList.remove('tick');void box.offsetWidth;box.classList.add('tick');}
  function play(){stop();if(still)return;box.classList.add('tick');timer=setInterval(go,6500);}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  s[0].classList.add('kb0');load(1);
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)play();else stop();});},{threshold:.25}).observe(box);}else play();
});
</script>`;
h = h.replace(/<script id="cl-mosaic-js">[\s\S]*?<\/script>\n/, '');
h = h.replace(/<script id="cl-stage-js">[\s\S]*?<\/script>\n/, '');
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
/* stage: one wide rectangular photo at a time, a slow zoom and drift, a long crossfade, dark cinematic edges */
.cl-stage{position:relative;width:100%;height:clamp(340px,46vw,680px);overflow:hidden;background:#0B0826}
.cl-s{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity 2.6s ease-in-out;transform-origin:50% 50%}
.cl-s.on{opacity:1;z-index:1}
.cl-s.was{opacity:1;transition:none}
.cl-s.kb0{animation:cl-kb0 9.5s linear both}
.cl-s.kb1{animation:cl-kb1 9.5s linear both}
.cl-s.kb2{animation:cl-kb2 9.5s linear both}
.cl-s.kb3{animation:cl-kb3 9.5s linear both}
@keyframes cl-kb0{from{transform:scale(1.02) translate(0,0)}to{transform:scale(1.16) translate(-2%,-1.5%)}}
@keyframes cl-kb1{from{transform:scale(1.16) translate(2%,1%)}to{transform:scale(1.03) translate(0,0)}}
@keyframes cl-kb2{from{transform:scale(1.03) translate(1.5%,-1%)}to{transform:scale(1.15) translate(-1.5%,1.5%)}}
@keyframes cl-kb3{from{transform:scale(1.15) translate(-2%,0)}to{transform:scale(1.03) translate(2%,-1%)}}
.cl-stage::before{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at center,rgba(11,8,38,0) 55%,rgba(11,8,38,.55) 100%),linear-gradient(to bottom,rgba(11,8,38,.35),rgba(11,8,38,0) 18%,rgba(11,8,38,0) 80%,rgba(11,8,38,.45))}
.cl-bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:#F3CF33;z-index:3}
.cl-stage.tick .cl-bar{animation:cl-bar 6.5s linear forwards}
@keyframes cl-bar{to{width:100%}}
#campus-life{padding-bottom:0!important}
@media(max-width:760px){.cl-stage{height:clamp(260px,72vw,420px)}}
@media(prefers-reduced-motion:reduce){.cl-s{transition:none}.cl-s[class*=kb]{animation:none}.cl-stage.tick .cl-bar{animation:none}}
</style>`;
h = h.replace(/<style id="home-photos">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '\n</head>');
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('college home photos applied');
