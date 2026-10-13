// College home page hero: a calmer left side. Removes the doodles, the dot grid and the outlined "PNTC",
// straightens the highlighted word, keeps the signature underline and lines the buttons and proof up in one row.
// Rerunnable:  node tools/college-hero-clean.js
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'PNTC Colleges', 'index.html');
let h = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const CSS = `<style id="hx-clean">
/* College hero: calmer copy side */
#hero.hx .hx-copy .hx-doodle,#hero.hx .hx-ghost,#hero.hx .hx-copy::before{display:none!important}
#hero.hx .hx-copy::after{right:auto;left:-12%;top:auto;bottom:-30%;width:70%;background:radial-gradient(closest-side,rgba(243,207,51,.2),transparent);animation:none}
#hero.hx .hx-pill{margin-bottom:1.6rem;background:#fff;border-color:rgba(28,22,80,.16);box-shadow:0 10px 22px -16px rgba(28,22,80,.5)}
#hero.hx .hx-h1{line-height:1.02;margin-bottom:1.5rem}
#hero.hx .hx-h1 em{transform:none;border-radius:.16em;padding:0 .18em .04em;margin-right:.1em}
#hero.hx .hx-sub{max-width:33rem;margin-bottom:2rem}
#hero.hx .hx-btns{gap:.8rem;margin-bottom:0}
#hero.hx .hx-btn-main,#hero.hx .hx-btn-ghost{border-radius:999px;padding:1rem 1.9rem;min-height:3.4rem;box-sizing:border-box}
#hero.hx .hx-btn-ghost{border:1.5px solid rgba(28,22,80,.3);background:#fff;gap:.6rem;transition:border-color .25s,background .25s,color .25s}
#hero.hx .hx-btn-ghost:hover{border-color:#1C1650;background:#1C1650;color:#fff}
#hero.hx .hx-play{order:2;width:auto;height:auto;background:none;box-shadow:none;display:inline-flex}
#hero.hx .hx-play svg{stroke:currentColor}
#hero.hx .hx-proof{margin-top:2rem;padding-top:1.4rem;border-top:1px solid rgba(28,22,80,.12);max-width:33rem}
#hero.hx .hx-proof p{border-left:0;padding-left:0;gap:.6rem}
#hero.hx .hx-proof strong{font-size:2rem;color:#1C1650;background:linear-gradient(transparent 62%,#F3CF33 62%,#F3CF33 94%,transparent 94%);padding:0 .1em}
</style>
`;
h = h.replace(/<style id="hx-clean">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '</head>');
fs.writeFileSync(FILE, h);
console.log('college hero cleaned');
