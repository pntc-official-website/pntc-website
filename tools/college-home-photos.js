// College home page: photos so the page does not read as text only.
//  - a photo on top of each "Why Choose PNTC" card (Home - Our Story / Our People / Our Promise .jpg, and the Engine Room Simulator facility photo)
//  - a Campus Life memories scene after the values (Campus Life 01.jpg to 11.jpg): printed photos that develop into view, rest and fade, then return with the next photo
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
// print slots: left %, top %, width, tilt in degrees, and the spot on phones (left %, top %); the last three are not shown on phones
const SLOTS = [[17, 31, 'clamp(220px,26vw,400px)', -7, 32, 22], [41, 25, 'clamp(200px,23vw,350px)', 4, 68, 40], [66, 30, 'clamp(230px,27vw,410px)', -3, 34, 62],
  [87, 40, 'clamp(190px,21vw,320px)', 8, 68, 80], [25, 72, 'clamp(200px,23vw,340px)', 5], [53, 69, 'clamp(240px,28vw,430px)', -4], [79, 74, 'clamp(190px,22vw,330px)', -8]];
const print = ([x, y, w, r, mx, my], i) => `<figure class="cl-print${mx === undefined ? ' cl-wide' : ''}" style="--x:${x}%;--y:${y}%;--w:${w};--r:${r}deg${mx === undefined ? '' : `;--mx:${mx}%;--my:${my}%`}"><img src="${photo(i)}" alt="${LIFE[i]}" loading="lazy" width="900" height="600"></figure>`;
const LIFE_HTML = `<!-- ══════ CAMPUS LIFE ══════ -->
<section id="campus-life" aria-label="Campus life at PNTC Colleges">
  <div class="cl-head reveal">
    <div class="eyebrow">${slot('college.life.eyebrow', 'Life at PNTC')}</div>
    <h2>${slot('college.life.title', 'Campus')} <span>${slot('college.life.mark', 'Life')}</span></h2>
    <p>${slot('college.life.lead', 'Parades, ceremonies, celebrations and the friendships that last long after graduation.')}</p>
  </div>
  <div class="cl-mem" id="cl-mem" aria-label="Campus life photos" data-photos="${LIFE.map((a, i) => photo(i) + "~" + a).join("|")}">${SLOTS.map(print).join("")}</div>
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

// the memories: each print develops into view, rests, fades away, then comes back a little moved with the next photo
const JS = `<script id="cl-mem-js">
document.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('cl-mem');if(!box)return;
  var prints=[].slice.call(box.querySelectorAll('.cl-print'));
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches){prints.forEach(function(p){p.classList.add('show');});return;}
  var all=box.getAttribute('data-photos').split('|').map(function(x){x=x.split('~');return{src:x[0],alt:x[1]};});
  var used=prints.map(function(p,i){return i;}),next=prints.length,z=10,running=false,timers=[];
  function later(f,ms){timers.push(setTimeout(f,ms));}
  function cycle(p,i){
    if(!running)return;
    p.style.zIndex=++z;p.classList.add('show');
    later(function(){
      p.classList.remove('show');
      later(function(){
        var k=next%all.length;while(used.indexOf(k)>-1)k=(k+1)%all.length;next=k+1;used[i]=k;
        var img=p.querySelector('img'),pre=new Image();
        pre.onload=function(){img.src=all[k].src;img.alt=all[k].alt;
          p.style.setProperty('--dx',(Math.random()*40-20).toFixed(0)+'px');p.style.setProperty('--dy',(Math.random()*30-15).toFixed(0)+'px');
          p.style.setProperty('--j',(Math.random()*6-3).toFixed(1)+'deg');
          later(function(){cycle(p,i);},900);};
        pre.src=all[k].src;
      },3000);
    },8000);
  }
  function start(){if(running)return;running=true;prints.forEach(function(p,i){later(function(){cycle(p,i);},i*1700);});}
  function stop(){running=false;timers.forEach(clearTimeout);timers=[];}
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)start();else stop();});},{threshold:.2}).observe(box);}else start();
});
</script>`;
h = h.replace(/<script id="cl-stage-js">[\s\S]*?<\/script>\n/, '');
h = h.replace(/<script id="cl-mem-js">[\s\S]*?<\/script>\n/, '');
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
/* memories: printed photos scattered on a dark, softly lit surface; each develops into view, rests, and fades away */
.cl-mem{position:relative;height:clamp(440px,46vw,680px);overflow:hidden;background:radial-gradient(ellipse 70% 60% at 50% 45%,#2A2170 0%,#15104A 45%,#0B0826 100%)}
.cl-mem::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,.05) 1px,transparent 0);background-size:22px 22px;pointer-events:none}
.cl-mem::after{content:'';position:absolute;inset:0;z-index:100;pointer-events:none;background:radial-gradient(ellipse at center,rgba(11,8,38,0) 60%,rgba(11,8,38,.6) 100%)}
.cl-print{position:absolute;left:var(--x);top:var(--y);width:var(--w);margin:0;padding:clamp(6px,.7vw,10px);background:#FBF8F1;box-shadow:0 2px 3px rgba(0,0,0,.25),0 30px 50px -18px rgba(0,0,0,.75);
  transform:translate(calc(-50% + var(--dx,0px)),calc(-50% + var(--dy,0px))) rotate(calc(var(--r) + var(--j,0deg))) scale(.9);opacity:0;filter:blur(8px) sepia(.9) brightness(1.15);
  transition:opacity 2.6s ease,transform 3.2s cubic-bezier(.2,.7,.2,1),filter 3.4s ease}
.cl-print.show{opacity:1;transform:translate(calc(-50% + var(--dx,0px)),calc(-50% + var(--dy,0px))) rotate(calc(var(--r) + var(--j,0deg))) scale(1);filter:blur(0) sepia(0) brightness(1)}
.cl-print img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover}
#campus-life{padding-bottom:0!important}
@media(max-width:760px){
  .cl-mem{height:clamp(420px,120vw,560px)}
  .cl-print{left:var(--mx);top:var(--my);width:min(54vw,240px)}
  .cl-print.cl-wide{display:none}
}
@media(prefers-reduced-motion:reduce){.cl-print{transition:none}}
</style>`;
h = h.replace(/<style id="home-photos">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '\n</head>');
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('college home photos applied');
