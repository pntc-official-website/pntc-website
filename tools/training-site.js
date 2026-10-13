// Training Center: modern look for the sections below the hero, on the home page and the courses page.
// Puts tools/training-site.css into each page and fixes two class names that were typed with curly quotes.
// No wording is changed. Rerunnable:  node tools/training-site.js
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'PNTC Maritime Training and Assessment Center');
const CSS = fs.readFileSync(path.join(__dirname, 'training-site.css'), 'utf8').replace(/\r\n/g, '\n').trim();

const SCRIPT = `<script id="tc-modern-js">
/* numbers count up when the band comes into view */
document.addEventListener('DOMContentLoaded',function(){
  var band=document.getElementById('stats');if(!band||!('IntersectionObserver' in window))return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var items=[].slice.call(band.querySelectorAll('.stat-n')).map(function(el){var m=/^([\\d,]+)(.*)$/.exec(el.textContent.trim());return m?{el:el,to:parseInt(m[1].replace(/,/g,''),10),tail:m[2],comma:m[1].indexOf(',')>-1}:null;}).filter(Boolean);
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.disconnect();var t0=performance.now();
    (function tick(now){var p=Math.min(1,(now-t0)/1400),k=1-Math.pow(1-p,3);items.forEach(function(i){var v=Math.round(i.to*k);i.el.textContent=(i.comma?v.toLocaleString('en-US'):v)+i.tail;});if(p<1)requestAnimationFrame(tick);})(t0);});},{threshold:.4});
  io.observe(band);
});
</script>`;

for (const name of ['index.html', 'maritime-courses.html', 'assessment.html']) {
  const file = path.join(DIR, name);
  let h = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  h = h.replace(/class=”([\w-]+)”/g, 'class="$1"');
  h = h.replace(/<style id="tc-modern">[\s\S]*?<\/style>\n(?:<script id="tc-modern-js">[\s\S]*?<\/script>\n)?/, '');
  const block = `<style id="tc-modern">\n${CSS}\n</style>\n${name === 'index.html' ? SCRIPT + '\n' : ''}`;
  // keep it ahead of the hero block so the hero styles still win
  const anchor = ['<style id="tc-courses">', '<style id="th-action">', '</head>'].find(a => h.includes(a));
  h = h.replace(anchor, block + anchor);
  fs.writeFileSync(file, h);
  console.log('updated', name);
}
