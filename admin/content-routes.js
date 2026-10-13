// Admin API for Site Content (texts on the pages) and the College academic calendar.
// Values are read from and written to the pages in the GitHub repo, the same way posts are published.
// Every route needs a signed-in admin.
const CONTENT = require('./content');
const CALENDAR = require('./calendar');
const COURSES = require('./courses');

const COURSE_DATA = 'content/training-courses.json';

const CAL_DATA = 'content/college-calendar.json';
const CAL_PAGE = 'PNTC Colleges/calendar.html';

module.exports = function contentRoutes(app, { requireAuth, ghGetFile, ghPutFile }) {
  const text = f => Buffer.from(f.content, 'base64').toString('utf8');
  const group = id => CONTENT.GROUPS.find(g => g.id === id);
  const fail = (res, e) => { console.error('Site content error:', e); res.status(500).json({ error: e.message || 'Something went wrong' }); };

  // List of editable sections, for the menu
  app.get('/api/content/groups', requireAuth, (_req, res) => {
    res.json(CONTENT.GROUPS.map(g => ({ id: g.id, site: g.site, title: g.title, note: g.note || '', files: g.files })));
  });

  // Current values of one section, read from the live page
  app.get('/api/content/:group', requireAuth, async (req, res) => {
    const g = group(req.params.group);
    if (!g) return res.status(404).json({ error: 'Unknown section' });
    try {
      const file = await ghGetFile(g.files[0]);
      if (!file) return res.status(404).json({ error: 'Page not found in the repo: ' + g.files[0] });
      const values = CONTENT.readGroup(text(file), g);
      res.json({
        id: g.id, site: g.site, title: g.title, note: g.note || '', files: g.files,
        fields: g.fields.filter(f => Object.prototype.hasOwnProperty.call(values, f.key)).map(f => ({ key: f.key, label: f.label, type: f.type, long: !!f.long, hint: f.hint || '' })),
        values,
      });
    } catch (e) { fail(res, e); }
  });

  // Save one section to its page (or pages) and let the site redeploy
  app.post('/api/content/:group', requireAuth, async (req, res) => {
    const g = group(req.params.group);
    if (!g) return res.status(404).json({ error: 'Unknown section' });
    const values = (req.body && req.body.values) || {};
    for (const f of g.fields) {
      if (!Object.prototype.hasOwnProperty.call(values, f.key)) continue;
      const v = String(values[f.key] == null ? '' : values[f.key]);
      if (v.length > 4000) return res.status(400).json({ error: `"${f.label}" is too long.` });
      if (f.type === 'href' && v.trim() && !/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(v.trim())) return res.status(400).json({ error: `"${f.label}" should start with /, #, https://, mailto: or tel:.` });
      if (f.type === 'email' && v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return res.status(400).json({ error: `"${f.label}" does not look like an email address.` });
      if (f.type !== 'href' && f.type !== 'list' && !f.optional && !v.trim()) return res.status(400).json({ error: `"${f.label}" cannot be empty.` });
    }
    try {
      const changed = [];
      for (const path of g.files) {
        const file = await ghGetFile(path);
        if (!file) return res.status(404).json({ error: 'Page not found in the repo: ' + path });
        const before = text(file), after = CONTENT.writeGroup(before, g, values);
        if (after !== before) { await ghPutFile(path, after, `Update site content: ${g.title}`, file.sha); changed.push(path); }
      }
      res.json({ ok: true, changed });
    } catch (e) { fail(res, e); }
  });

  // Academic calendar
  app.get('/api/calendar', requireAuth, async (_req, res) => {
    try {
      const file = await ghGetFile(CAL_DATA);
      if (!file) return res.status(404).json({ error: 'Calendar data not found in the repo.' });
      res.json({ data: JSON.parse(text(file)), cats: Object.fromEntries(Object.entries(CALENDAR.CATS).map(([k, v]) => [k, v.label])) });
    } catch (e) { fail(res, e); }
  });

  app.post('/api/calendar', requireAuth, async (req, res) => {
    const b = req.body || {};
    const data = {
      year: String(b.year || '').trim(),
      overview: (Array.isArray(b.overview) ? b.overview : []).slice(0, 12).map(o => ({ title: String(o.title || '').trim(), dates: String(o.dates || '').trim(), note: String(o.note || '').trim() })).filter(o => o.title),
      events: (Array.isArray(b.events) ? b.events : []).slice(0, 1000).map(e => ({ month: String(e.month || '').trim(), dates: String(e.dates || '').replace(/\s+/g, ''), title: String(e.title || '').replace(/\s+/g, ' ').trim(), cat: String(e.cat || ''), major: !!e.major })),
    };
    const errs = CALENDAR.validate(data);
    if (errs.length) return res.status(400).json({ error: errs.slice(0, 6).join(' ') + (errs.length > 6 ? ` And ${errs.length - 6} more.` : '') });
    try {
      const page = await ghGetFile(CAL_PAGE);
      if (!page) return res.status(404).json({ error: 'Calendar page not found in the repo.' });
      const html = CALENDAR.apply(text(page), data);            // build first, so a bad build never saves the data
      const dataFile = await ghGetFile(CAL_DATA);
      await ghPutFile(CAL_DATA, JSON.stringify(data, null, 1) + '\n', 'Update academic calendar data', dataFile && dataFile.sha);
      await ghPutFile(CAL_PAGE, html, 'Update academic calendar page', page.sha);
      res.json({ ok: true, entries: data.events.length });
    } catch (e) { fail(res, e); }
  });

  // Training Center course list
  app.get('/api/training-courses', requireAuth, async (_req, res) => {
    try {
      const file = await ghGetFile(COURSE_DATA);
      if (!file) return res.status(404).json({ error: 'Course list not found in the repo.' });
      res.json({ data: JSON.parse(text(file)) });
    } catch (e) { fail(res, e); }
  });

  app.post('/api/training-courses', requireAuth, async (req, res) => {
    const b = req.body || {};
    const str = (v, max = 300) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
    const data = {
      asOf: str(b.asOf, 60), note: str(b.note, 400), inclusions: str(b.inclusions, 600),
      groups: (Array.isArray(b.groups) ? b.groups : []).slice(0, 12).map(g => ({
        id: str(g.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, ''), title: str(g.title, 120), short: str(g.short, 40), ...(g.page === 'assessment' ? { page: 'assessment' } : {}),
        sections: (Array.isArray(g.sections) ? g.sections : []).slice(0, 30).map(s => ({
          title: str(s.title, 120),
          courses: (Array.isArray(s.courses) ? s.courses : []).slice(0, 80).map(c => ({ code: str(c.code, 24), name: str(c.name, 220), days: str(c.days, 8) })).filter(c => c.code || c.name),
        })).filter(s => s.title && s.courses.length),
      })).filter(g => g.title && g.sections.length),
      requirements: (Array.isArray(b.requirements) ? b.requirements : []).slice(0, 8).map(q => ({ title: str(q.title, 120), ...(q.page === 'assessment' ? { page: 'assessment' } : {}), items: (Array.isArray(q.items) ? q.items : []).map(i => str(i, 300)).filter(Boolean).slice(0, 40) })).filter(q => q.title),
    };
    const errs = COURSES.validate(data);
    if (errs.length) return res.status(400).json({ error: errs.slice(0, 6).join(' ') + (errs.length > 6 ? ` And ${errs.length - 6} more.` : '') });
    try {
      const home = await ghGetFile(COURSES.HOME_PAGE), list = await ghGetFile(COURSES.LIST_PAGE), assess = await ghGetFile(COURSES.ASSESS_PAGE);
      if (!home || !list || !assess) return res.status(404).json({ error: 'Training Center pages not found in the repo.' });
      const homeHtml = COURSES.apply(text(home), data, 'home'), listHtml = COURSES.apply(text(list), data, 'list'), assessHtml = COURSES.apply(text(assess), data, 'assessment');   // build first, so a bad build never saves the data
      const dataFile = await ghGetFile(COURSE_DATA);
      await ghPutFile(COURSE_DATA, JSON.stringify(data, null, 1) + '\n', 'Update Training Center course list', dataFile && dataFile.sha);
      await ghPutFile(COURSES.LIST_PAGE, listHtml, 'Update Training Center courses page', list.sha);
      if (assessHtml !== text(assess)) await ghPutFile(COURSES.ASSESS_PAGE, assessHtml, 'Update Training Center assessment page', assess.sha);
      await ghPutFile(COURSES.HOME_PAGE, homeHtml, 'Update Training Center home course cards', home.sha);
      res.json({ ok: true, courses: data.groups.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.courses.length, 0), 0) });
    } catch (e) { fail(res, e); }
  });
};
