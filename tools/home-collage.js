// Home hero: photo collage that lands one tile at a time, in place of the slideshow. Headline and text stay.
// Rerunnable. Tiles are the files "hero-collage-NN.jpg" in the landing page folder, in number order.
const fs = require('fs');
// Run from anywhere:  node tools/home-collage.js
const DIR = require('path').join(__dirname, '..', 'PNTC Main Landing Page');
const FILE = DIR + '/index.html';
let h = fs.readFileSync(FILE, 'utf8');

const tiles = fs.readdirSync(DIR).filter(f => /^hero-collage-\d+\.jpg$/.test(f)).sort();
if (tiles.length < 8) throw new Error('not enough tiles: ' + tiles.length);
const cols = tiles.length > 16 ? 5 : 4;

// A fixed, scattered landing order and tilt per tile, so it looks hand placed but never changes between visits
const tilt = [-4, 3, -2, 5, 2, -5, 4, -3, 3, -2, 5, -4, -3, 4, -5, 2, 4, -3, 2, -4];
const order = [5, 10, 0, 15, 6, 3, 9, 12, 1, 14, 7, 4, 11, 2, 13, 8, 17, 16, 19, 18];
const rank = {}; order.filter(i => i < tiles.length).forEach((i, k) => { rank[i] = k; });

const wall = `<div class="hc-wall" aria-hidden="true" style="--cols:${cols}">
${tiles.map((f, i) => `    <figure class="hc-tile" style="--k:${rank[i]};--r:${tilt[i % tilt.length]}deg"><img src="/${f}" alt="" width="720" height="480" decoding="async"></figure>`).join('\n')}
    <span class="hc-tag">The PNTC Family</span>
  </div>`;
const starter = `
  <script>(function(){var w=document.querySelector('.hc-wall');if(!w||!('IntersectionObserver' in window))return;var r=w.getBoundingClientRect();if(r.top<window.innerHeight*.8&&r.bottom>0)return;w.classList.add('wait');var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){w.classList.remove('wait');io.disconnect();}},{threshold:.25});io.observe(w);})();</script>`;

// swap the slideshow (or a previous collage) for the collage wall
if (h.includes('<div class="hc-wall"')) {
  h = h.replace(/<div class="hc-wall"[\s\S]*?<span class="hc-tag">[^<]*<\/span>\s*<\/div>(\s*<script>\(function\(\)\{var w=document[\s\S]*?<\/script>)?/, () => wall + starter);
} else {
  const a = h.indexOf('<!-- Slideshow backgrounds -->'), b = h.indexOf('<div class="hero-vig"></div>');
  if (a < 0 || b < a) throw new Error('slideshow block not found');
  h = h.slice(0, a) + '<!-- Photo collage -->\n  ' + wall + starter + '\n\n  ' + h.slice(b);
  // slide tabs and label go with the slideshow
  const d0 = h.indexOf('<!-- Slide dots -->'), d1 = h.indexOf('<span class="hero-scroll"');
  if (d0 < 0 || d1 < d0) throw new Error('slide dots not found');
  h = h.slice(0, d0) + h.slice(d1);
}

const CSS = `<style id="hero-collage">
/* Home hero: collage of campus life. Tiles drop in one at a time, then sit as a tilted photo wall */
#hero{display:flex;align-items:center;min-height:calc(100svh - 46px)!important}
#hero .hero-vig{z-index:1;background:radial-gradient(60% 70% at 100% 0%,rgba(80,66,200,.35),transparent 70%)!important}
#hero .hero-inner{position:relative;z-index:3;max-width:min(48vw,740px)!important;padding-top:calc(var(--nav-h,72px) + 2.5rem)!important;padding-bottom:6.5rem!important}
#hero h1.hero-h1{font-size:clamp(2rem,3.05vw,3.2rem)!important;white-space:nowrap}
#hero .hero-sub{max-width:480px}
#hero .hc-wall{position:absolute;z-index:2;top:calc(var(--nav-h,72px) + 2.2rem);right:clamp(1.2rem,3vw,3.5rem);bottom:5.6rem;width:min(50vw,calc((100svh - 46px - var(--nav-h,72px) - 7.8rem) * 1.42 * var(--cols) / 4));display:grid;grid-template-columns:repeat(var(--cols),1fr);grid-auto-rows:1fr;gap:clamp(.35rem,.8vw,.8rem);align-content:center}
#hero .hc-tile{position:relative;margin:0;aspect-ratio:3/2;border:clamp(3px,.35vw,6px) solid #fff;border-radius:6px;overflow:hidden;background:#fff;box-shadow:0 18px 34px -16px rgba(0,0,0,.75);transform:rotate(var(--r)) scale(1.07);opacity:0;animation:hc-drop .85s cubic-bezier(.2,.9,.25,1.15) both;animation-delay:calc(.9s + var(--k) * .16s);transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s;z-index:1}
#hero .hc-tile:nth-child(odd){margin-top:6%}
#hero .hc-tile:nth-child(3n){margin-top:-5%}
#hero .hc-tile img{display:block;width:100%;height:100%;object-fit:cover}
#hero .hc-tile:hover{transform:rotate(0deg) scale(1.55);z-index:5;box-shadow:0 30px 50px -18px rgba(0,0,0,.85)}
#hero .hc-tag{position:absolute;right:-.5rem;bottom:-1.5rem;z-index:6;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(.85rem,1.2vw,1.1rem);letter-spacing:.14em;text-transform:uppercase;background:#F3CF33;color:#1C1650;padding:.45rem 1rem;border-radius:8px;transform:rotate(-4deg);box-shadow:4px 4px 0 rgba(0,0,0,.35);opacity:0;animation:hc-tag .6s cubic-bezier(.2,.9,.25,1.3) both;animation-delay:calc(1.2s + ${tiles.length} * .16s)}
@keyframes hc-drop{0%{opacity:0;transform:translateY(-70px) rotate(calc(var(--r) * 4)) scale(1.9);filter:blur(8px)}55%{opacity:1;filter:blur(0)}75%{transform:translateY(4px) rotate(calc(var(--r) * .6)) scale(1.02)}100%{opacity:1;transform:rotate(var(--r)) scale(1.07)}}
@keyframes hc-tag{from{opacity:0;transform:rotate(-14deg) scale(.4)}to{opacity:1;transform:rotate(-4deg) scale(1)}}
#hero .hc-wall.wait .hc-tile,#hero .hc-wall.wait .hc-tag{animation-play-state:paused}
#hero .hero-scroll{z-index:4}
@media(max-width:960px){
  #hero{flex-direction:column;align-items:stretch}
  #hero .hero-inner{order:1;max-width:none!important;padding-bottom:2rem!important}
  #hero h1.hero-h1{font-size:clamp(1.6rem,6.9vw,3rem)!important}
  #hero .hc-wall{order:2;position:relative;top:auto;right:auto;bottom:auto;width:auto;margin:0 clamp(1.2rem,4vw,3rem) 5.5rem;grid-template-columns:repeat(4,1fr)}
  #hero .hc-tile:hover{transform:rotate(0deg) scale(1.25)}
  #hero .hc-tag{right:.2rem;bottom:-1.9rem}
  #hero{min-height:0!important}
  #hero h1.hero-h1{white-space:normal}
}
@media(prefers-reduced-motion:reduce){
  #hero .hc-tile,#hero .hc-tag{animation:none;opacity:1}
}
</style>
`;
h = h.replace(/<style id="hero-collage">[\s\S]*?<\/style>\n?/, '');
h = h.replace('</head>', CSS + '</head>');
fs.writeFileSync(FILE, h);
console.log('collage applied with', tiles.length, 'tiles,', cols, 'columns');
