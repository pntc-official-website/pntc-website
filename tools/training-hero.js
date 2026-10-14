// Training Center home page: action hero. A stack of photo cards that shuffles through fire and water training,
// over a blurred, fiery copy of the photo in front, with rising embers.
// Texts stay in their Site Content slots. Photos are HeroAction1.jpg to HeroAction6.jpg in the Training Center folder,
// so they can be replaced from the admin Images screen.
// Rerunnable:  node tools/training-hero.js
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'PNTC Maritime Training and Assessment Center', 'index.html');
let h = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

const N = 6;
const nums = Array.from({ length: N }, (_, i) => i + 1);
const STAGE = `<div class="ta-stage" aria-hidden="true">
    <div class="ta-bg">${nums.map(n => `<span style="background-image:url('/maritime/HeroAction${n}.jpg')"></span>`).join('')}</div>
    <div class="ta-glow"></div>
    <div class="ta-stack">
      ${nums.map(n => `<figure class="ta-card"><img src="/maritime/HeroAction${n}.jpg" alt="" loading="eager"></figure>`).join('\n      ')}
    </div>
    <div class="ta-hud">
      <span class="ta-count"><b id="ta-cur">01</b><i>/ ${String(N).padStart(2, '0')}</i></span>
      <span class="ta-bar"><i id="ta-fill"></i></span>
      <span class="ta-thumbs">${nums.map(n => `<button type="button" tabindex="-1" data-i="${n - 1}"><img src="/maritime/HeroAction${n}.jpg" alt=""></button>`).join('')}</span>
    </div>
    <div class="ta-embers">${'<i></i>'.repeat(12)}</div>
  </div><!--/ta-stage-->`;

if (h.includes('<!--/ta-stage-->')) h = h.replace(/<div class="ta-stage"[\s\S]*?<!--\/ta-stage-->/, STAGE);
else if (h.includes('class="ta-deck"')) h = h.replace(/<div class="ta-deck"[\s\S]*?<div class="ta-embers"[^>]*>(?:<i><\/i>)*<\/div>/, STAGE);
else {
  const img = /<img class="hero-bg-img"[^>]*>/;
  if (!img.test(h)) throw new Error('hero image not found');
  h = h.replace(img, STAGE);
}

const CSS = `<style id="th-action">
/* Training Center action hero */
#hero{height:auto!important;min-height:max(100svh,660px)!important;display:flex;align-items:center;padding:calc(var(--ta-nav,120px) + 2.2rem) 0 calc(56px + 3.2rem)}
#hero .hero-content{position:relative!important;inset:auto!important;width:100%;max-width:min(54%,54rem);padding:0 0 0 clamp(1.5rem,6vw,6rem)!important;z-index:6}
#hero .th-pill{margin-bottom:1.2rem}
#hero .hero-headline{font-size:clamp(2.5rem,min(4.3vw,12vh),4.5rem)!important;line-height:1!important;margin-bottom:1.5rem;max-width:none!important}
#hero .hero-headline .hl{display:block!important;padding:.04em 0 .12em!important}
#hero .hero-headline .hl:last-child>span{animation-delay:.14s!important}
#hero .hero-sub .th-onward{font-weight:800;color:#fff}
#hero .hero-sub{max-width:34rem;margin-bottom:1.8rem}
#hero .scroll-cue{display:none}
#hero .hero-vig{background:linear-gradient(96deg,#1C1650 0%,rgba(28,22,80,.96) 30%,rgba(28,22,80,.6) 52%,rgba(28,22,80,.25) 100%),linear-gradient(to top,rgba(16,11,51,.55) 0%,rgba(16,11,51,0) 18%)!important}
.ta-stage{position:absolute;inset:0;overflow:hidden}
/* blurred, fiery copy of the photo in front */
.ta-bg{position:absolute;inset:-8%;z-index:0;filter:blur(38px) saturate(1.5) brightness(.8)}
.ta-bg span{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s ease}
.ta-bg span.on{opacity:1}
.ta-glow{position:absolute;right:4%;bottom:-26%;width:62%;height:96%;background:radial-gradient(closest-side,rgba(255,120,10,.6),rgba(255,70,0,.22) 55%,transparent);mix-blend-mode:screen;animation:ta-flicker 3.4s ease-in-out infinite;z-index:1}
/* card stack */
.ta-stack{position:absolute;z-index:4;right:clamp(2rem,6vw,6.5rem);top:calc(50% + var(--ta-nav,120px)/2 - 44px);width:min(clamp(320px,calc(68vw - 410px),760px),calc((100vh - var(--ta-nav,120px) - 240px)*1.5));aspect-ratio:3/2;transform:translateY(-50%);perspective:1400px}
.ta-card{position:absolute;inset:0;margin:0;border-radius:26px;overflow:hidden;border:5px solid #fff;background:#120D3A;box-shadow:0 44px 70px -30px rgba(0,0,0,.75),0 0 60px -6px rgba(255,120,10,.5);opacity:0;transform:translate3d(18%,10%,0) rotate(12deg) scale(.7);transition:transform .9s cubic-bezier(.2,.8,.2,1),opacity .6s ease;will-change:transform}
.ta-card img{width:100%;height:100%;object-fit:cover;display:block}
.ta-card::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(255,96,0,.3),rgba(255,96,0,0) 42%);pointer-events:none}
.ta-card.p0{opacity:1;z-index:5;transform:translate3d(0,0,0) rotate(-3deg) scale(1)}
.ta-card.p0 img{animation:ta-push 5s ease-out both}
.ta-card.p1{opacity:1;z-index:4;transform:translate3d(9%,-9%,0) rotate(4deg) scale(.93);filter:brightness(.78)}
.ta-card.p2{opacity:1;z-index:3;transform:translate3d(17%,-17%,0) rotate(9deg) scale(.86);filter:brightness(.56)}
.ta-card.out{opacity:0;z-index:6;transform:translate3d(-58%,14%,0) rotate(-22deg) scale(.96);transition:transform .75s cubic-bezier(.5,0,.8,.4),opacity .7s ease .1s}
/* counter, progress, thumbnails */
.ta-hud{position:absolute;z-index:5;right:clamp(2rem,6vw,6.5rem);bottom:calc(56px + 1.9rem);width:min(clamp(320px,calc(68vw - 410px),760px),calc((100vh - var(--ta-nav,120px) - 240px)*1.5));display:flex;align-items:center;gap:1rem}
.ta-count{display:flex;align-items:baseline;gap:.35rem;color:#fff;font-family:'Barlow Condensed','Montserrat',sans-serif}
.ta-count b{font-size:2.3rem;font-weight:800;line-height:1;color:#F3CF33}
.ta-count i{font-style:normal;font-size:.95rem;font-weight:700;letter-spacing:.08em;opacity:.7}
.ta-bar{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.25);overflow:hidden}
.ta-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#F3CF33,#FF7A1A)}
.ta-bar i.run{animation:ta-fill var(--ta-ms,3800ms) linear forwards}
.ta-thumbs{display:flex;gap:.4rem;pointer-events:auto}
.ta-thumbs button{width:42px;height:42px;padding:0;border-radius:11px;overflow:hidden;border:2px solid rgba(255,255,255,.35);background:none;cursor:pointer;opacity:.6;transition:opacity .25s,border-color .25s,transform .25s}
.ta-thumbs button img{width:100%;height:100%;object-fit:cover;display:block}
.ta-thumbs button:hover{opacity:1;transform:translateY(-3px)}
.ta-thumbs button.on{opacity:1;border-color:#F3CF33;transform:translateY(-3px)}
/* embers */
.ta-embers{position:absolute;inset:0;z-index:6;pointer-events:none;overflow:hidden}
.ta-embers i{position:absolute;bottom:-12px;width:5px;height:5px;border-radius:50%;background:#FFB03A;box-shadow:0 0 10px 3px rgba(255,130,20,.75);opacity:0;animation:ta-ember 7s linear infinite}
.ta-embers i:nth-child(1){left:46%;animation-delay:0s}
.ta-embers i:nth-child(2){left:53%;animation-delay:1.3s;animation-duration:8.5s}
.ta-embers i:nth-child(3){left:60%;animation-delay:2.6s;width:3px;height:3px}
.ta-embers i:nth-child(4){left:66%;animation-delay:.7s;animation-duration:6s}
.ta-embers i:nth-child(5){left:72%;animation-delay:3.4s;width:4px;height:4px}
.ta-embers i:nth-child(6){left:78%;animation-delay:1.9s;animation-duration:9s}
.ta-embers i:nth-child(7){left:84%;animation-delay:4.4s;width:3px;height:3px}
.ta-embers i:nth-child(8){left:90%;animation-delay:2.2s;animation-duration:7.5s}
.ta-embers i:nth-child(9){left:95%;animation-delay:5.1s}
.ta-embers i:nth-child(10){left:57%;animation-delay:5.8s;width:3px;height:3px;animation-duration:8s}
.ta-embers i:nth-child(11){left:69%;animation-delay:6.3s;animation-duration:6.5s}
.ta-embers i:nth-child(12){left:81%;animation-delay:3.9s;width:4px;height:4px}
@keyframes ta-push{from{transform:scale(1.14)}to{transform:scale(1)}}
@keyframes ta-fill{to{width:100%}}
@keyframes ta-flicker{0%,100%{opacity:.75;transform:scale(1)}30%{opacity:1;transform:scale(1.06) translateY(-2%)}55%{opacity:.6;transform:scale(.97)}80%{opacity:.95;transform:scale(1.03)}}
@keyframes ta-ember{0%{transform:translate(0,0) scale(1);opacity:0}10%{opacity:1}100%{transform:translate(-60px,-78vh) scale(.3);opacity:0}}
@media(max-width:900px){
  #hero{display:block;padding-bottom:calc(32px + 2.6rem)}
  #hero .hero-content{max-width:100%;padding:0 1.4rem!important;margin-top:calc(min(78vw,420px)*.667 + 5.4rem)}
  #hero .hero-headline{font-size:clamp(2.2rem,10.4vw,4rem)!important}
  #hero .th-pill{font-size:.54rem!important;letter-spacing:.1em!important;padding-left:.8rem;padding-right:.9rem;max-width:100%}
  #hero .hero-sub{max-width:100%}
  #hero .hero-vig{background:linear-gradient(to top,#1C1650 0%,rgba(28,22,80,.95) 46%,rgba(28,22,80,.5) 78%,rgba(28,22,80,.35) 100%)!important}
  .ta-stack{right:auto;left:50%;top:calc(var(--ta-nav,120px) + 2.4rem);width:min(78vw,420px);transform:translateX(-54%)}
  .ta-card{border-width:4px;border-radius:20px}
  .ta-hud{right:auto;left:1.4rem;width:calc(100% - 2.8rem);bottom:auto;top:calc(var(--ta-nav,120px) + 2.4rem + min(78vw,420px)*.667 + 1.5rem)}
  .ta-thumbs{display:none}
  .ta-glow{right:-10%;width:120%;bottom:auto;top:0;height:70%}
  .ta-embers i:nth-child(odd){left:22%}.ta-embers i:nth-child(even){left:74%}
  .ta-embers i:nth-child(3n){left:48%}
}
@media(prefers-reduced-motion:reduce){
  .ta-card,.ta-bg span{transition:none}
  .ta-card.p0 img,.ta-glow,.ta-bar i.run{animation:none}
  .ta-embers{display:none}
}
</style>
<script id="th-action-js">
(function(){
  /* keep the hero copy clear of the two fixed navigation bars */
  function fit(){var m=0;document.querySelectorAll('nav,header').forEach(function(e){var p=getComputedStyle(e).position;if(p==='fixed'||p==='sticky'){var r=e.getBoundingClientRect();if(r.top<200&&r.height<200)m=Math.max(m,r.bottom);}});if(m>0){var h=document.getElementById('hero');if(h)h.style.setProperty('--ta-nav',Math.round(m+(window.scrollY||0))+'px');}}
  /* shuffle the photo cards */
  function deck(){
    var cards=[].slice.call(document.querySelectorAll('.ta-card')),bgs=document.querySelectorAll('.ta-bg span'),thumbs=document.querySelectorAll('.ta-thumbs button'),cur=document.getElementById('ta-cur'),fill=document.getElementById('ta-fill'),n=cards.length,i=0,timer,MS=3800;
    if(!n)return;
    var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    function paint(prev){
      cards.forEach(function(c,k){var p=(k-i+n)%n;c.className='ta-card'+(k===prev?' out':p<3?' p'+p:'');});
      bgs.forEach(function(b,k){b.classList.toggle('on',k===i);});
      thumbs.forEach(function(t,k){t.classList.toggle('on',k===i);});
      if(cur)cur.textContent=(i<9?'0':'')+(i+1);
      if(fill&&!still){fill.classList.remove('run');void fill.offsetWidth;fill.classList.add('run');}
    }
    function go(to){var prev=i;i=(to+n)%n;paint(prev===i?-1:prev);}
    function start(){clearInterval(timer);if(!still)timer=setInterval(function(){go(i+1);},MS);}
    thumbs.forEach(function(t){t.addEventListener('click',function(){go(+t.dataset.i);start();});});
    document.addEventListener('visibilitychange',function(){if(document.hidden)clearInterval(timer);else start();});
    if(fill)fill.style.setProperty('--ta-ms',MS+'ms');
    paint(-1);start();
  }
  document.addEventListener('DOMContentLoaded',function(){fit();deck();});window.addEventListener('load',fit);window.addEventListener('resize',fit);
})();
</script>
`;
h = h.replace(/<style id="th-action">[\s\S]*?<\/script>\n/, '');
h = h.replace('</head>', CSS + '</head>');
fs.writeFileSync(FILE, h);
console.log('training hero updated');
