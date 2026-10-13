// Training Center course list: turns content/training-courses.json into the catalogue on the courses page
// and the category cards on the Training Center home page.
// Shared by the admin console (Site Content > Training Center course list) and tools/training-courses.js.
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const START = '<!-- TC_COURSES_START -->', END = '<!-- TC_COURSES_END -->';
const HOME_PAGE = 'PNTC Maritime Training and Assessment Center/index.html';
const LIST_PAGE = 'PNTC Maritime Training and Assessment Center/maritime-courses.html';
const ASSESS_PAGE = 'PNTC Maritime Training and Assessment Center/assessment.html';
// Groups and requirement boxes marked page: 'assessment' are shown on the Assessment page, the rest on the courses page.
const onAssess = x => x.page === 'assessment';

const count = g => g.sections.reduce((n, s) => n + s.courses.length, 0);
const dayText = d => { const n = String(d || '').trim(); return n ? `<b>${esc(n)}</b> ${n === '1' ? 'day' : 'days'}` : ''; };
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Checks the data and returns a list of problems in plain words (empty when it is fine).
function validate(data) {
  const errs = [];
  if (!data || !Array.isArray(data.groups) || !data.groups.length) return ['The course list needs at least one group.'];
  const seen = new Set();
  data.groups.forEach(g => {
    if (!String(g.title || '').trim()) errs.push('A group has no title.');
    if (!Array.isArray(g.sections) || !g.sections.length) return errs.push(`"${g.title}" has no sections.`);
    g.sections.forEach(s => {
      if (!String(s.title || '').trim()) errs.push(`A section in "${g.title}" has no title.`);
      (s.courses || []).forEach(c => {
        if (!String(c.code || '').trim() || !String(c.name || '').trim()) errs.push(`A course in "${s.title}" is missing its code or name.`);
        if (c.days && !/^\d+(\.\d+)?$/.test(String(c.days).trim())) errs.push(`"${c.code}" has days that are not a number.`);
        const k = String(c.code || '').trim().toUpperCase();
        if (k && seen.has(k)) errs.push(`The code "${c.code}" is used more than once.`);
        seen.add(k);
      });
    });
  });
  return errs;
}

const row = c => `<li class="cc-row"><span class="cc-code">${esc(c.code)}</span><span class="cc-name">${esc(c.name)}</span>${c.days ? `<span class="cc-days">${dayText(c.days)}</span>` : ''}</li>`;

const groupHtml = g => `<section class="cc-group" id="cat-${esc(g.id || slug(g.title))}" data-g="${esc(g.id || slug(g.title))}">
      <h3 class="cc-gh"><span>${esc(g.title)}</span><b>${count(g)} ${count(g) === 1 ? (onAssess(g) ? 'assessment' : 'course') : (onAssess(g) ? 'assessments' : 'courses')}</b></h3>
      <div class="cc-secs">
      ${g.sections.map(s => `<div class="cc-sec"><h4>${esc(s.title)}</h4><ul class="cc-list">${s.courses.map(row).join('')}</ul></div>`).join('\n      ')}
      </div>
    </section>`;
const reqHtml = list => list.filter(r => r.items && r.items.length).map(r => `<div class="cc-reqcard"><h4>${esc(r.title)}</h4><ul>${r.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('');

// Practical assessments for the Assessment page
function buildAssessment(full) {
  const groups = full.groups.filter(onAssess), reqs = reqHtml((full.requirements || []).filter(onAssess));
  return `<div class="cc cc-plain" id="catalogue">
    ${full.asOf || full.note ? `<p class="cc-meta">${full.asOf ? `<b>As of ${esc(full.asOf)}</b>` : ''}${full.note ? `<span>${esc(full.note)}</span>` : ''}</p>` : ''}
    ${groups.map(groupHtml).join('\n    ')}
    ${reqs ? `<div class="cc-req" id="requirements"><h3 class="cc-gh"><span>Requirements</span></h3><div class="cc-reqgrid">${reqs}</div></div>` : ''}
  </div>`;
}

// Full catalogue for the courses page
function buildCatalogue(full) {
  const data = Object.assign({}, full, { groups: full.groups.filter(g => !onAssess(g)), requirements: (full.requirements || []).filter(r => !onAssess(r)) });
  const total = data.groups.reduce((n, g) => n + count(g), 0);
  const groups = data.groups.map(g => `<section class="cc-group" id="cat-${esc(g.id || slug(g.title))}" data-g="${esc(g.id || slug(g.title))}">
      <h3 class="cc-gh"><span>${esc(g.title)}</span><b>${count(g)} ${count(g) === 1 ? 'course' : 'courses'}</b></h3>
      <div class="cc-secs">
      ${g.sections.map(s => `<div class="cc-sec"><h4>${esc(s.title)}</h4><ul class="cc-list">${s.courses.map(row).join('')}</ul></div>`).join('\n      ')}
      </div>
    </section>`).join('\n    ');
  const reqs = (data.requirements || []).filter(r => r.items && r.items.length).map(r => `<div class="cc-reqcard"><h4>${esc(r.title)}</h4><ul>${r.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('');
  return `<div class="cc" id="catalogue">
    <div class="cc-tools">
      <label class="cc-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input type="search" id="cc-q" placeholder="Search by course name or code" aria-label="Search courses"></label>
      <div class="cc-chips" id="cc-chips" role="group" aria-label="Filter by course group"><button type="button" class="cc-chip on" data-g="all">All</button>${data.groups.map(g => `<button type="button" class="cc-chip" data-g="${esc(g.id || slug(g.title))}">${esc(g.short || g.title)}</button>`).join('')}</div>
      <p class="cc-count" id="cc-count" aria-live="polite">${total} courses</p>
    </div>
    ${data.asOf || data.note ? `<p class="cc-meta">${data.asOf ? `<b>As of ${esc(data.asOf)}</b>` : ''}${data.note ? `<span>${esc(data.note)}</span>` : ''}</p>` : ''}
    ${groups}
    <p class="cc-none" id="cc-none" hidden>No course matches your search.</p>
    ${reqs ? `<div class="cc-req" id="requirements"><h3 class="cc-gh"><span>Requirements</span></h3><div class="cc-reqgrid">${reqs}</div>${data.inclusions ? `<p class="cc-incl">${esc(data.inclusions)}</p>` : ''}</div>` : ''}
  </div>`;
}

// Category cards for the home page
function buildHome(data) {
  return `<div class="ch-grid">
    ${data.groups.map(g => { const id = esc(g.id || slug(g.title)); return `<a class="ch-card reveal" href="${onAssess(g) ? '/training/assessment' : '/training/maritime-courses'}#cat-${id}">
      <span class="ch-n">${count(g)}</span>
      <span class="ch-lbl">${onAssess(g) ? (count(g) === 1 ? 'assessment' : 'assessments') : (count(g) === 1 ? 'course' : 'courses')}</span>
      <h3>${esc(g.title)}</h3>
      <ul>${g.sections.map(s => `<li>${esc(s.title)}</li>`).join('')}</ul>
      <span class="ch-go">See the list <span aria-hidden="true">&rarr;</span></span>
    </a>`; }).join('\n    ')}
  </div>`;
}

// Puts the built block into a page. kind is 'home', 'list' or 'assessment'.
function apply(html, data, kind) {
  const block = `${START}\n  ${kind === 'home' ? buildHome(data) : kind === 'assessment' ? buildAssessment(data) : buildCatalogue(data)}\n  ${END}`;
  const s = html.indexOf(START), e = html.indexOf(END);
  if (s > -1 && e > s) return html.slice(0, s) + block + html.slice(e + END.length);
  if (kind === 'assessment') throw new Error('The Assessment page has no place for the list yet. Run tools/training-courses.js once.');
  // first time: replace the old grid of course cards
  const a = html.indexOf('<div class="courses-grid">');
  const stops = ['<div style="text-align:center;margin-top:2.5rem">', '<div class="courses-cta'].map(x => html.indexOf(x, a)).filter(i => i > a);
  if (a < 0 || !stops.length) throw new Error('Could not find the course cards on the page.');
  return html.slice(0, a) + block + '\n  ' + html.slice(Math.min(...stops));
}

module.exports = { validate, buildCatalogue, buildAssessment, buildHome, apply, HOME_PAGE, LIST_PAGE, ASSESS_PAGE, START, END };
