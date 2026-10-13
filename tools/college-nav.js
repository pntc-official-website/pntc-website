// College sub nav: one place to set the order of the links and what sits under "More".
// Rewrites the desktop nav and the mobile menu on every College page, keeping the current-page highlight.
// Rerunnable:  node tools/college-nav.js
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'PNTC Colleges');

const TOP = [['Programs', 'programs'], ['Admissions', 'admissions'], ['Colleges', 'colleges'], ['Scholarships', 'scholarships'], ['Student Life', 'student-life'], ['Calendar', 'calendar'], ['Directory', 'directory']];
const MORE = [['Research', 'research'], ['Resources', 'resources'], ['Merchandise', 'merchandise']];

const cur = ' class="is-current" aria-current="page"';
for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.html'))) {
  const full = path.join(DIR, file);
  let h = fs.readFileSync(full, 'utf8');
  if (!h.includes('<nav class="hdr-nav">')) { console.log('skip', file); continue; }
  const page = file.replace('.html', '');
  const inMore = MORE.some(([, s]) => s === page);

  const nav = `<nav class="hdr-nav">
${TOP.map(([l, s]) => `    <a href="/college/${s}"${s === page ? cur : ''}>${l}</a>`).join('\n')}
    <div class="hdr-dd"><button type="button" class="hdr-dd-btn${inMore ? ' is-current' : ''}" aria-haspopup="true" aria-expanded="false" onclick="var d=this.parentElement;d.classList.toggle('open');this.setAttribute('aria-expanded',d.classList.contains('open'))">More<svg viewBox="0 0 10 6" aria-hidden="true"><polyline points="1 1 5 5 9 1"/></svg></button><div class="hdr-dd-menu">${MORE.map(([l, s]) => `<a href="/college/${s}"${s === page ? cur : ''}>${l}</a>`).join('')}</div></div>
  </nav>`;
  const a = h.indexOf('<nav class="hdr-nav">'), b = h.indexOf('</nav>', a) + '</nav>'.length;
  h = h.slice(0, a) + nav + h.slice(b);

  // mobile menu: same order, all links listed
  const re = /([ \t]*<a href="\/college\/[a-z-]+" class="mm[^"]*"[^>]*>[^<]*<\/a>\s*)+/;
  const m = re.exec(h);
  if (!m) throw new Error('mobile menu not found in ' + file);
  const mm = [...TOP, ...MORE].map(([l, s], i) => `${i ? '    ' : '  '}<a href="/college/${s}" class="mm${s === page ? ' is-current" aria-current="page' : ''}">${l}</a>`).join('\n') + '\n';
  h = h.slice(0, m.index) + mm + h.slice(m.index + m[0].length);
  fs.writeFileSync(full, h);
  console.log('nav set', file);
}
