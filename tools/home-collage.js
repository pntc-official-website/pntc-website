// Home hero: moving photo wall of campus life, in place of the slideshow. Headline and text stay.
// Photos rise in one at a time, then three columns drift slowly in opposite directions.
// Rerunnable. Photos are the files "hero-collage-NN.jpg" in the landing page folder, in number order.
// Run from anywhere:  node tools/home-collage.js
const fs = require('fs');
const DIR = require('path').join(__dirname, '..', 'PNTC Main Landing Page');
const FILE = DIR + '/index.html';
let h = fs.readFileSync(FILE, 'utf8');

const files = fs.readdirSync(DIR).filter(f => /^hero-collage-\d+\.jpg$/.test(f)).sort();
if (files.length < 9) throw new Error('not enough photos: ' + files.length);

// deal the photos into three columns, people shots first in each
const COLS = 4;
const cols = Array.from({ length: COLS }, () => []);
files.forEach((f, i) => cols[i % COLS].push({ f, k: i }));

const tile = (t, dupe) => `<figure class="hc-tile" style="--k:${t.k}"${dupe ? ' aria-hidden="true"' : ''}><img src="/${t.f}" alt="" width="720" height="480" decoding="async"></figure>`;
const wall = `<div class="hc-wall" aria-hidden="true">
    <div class="hc-cols">
${cols.map((c, i) => `      <div class="hc-col hc-c${i + 1}"><div class="hc-track">${c.map(t => tile(t)).join('')}${c.map(t => tile(t, true)).join('')}${c.map(t => tile(t, true)).join('')}</div></div>`).join('\n')}
    </div>
    <span class="hc-tag"><i></i>The Family We Are Building</span>
  </div>`;
const starter = `
  <script>(function(){var w=document.querySelector('.hc-wall');if(!w||!('IntersectionObserver' in window))return;var r=w.getBoundingClientRect();if(r.top<window.innerHeight*.8&&r.bottom>0)return;w.classList.add('wait');var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){w.classList.remove('wait');io.disconnect();}},{threshold:.2});io.observe(w);})();</script>`;

// swap the slideshow (or a previous wall) for the new wall
if (h.includes('<div class="hc-wall"')) {
  const a = h.indexOf('<div class="hc-wall"'), b = h.indexOf('<div class="hero-vig"></div>');
  if (b < a) throw new Error('wall block not found');
  h = h.slice(0, a) + wall + starter + '\n\n  ' + h.slice(b);
} else {
  const a = h.indexOf('<!-- Slideshow backgrounds -->'), b = h.indexOf('<div class="hero-vig"></div>');
  if (a < 0 || b < a) throw new Error('slideshow block not found');
  h = h.slice(0, a) + '<!-- Photo collage -->\n  ' + wall + starter + '\n\n  ' + h.slice(b);
  const d0 = h.indexOf('<!-- Slide dots -->'), d1 = h.indexOf('<span class="hero-scroll"');
  if (d0 < 0 || d1 < d0) throw new Error('slide dots not found');
  h = h.slice(0, d0) + h.slice(d1);
}

const N = files.length;
const CSS = `<style id="hero-collage">
/* Home hero: moving photo wall. Photos rise in one by one, then the columns drift */
#hero{display:flex;align-items:center;min-height:calc(100svh - 46px)!important}
#hero .hero-vig{z-index:1;background:radial-gradient(60% 70% at 100% 0%,rgba(80,66,200,.35),transparent 70%)!important}
#hero .hero-inner{position:relative;z-index:3;max-width:min(46vw,720px)!important;padding-top:calc(var(--nav-h,72px) + 2.5rem)!important;padding-bottom:6.5rem!important}
#hero h1.hero-h1{font-size:clamp(2rem,3.05vw,3.2rem)!important;white-space:nowrap}
#hero .hero-sub{max-width:480px;text-shadow:0 2px 14px rgba(16,11,51,.9)}
#hero h1.hero-h1{text-shadow:0 4px 26px rgba(16,11,51,.85)}
#hero .hero-inner::before{content:'';position:absolute;z-index:-1;left:-10%;top:10%;width:120%;height:80%;background:radial-gradient(closest-side,rgba(16,11,51,.75),transparent);pointer-events:none}
#hero .hc-wall{position:absolute;z-index:2;top:0;right:0;bottom:0;width:76vw;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.1) 16%,rgba(0,0,0,.26) 30%,#000 46%),linear-gradient(180deg,transparent 4%,#000 20%,#000 82%,transparent 100%);-webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.1) 16%,rgba(0,0,0,.26) 30%,#000 46%),linear-gradient(180deg,transparent 4%,#000 20%,#000 82%,transparent 100%);mask-composite:intersect}
#hero .hc-cols{position:absolute;inset:-12% -3% -12% 2%;display:grid;grid-template-columns:repeat(${COLS},1fr);gap:clamp(.7rem,1.2vw,1.2rem);transform:rotate(-6deg)}
#hero .hc-col{min-width:0}
#hero .hc-track{display:flex;flex-direction:column;gap:clamp(.7rem,1.2vw,1.2rem);animation:hc-up 46s linear infinite;will-change:transform}
#hero .hc-c2 .hc-track{animation-name:hc-down;animation-duration:54s}
#hero .hc-c3 .hc-track{animation-duration:40s}
#hero .hc-c4 .hc-track{animation-name:hc-down;animation-duration:50s}
#hero .hc-wall:hover .hc-track{animation-play-state:paused}
#hero .hc-tile{position:relative;margin:0;aspect-ratio:4/3;border-radius:clamp(12px,1.2vw,20px);overflow:hidden;background:#251D63;box-shadow:0 24px 44px -22px rgba(0,0,0,.8);opacity:0;animation:hc-rise 1.1s cubic-bezier(.16,.9,.25,1) both;animation-delay:calc(.5s + var(--k) * .14s);flex:none}
#hero .hc-tile::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);pointer-events:none}
#hero .hc-tile img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
#hero .hc-tile:hover img{transform:scale(1.08)}
#hero .hc-tag{position:absolute;right:clamp(1.2rem,3vw,3.2rem);bottom:5.2rem;z-index:6;display:inline-flex;align-items:center;gap:.7rem;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(.95rem,1.25vw,1.2rem);letter-spacing:.16em;text-transform:uppercase;color:#fff;background:rgba(16,11,51,.62);border:1px solid rgba(255,255,255,.28);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:.7rem 1.3rem;border-radius:999px;box-shadow:0 18px 34px -16px rgba(0,0,0,.8);opacity:0;animation:hc-tag .8s cubic-bezier(.2,.9,.25,1.2) both;animation-delay:calc(.9s + ${N} * .14s)}
#hero .hc-tag i{width:9px;height:9px;border-radius:50%;background:#F3CF33;box-shadow:0 0 0 5px rgba(243,207,51,.28)}
#hero .hc-wall.wait .hc-tile,#hero .hc-wall.wait .hc-tag,#hero .hc-wall.wait .hc-track{animation-play-state:paused}
@keyframes hc-rise{0%{opacity:0;transform:translateY(90px) scale(.72);filter:blur(10px) brightness(1.6)}60%{opacity:1;filter:blur(0) brightness(1.1)}100%{opacity:1;transform:none;filter:none}}
@keyframes hc-up{from{transform:translateY(0)}to{transform:translateY(calc(-33.3333% - clamp(.7rem,1.2vw,1.2rem) / 3))}}
@keyframes hc-down{from{transform:translateY(calc(-33.3333% - clamp(.7rem,1.2vw,1.2rem) / 3))}to{transform:translateY(0)}}
@keyframes hc-left{from{transform:translateX(0)}to{transform:translateX(calc(-33.3333% - .2333rem))}}
@keyframes hc-right{from{transform:translateX(calc(-33.3333% - .2333rem))}to{transform:translateX(0)}}
@keyframes hc-tag{from{opacity:0;transform:translateY(20px) scale(.8)}to{opacity:1;transform:none}}
#hero .hero-scroll{z-index:4}
@media(max-width:960px){
  #hero{flex-direction:column;align-items:stretch;min-height:0!important}
  #hero .hero-inner{order:1;max-width:none!important;padding-bottom:2rem!important}
  #hero h1.hero-h1{font-size:clamp(1.6rem,6.9vw,3rem)!important;white-space:normal}
  #hero .hc-wall{order:2;position:relative;top:auto;right:auto;bottom:auto;width:auto;margin:0 0 4.5rem;padding:.5rem 0 3.6rem;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);-webkit-mask-composite:source-over;mask-composite:add}
  #hero .hc-cols{position:relative;inset:auto;display:flex;flex-direction:column;gap:.7rem;transform:none}
  #hero .hc-track{flex-direction:row;gap:.7rem;width:max-content;animation-name:hc-left}
  #hero .hc-c2 .hc-track,#hero .hc-c4 .hc-track{animation-name:hc-right}
  #hero .hc-tile{width:min(44vw,260px)}
  #hero .hc-tag{right:auto;left:50%;bottom:.2rem;translate:-50% 0;white-space:nowrap}
}
@media(prefers-reduced-motion:reduce){
  #hero .hc-tile,#hero .hc-tag{animation:none;opacity:1}
  #hero .hc-track{animation:none}
}
</style>
`;
h = h.replace(/<style id="hero-collage">[\s\S]*?<\/style>\n?/, '');
h = h.replace('</head>', CSS + '</head>');
fs.writeFileSync(FILE, h);
console.log('photo wall applied with', N, 'photos in', COLS, 'columns');
