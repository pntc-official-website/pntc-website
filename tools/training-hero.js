// Training Center home page: action hero (three slanted photo strips that cross-fade between fire and water training).
// Texts stay in their Site Content slots. Photos are HeroAction1.jpg to HeroAction6.jpg in the Training Center folder,
// so they can be replaced from the admin Images screen.
// Rerunnable:  node tools/training-hero.js
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'PNTC Maritime Training and Assessment Center', 'index.html');
let h = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

const strip = (a, b) => `<div class="ta-strip"><img src="/maritime/HeroAction${a}.jpg" alt="" loading="eager"><img src="/maritime/HeroAction${b}.jpg" alt="" loading="eager"></div>`;
const DECK = `<div class="ta-deck" aria-hidden="true">
    ${strip(1, 2)}
    ${strip(3, 4)}
    ${strip(5, 6)}
  </div>
  <div class="ta-embers" aria-hidden="true">${'<i></i>'.repeat(12)}</div>`;

if (h.includes('class="ta-deck"')) h = h.replace(/<div class="ta-deck"[\s\S]*?<div class="ta-embers"[^>]*>(?:<i><\/i>)*<\/div>/, DECK);
else {
  const img = /<img class="hero-bg-img"[^>]*>/;
  if (!img.test(h)) throw new Error('hero image not found');
  h = h.replace(img, DECK);
}

const CSS = `<style id="th-action">
/* Training Center action hero */
#hero{height:auto!important;min-height:max(100svh,640px)!important;display:flex;align-items:center;padding:calc(var(--ta-nav,120px) + 2.2rem) 0 calc(56px + 3.2rem)}
#hero .hero-content{position:relative!important;inset:auto!important;width:100%;max-width:min(54%,46rem);padding:0 0 0 clamp(1.5rem,6vw,6rem)!important;z-index:6}
#hero .th-pill{margin-bottom:1.2rem}
#hero .hero-headline{font-size:clamp(2.9rem,min(8vw,15vh),7.6rem)!important;line-height:.92!important;margin-bottom:1.3rem}
#hero .hero-headline .hl{display:inline-block!important;vertical-align:top;margin-right:.22em}
#hero .hero-headline .hl:last-child{display:block!important;margin-right:0}
#hero .hero-sub{max-width:34rem;margin-bottom:1.8rem}
#hero .scroll-cue{display:none}
.ta-deck{position:absolute;top:-6%;bottom:-6%;right:-7%;width:60%;display:flex;gap:clamp(8px,1vw,16px);transform:skewX(-10deg);z-index:1}
.ta-strip{flex:1;position:relative;overflow:hidden;background:#120D3A;animation:ta-in 1s cubic-bezier(.2,.8,.2,1) both}
.ta-strip:nth-child(1){margin:7% 0 0;animation-name:ta-in-up}
.ta-strip:nth-child(2){margin:0 0 5%;animation-delay:.12s}
.ta-strip:nth-child(3){margin:10% 0 0;animation-name:ta-in-up;animation-delay:.24s}
.ta-strip img{position:absolute;top:0;left:-32%;width:164%;height:100%;object-fit:cover;transform:skewX(10deg) scale(1.08);animation:ta-swap 12s ease-in-out infinite,ta-zoom 12s linear infinite}
.ta-strip img:nth-child(2){animation-delay:-6s,-6s}
.ta-strip:nth-child(2) img{animation-delay:-2s,-2s}
.ta-strip:nth-child(2) img:nth-child(2){animation-delay:-8s,-8s}
.ta-strip:nth-child(3) img{animation-delay:-4s,-4s}
.ta-strip:nth-child(3) img:nth-child(2){animation-delay:-10s,-10s}
.ta-strip::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(255,106,0,.34),rgba(28,22,80,0) 46%),linear-gradient(to bottom,rgba(16,11,51,.5),rgba(16,11,51,0) 30%);pointer-events:none}
.ta-strip::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#F3CF33;z-index:2}
#hero .hero-vig{background:linear-gradient(96deg,#1C1650 0%,#1C1650 30%,rgba(28,22,80,.82) 44%,rgba(28,22,80,.2) 64%,rgba(28,22,80,0) 80%),linear-gradient(to top,rgba(16,11,51,.85) 0%,rgba(16,11,51,0) 34%)!important}
.ta-embers{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
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
@keyframes ta-in{from{transform:translateY(-110%)}to{transform:none}}
@keyframes ta-in-up{from{transform:translateY(110%)}to{transform:none}}
@keyframes ta-swap{0%,42%{opacity:1}50%,92%{opacity:0}100%{opacity:1}}
@keyframes ta-zoom{from{transform:skewX(10deg) scale(1.08)}to{transform:skewX(10deg) scale(1.22)}}
@keyframes ta-ember{0%{transform:translate(0,0) scale(1);opacity:0}10%{opacity:1}100%{transform:translate(-60px,-78vh) scale(.3);opacity:0}}
@media(max-width:900px){
  #hero{padding-bottom:calc(32px + 2.6rem);align-items:flex-end}
  #hero .hero-content{max-width:100%;padding:0 1.4rem!important}
  #hero .hero-headline{font-size:clamp(2.8rem,15vw,5rem)!important}
  #hero .th-pill{font-size:.54rem!important;letter-spacing:.1em!important;padding-left:.8rem;padding-right:.9rem;max-width:100%}
  #hero .hero-sub{max-width:100%}
  .ta-deck{right:-22%;left:-22%;width:auto}
  #hero .hero-vig{background:linear-gradient(to top,#1C1650 0%,rgba(28,22,80,.94) 46%,rgba(28,22,80,.55) 72%,rgba(28,22,80,.35) 100%)!important}
  .ta-embers i{left:auto}
  .ta-embers i:nth-child(odd){left:22%}.ta-embers i:nth-child(even){left:74%}
  .ta-embers i:nth-child(3n){left:48%}
}
@media(prefers-reduced-motion:reduce){
  .ta-strip,.ta-strip img{animation:none}
  .ta-strip img:nth-child(2){opacity:0}
  .ta-embers{display:none}
}
</style>
<script id="th-action-js">
/* keep the hero copy clear of the two fixed navigation bars */
(function(){function fit(){var m=0;['global-nav','gnav','nav','header'].forEach(function(id){var e=document.getElementById(id);if(e){var r=e.getBoundingClientRect();if(getComputedStyle(e).position==='fixed'||getComputedStyle(e).position==='sticky')m=Math.max(m,r.bottom);}});document.querySelectorAll('nav,header').forEach(function(e){var p=getComputedStyle(e).position;if(p==='fixed'||p==='sticky'){var r=e.getBoundingClientRect();if(r.top<200&&r.height<200)m=Math.max(m,r.bottom);}});if(m>0){var h=document.getElementById('hero');if(h)h.style.setProperty('--ta-nav',Math.round(m+(window.scrollY||0))+'px');}}
document.addEventListener('DOMContentLoaded',fit);window.addEventListener('load',fit);window.addEventListener('resize',fit);})();
</script>
`;
h = h.replace(/<style id="th-action">[\s\S]*?<\/script>\n/, '');
h = h.replace('</head>', CSS + '</head>');
fs.writeFileSync(FILE, h);
console.log('training hero updated');
