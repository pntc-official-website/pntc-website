// College home page: photos so the page does not read as text only.
//  - a photo on top of each "Why Choose PNTC" card (Home - Our Story / Our People / Our Promise .jpg, and the Engine Room Simulator facility photo)
//  - a Campus Life photo mosaic after the values (Campus Life 01.jpg to 11.jpg): photos only; every few seconds one tile reveals the next photo
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
const TILES = 5;
const tile = (i) => `<figure class="cl-t cl-t${i + 1}"><img src="${photo(i)}" alt="${LIFE[i]}" loading="lazy" width="900" height="600"></figure>`;
const LIFE_HTML = `<!-- ══════ CAMPUS LIFE ══════ -->
<section id="campus-life" aria-label="Campus life at PNTC Colleges">
  <div class="cl-head reveal">
    <div class="eyebrow">${slot('college.life.eyebrow', 'Life at PNTC')}</div>
    <h2>${slot('college.life.title', 'Campus')} <span>${slot('college.life.mark', 'Life')}</span></h2>
    <p>${slot('college.life.lead', 'Parades, ceremonies, celebrations and the friendships that last long after graduation.')}</p>
  </div>
  <div class="cl-mosaic" id="cl-mosaic" data-photos="${LIFE.map((a, i) => photo(i) + '~' + a).join('|')}">${Array.from({ length: TILES }, (_, i) => tile(i)).join('')}</div>
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

// the mosaic: every few seconds one tile reveals the next photo that is not on screen, sliding up over the old one
const JS = `<script id="cl-mosaic-js">
document.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('cl-mosaic');if(!box)return;
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;if(still)return;
  var all=box.getAttribute('data-photos').split('|').map(function(x){x=x.split('~');return{src:x[0],alt:x[1]};});
  var tiles=[].slice.call(box.children),shown=tiles.map(function(t,i){return i;}),next=tiles.length,last=-1,timer=null,busy=false;
  function swap(){
    if(busy)return;var vis=tiles.map(function(t,i){return t.offsetParent?i:-1;}).filter(function(i){return i>-1&&i!==last;});if(!vis.length)return;
    var k=vis[Math.floor(Math.random()*vis.length)];last=k;
    var p=next%all.length;while(shown.indexOf(p)>-1)p=(p+1)%all.length;next=p+1;
    var t=tiles[k],old=t.querySelector('img'),img=new Image();img.alt=all[p].alt;img.className='in';
    img.onload=function(){busy=true;t.appendChild(img);shown[k]=p;setTimeout(function(){old.remove();img.className='';busy=false;},1900);};
    img.src=all[p].src;
  }
  function play(){stop();timer=setInterval(swap,3200);}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)play();else stop();});},{threshold:.2}).observe(box);}else play();
});
</script>`;
h = h.replace(/<script id="cl-acc-js">[\s\S]*?<\/script>\n/, '');
h = h.replace(/<script id="cl-mosaic-js">[\s\S]*?<\/script>\n/, '');
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
/* mosaic: photos only, in tiles of mixed sizes; a tile reveals its next photo sliding up with a slow zoom */
.cl-mosaic{display:grid;grid-template-columns:1.6fr 1fr 1fr 1.25fr;grid-template-rows:repeat(2,clamp(170px,17vw,260px));gap:clamp(.6rem,1.2vw,1rem);max-width:1280px;margin:0 auto;padding:0 clamp(1rem,4vw,3rem)}
.cl-t{position:relative;margin:0;border-radius:22px;overflow:hidden;background:#1C1650;box-shadow:0 2px 4px rgba(28,22,80,.06),0 22px 36px -22px rgba(28,22,80,.55);transition:transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .5s}
.cl-t:hover{transform:translateY(-6px);box-shadow:0 2px 4px rgba(28,22,80,.08),0 34px 50px -24px rgba(28,22,80,.65)}
.cl-t img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;animation:cl-drift 14s ease-in-out infinite alternate}
.cl-t img.in{z-index:1;animation:cl-reveal 1.9s cubic-bezier(.7,0,.2,1) both}
@keyframes cl-reveal{from{clip-path:inset(100% 0 0 0);transform:scale(1.18)}to{clip-path:inset(0 0 0 0);transform:scale(1)}}
@keyframes cl-drift{from{transform:scale(1)}to{transform:scale(1.07)}}
.cl-t1{grid-column:1;grid-row:1 / span 2}
.cl-t2{grid-column:2 / span 2;grid-row:1}
.cl-t3{grid-column:4;grid-row:1 / span 2}
.cl-t4{grid-column:2;grid-row:2}
.cl-t5{grid-column:3;grid-row:2}
@media(max-width:760px){
  .cl-mosaic{grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,clamp(140px,38vw,200px))}
  .cl-t1{grid-column:1 / span 2;grid-row:1}
  .cl-t2{grid-column:1;grid-row:2}
  .cl-t3{grid-column:2;grid-row:2 / span 2}
  .cl-t4{grid-column:1;grid-row:3}
  .cl-t5{display:none}
}
@media(prefers-reduced-motion:reduce){.cl-t img{animation:none}}
</style>`;
h = h.replace(/<style id="home-photos">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '\n</head>');
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('college home photos applied');
