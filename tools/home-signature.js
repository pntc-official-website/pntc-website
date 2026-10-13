// Home page hero: the caption on the photo wall becomes the "Onward PNTC" signature (script lettering with a pen flourish).
// The text stays editable in Site Content > Home page hero. Rerunnable:  node tools/home-signature.js
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'PNTC Main Landing Page', 'index.html');
let h = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

if (!h.includes('family=Kaushan+Script')) h = h.replace('&family=Barlow+Condensed:wght@800;900&display=swap', '&family=Barlow+Condensed:wght@800;900&family=Kaushan+Script&display=swap');

const TAG = /<span class="hc-tag[^"]*">[\s\S]*?<!--c:main\.hero\.wall-->([\s\S]*?)<!--\/c-->[\s\S]*?<\/span>(?:<!--\/sig-->)?/;
const m = TAG.exec(h);
if (!m) throw new Error('caption not found');
const text = m[1].trim() === 'The Family We Are Building' ? 'Onward PNTC' : m[1];
h = h.replace(TAG, `<span class="hc-tag hc-sig"><span class="hc-sig-t"><!--c:main.hero.wall-->${text}<!--/c--></span><svg class="hc-sig-line" viewBox="0 0 320 34" preserveAspectRatio="none" aria-hidden="true"><path d="M6 22 C 70 8, 150 6, 232 14 S 300 24, 314 10 M250 27 C 272 20, 296 20, 312 25"/></svg></span><!--/sig-->`);

const CSS = `<style id="hc-sig">
/* "Onward PNTC" signature on the photo wall */
#hero .hc-tag.hc-sig{display:block;right:clamp(4.6rem,6vw,6.5rem);bottom:clamp(2.4rem,6vh,4.2rem);padding:1.1rem 2.2rem 1.5rem 2.6rem;background:radial-gradient(closest-side,rgba(16,11,51,.82),rgba(16,11,51,.55) 62%,rgba(16,11,51,0));border:0;border-radius:0;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;letter-spacing:0;text-transform:none;transform-origin:60% 60%;rotate:-5deg}
#hero .hc-sig-t{display:block;font-family:'Kaushan Script','Brush Script MT',cursive;font-weight:400;font-size:clamp(2.3rem,4.3vw,4.2rem);line-height:1.05;color:#F3CF33;white-space:nowrap;text-shadow:0 3px 0 rgba(16,11,51,.55),0 10px 26px rgba(0,0,0,.6)}
#hero .hc-sig-line{display:block;width:104%;height:.62em;margin:-.05em 0 0 -2%;font-size:clamp(2.3rem,4.3vw,4.2rem);overflow:visible;fill:none;stroke:#fff;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:460;stroke-dashoffset:460;animation:hc-sign 1.3s 2.4s cubic-bezier(.6,0,.3,1) forwards;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
#hero .hc-wall.wait .hc-sig-line{animation-play-state:paused}
@keyframes hc-sign{to{stroke-dashoffset:0}}
@media(max-width:960px){
  #hero .hc-tag.hc-sig{right:auto;left:50%;bottom:.4rem;translate:-50% 0;padding:.6rem 1.6rem .9rem}
  #hero .hc-sig-t,#hero .hc-sig-line{font-size:clamp(2rem,9vw,2.8rem)}
}
@media(prefers-reduced-motion:reduce){#hero .hc-sig-line{animation:none;stroke-dashoffset:0}}
</style>
`;
h = h.replace(/<style id="hc-sig">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '</head>');
fs.writeFileSync(FILE, h);
console.log('home signature applied:', text);
