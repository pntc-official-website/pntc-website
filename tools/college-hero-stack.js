// College home page hero: the college cards become a fanned stack that deals the next card forward.
// Same idea as the Training Center photo stack, with a different motion: the cards fan out to the right from a
// pivot below the stack, and the card in front drops away downward.
// Rerunnable:  node tools/college-hero-stack.js
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'PNTC Colleges', 'index.html');
let h = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

const CSS = `<style id="hx-stack">
/* College hero: fanned card stack */
#hero.hx .hx-stage::before{display:none}
#hero.hx .hc-panel{transform-origin:50% 118%;opacity:0;visibility:hidden;z-index:1;transform:rotate(17deg) scale(.84);filter:brightness(.4);transition:transform .95s cubic-bezier(.2,.8,.2,1),opacity .55s ease,filter .7s ease,visibility 0s .95s;box-shadow:0 34px 60px -30px rgba(0,0,0,.85),0 0 0 4px rgba(255,255,255,.9)}
#hero.hx .hc-panel.on{opacity:1;visibility:visible;z-index:5;transform:none;filter:none;transition:transform .95s cubic-bezier(.2,.8,.2,1),opacity .55s ease,filter .7s ease,visibility 0s}
#hero.hx .hc-panel.s1{opacity:1;visibility:visible;z-index:4;transform:rotate(5.5deg) scale(.95);filter:brightness(.74);transition:transform .95s cubic-bezier(.2,.8,.2,1),opacity .55s ease,filter .7s ease,visibility 0s}
#hero.hx .hc-panel.s2{opacity:1;visibility:visible;z-index:3;transform:rotate(11deg) scale(.9);filter:brightness(.52);transition:transform .95s cubic-bezier(.2,.8,.2,1),opacity .55s ease,filter .7s ease,visibility 0s}
#hero.hx .hc-panel.out{opacity:0;visibility:visible;z-index:6;transform:translate(-9%,26%) rotate(-13deg) scale(.9);filter:none;transition:transform .7s cubic-bezier(.5,0,.85,.4),opacity .5s ease .15s,visibility 0s .7s}
#hero.hx .hc-panel.s1,#hero.hx .hc-panel.s2{cursor:pointer}
@media(max-width:980px){
  #hero.hx .hc-panel.s1{transform:rotate(3.5deg) scale(.96)}
  #hero.hx .hc-panel.s2{transform:rotate(7deg) scale(.92)}
}
@media(prefers-reduced-motion:reduce){#hero.hx .hc-panel,#hero.hx .hc-panel.on,#hero.hx .hc-panel.s1,#hero.hx .hc-panel.s2,#hero.hx .hc-panel.out{transition:none}}
</style>
`;
h = h.replace(/<style id="hx-stack">[\s\S]*?<\/style>\n/, '');
h = h.replace('</head>', CSS + '</head>');

// the slideshow script: every card gets its place in the stack
const OLD = /function show\(n\)\{[\s\S]*?\n    \}\n    function start\(\)/;
if (!OLD.test(h)) throw new Error('slideshow script not found');
h = h.replace(OLD, `function show(n){
      var prev=cur,len=cards.length;
      btns[cur].classList.remove('on');btns[cur].setAttribute('aria-selected','false');
      cur=(n+len)%len;
      btns[cur].classList.add('on');btns[cur].setAttribute('aria-selected','true');
      cards.forEach(function(c,k){var p=(k-cur+len)%len;c.classList.remove('on','s1','s2','out');
        if(p===0)c.classList.add('on');else if(k===prev&&prev!==cur)c.classList.add('out');else if(p===1)c.classList.add('s1');else if(p===2)c.classList.add('s2');});
    }
    function start()`);
if (!h.includes("cards.forEach(function(c,i){c.addEventListener('click'")) {
  h = h.replace("    start();\n  })();\n  </script>\n</section>", "    cards.forEach(function(c,i){c.addEventListener('click',function(){if(i!==cur){show(i);start();}});});\n    show(0);start();\n  })();\n  </script>\n</section>");
}
fs.writeFileSync(FILE, h);
console.log('college hero stack applied');
