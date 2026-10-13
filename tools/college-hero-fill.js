// College hero: fill the left column. Bigger headline, program quick links, soft background decoration.
// One-off edit of PNTC Colleges/index.html (stops if it has already been applied).
const fs = require('fs');
const FILE = require('path').join(__dirname, '..', 'PNTC Colleges', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
if (h.includes('class="hx-progs"')) throw new Error('already applied');

const N = '#1C1650', GOLD = '#F3CF33';
const PROGS = [['BSMT', 'bsmt', 'BS Marine Transportation'], ['BSMarE', 'bsmare', 'BS Marine Engineering'], ['BSTM', 'bstm', 'BS Tourism Management'], ['BSCrim', 'bscrim', 'BS Criminology'], ['BSCusAd', 'bscusad', 'BS Customs Administration'], ['BSOA', 'bsoa', 'BS Office Administration']];

const swaps = [
  // headline grows with the column, but never under the card that overlaps the middle
  ["font-size:clamp(2.8rem,4.7vw,5rem);line-height:.98;",
   "font-size:clamp(2.8rem,min(5.4vw,calc((55.5vw - 6vw - var(--sh) * .22 - 1.5rem) / 8.3)),6.6rem);line-height:.98;"],
  ["#hero.hx .hx-sub{font-size:clamp(.95rem,1.15vw,1.05rem);line-height:1.7;color:rgba(28,22,80,.78);max-width:46ch;margin:0 0 1.9rem;",
   "#hero.hx .hx-sub{font-size:clamp(1rem,1.25vw,1.22rem);line-height:1.7;color:rgba(28,22,80,.8);max-width:44ch;margin:0 0 1.9rem;"],
  ["#hero.hx .hx-proof{display:flex;align-items:center;gap:1rem;animation:hx-fade .9s 2.3s both}",
   `#hero.hx .hx-proof{display:flex;align-items:center;gap:1rem;animation:hx-fade .9s 2.45s both}
#hero.hx .hx-progs{display:flex;flex-wrap:wrap;align-items:center;gap:.55rem;margin:0 0 1.7rem;max-width:560px;animation:hx-fade .9s 2.3s both}
#hero.hx .hx-progs span{flex-basis:100%;font-size:.7rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(28,22,80,.65);margin-bottom:.15rem}
#hero.hx .hx-progs a{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:.95rem;letter-spacing:.1em;color:${N};text-decoration:none;background:#fff;border:1.5px solid rgba(28,22,80,.18);border-radius:999px;padding:.42rem 1.05rem;box-shadow:0 8px 16px -12px rgba(28,22,80,.5);transition:background .2s,border-color .2s,transform .2s}
#hero.hx .hx-progs a:hover{background:${GOLD};border-color:${GOLD};transform:translateY(-2px)}
/* soft decoration so the light side is not a flat panel */
#hero.hx .hx-copy::before{content:'';position:absolute;z-index:-1;left:clamp(.5rem,2vw,2rem);top:clamp(.5rem,3vh,2rem);width:190px;height:150px;background:radial-gradient(rgba(28,22,80,.2) 1.6px,transparent 2px) 0 0/19px 19px;-webkit-mask-image:linear-gradient(135deg,#000,transparent 75%);mask-image:linear-gradient(135deg,#000,transparent 75%);pointer-events:none}
#hero.hx .hx-copy::after{content:'';position:absolute;z-index:-1;right:8%;top:8%;width:46%;aspect-ratio:1;border-radius:50%;background:radial-gradient(closest-side,rgba(243,207,51,.3),transparent);pointer-events:none;animation:hx-float 9s ease-in-out infinite}
#hero.hx .hx-ghost{position:absolute;z-index:-1;left:clamp(1rem,5vw,5rem);bottom:-.16em;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(9rem,19vw,22rem);line-height:.8;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:2px rgba(28,22,80,.07);pointer-events:none;user-select:none;white-space:nowrap}`],
  ["  #hero.hx .hx-d2{display:none}", "  #hero.hx .hx-d2{display:none}\n  #hero.hx .hx-ghost{font-size:34vw;left:1rem}\n  #hero.hx .hx-copy::after{width:70%;right:-10%}"],
  ["#hero.hx .hx-btns,#hero.hx .hx-proof,#hero.hx .hx-stage,#hero.hx .hx-tabs{animation:none}", "#hero.hx .hx-btns,#hero.hx .hx-progs,#hero.hx .hx-proof,#hero.hx .hx-stage,#hero.hx .hx-tabs,#hero.hx .hx-copy::after{animation:none}"],
  ['    <div class="hx-proof">',
   `    <div class="hx-progs"><span>Degree Programs</span>${PROGS.map(([a, id, name]) => `<a href="/college/programs#prog-${id}" title="${name}">${a}</a>`).join('')}</div>
    <div class="hx-proof">`],
  ['  <div class="hx-copy">', '  <div class="hx-copy">\n    <span class="hx-ghost" aria-hidden="true">PNTC</span>'],
];
for (const [a, b] of swaps) { if (!h.includes(a)) throw new Error('not found: ' + a.slice(0, 70)); h = h.replace(a, b); }
fs.writeFileSync(FILE, h);
console.log('ok');
