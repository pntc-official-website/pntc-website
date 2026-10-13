// Training Center: course catalogue (courses page), category cards (home page) and the fiery contact band.
// The course list is content/training-courses.json. The admin console rebuilds the same blocks when the list is saved
// there (Site Content > Training Center course list), through admin/courses.js.
// Rerunnable:  node tools/training-courses.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const COURSES = require('../admin/courses.js');
const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'training-courses.json'), 'utf8'));
const errs = COURSES.validate(data);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const CSS = fs.readFileSync(path.join(__dirname, 'training-courses.css'), 'utf8').replace(/\r\n/g, '\n').trim();
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;
const NAME = `<em>${slot('training.cta.mark', 'PNTC Maritime')}</em>`;
const REST = slot('training.cta.rest', 'Training and Assessment Center');

const SCRIPT = `<script id="tc-courses-js">
document.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('catalogue');if(!box)return;
  var q=document.getElementById('cc-q'),chips=[].slice.call(document.querySelectorAll('.cc-chip')),count=document.getElementById('cc-count'),none=document.getElementById('cc-none'),req=document.getElementById('requirements'),g='all';
  /* the search bar sticks just under the two navigation bars */
  function top(){var m=0;document.querySelectorAll('nav,header').forEach(function(e){var p=getComputedStyle(e).position;if(p==='fixed'||p==='sticky'){var r=e.getBoundingClientRect();if(r.top<200&&r.height<200)m=Math.max(m,r.bottom);}});if(m>0)box.style.setProperty('--cc-top',Math.round(m+10)+'px');}
  function run(){
    var s=(q.value||'').toLowerCase().trim(),n=0;
    box.querySelectorAll('.cc-group').forEach(function(gr){
      var on=g==='all'||gr.getAttribute('data-g')===g,gn=0;
      gr.querySelectorAll('.cc-sec').forEach(function(sec){var sn=0;
        sec.querySelectorAll('.cc-row').forEach(function(r){var ok=on&&(!s||r.textContent.toLowerCase().indexOf(s)>-1);r.hidden=!ok;if(ok)sn++;});
        sec.hidden=!sn;gn+=sn;});
      gr.hidden=!gn;n+=gn;});
    count.textContent=n+(n===1?' course':' courses');
    none.hidden=n>0;
    if(req)req.hidden=!!s||g!=='all';
  }
  chips.forEach(function(b){b.addEventListener('click',function(){g=b.getAttribute('data-g');chips.forEach(function(x){x.classList.toggle('on',x===b);});run();});});
  q.addEventListener('input',run);
  top();window.addEventListener('resize',top);window.addEventListener('load',top);run();
});
</script>`;

function inject(h, withScript) {
  h = h.replace(/<style id="tc-courses">[\s\S]*?<\/style>\n(?:<script id="tc-courses-js">[\s\S]*?<\/script>\n)?/, '');
  const block = `<style id="tc-courses">\n${CSS}\n</style>\n${withScript ? SCRIPT + '\n' : ''}`;
  return h.includes('<style id="th-action">') ? h.replace('<style id="th-action">', block + '<style id="th-action">') : h.replace('</head>', block + '</head>');
}

// home page
{
  const file = path.join(ROOT, COURSES.HOME_PAGE);
  const before = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  let h = COURSES.apply(before, data, 'home');
  h = h.replace('<h2><em>Contact</em> Our Team</h2>', `<h2>${NAME} ${REST}</h2>`);
  h = inject(h, false);
  h = C.preserveSlots(before, h);
  fs.writeFileSync(file, h);
}
// courses page
{
  const file = path.join(ROOT, COURSES.LIST_PAGE);
  const before = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  let h = COURSES.apply(before, data, 'list');
  h = h.replace(/<h2 class="enroll-h2 reveal">\s*Enroll<br>in <em>PNTC<\/em><br>Maritime\s*<\/h2>/, `<h2 class="enroll-h2 reveal">Enroll at<br>${NAME}<br>${REST}</h2>`);
  h = inject(h, true);
  h = C.preserveSlots(before, h);
  fs.writeFileSync(file, h);
}
const total = data.groups.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.courses.length, 0), 0);
console.log('training courses built:', total, 'courses in', data.groups.length, 'groups');
