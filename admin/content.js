// Site Content: the texts on the pages that the admin console can edit.
//
// How it works. Each editable text in a page sits between two comment markers:
//     <!--c:college.hero.sub-->PNTC Colleges Dasmariñas trains ...<!--/c-->
// Links carry a data-c attribute on the tag instead (data-c="college.hero.btn1.href").
// The admin reads the current values straight from the live page, and saving writes them back.
// The pages are the single source of truth, so there is no separate database to keep in sync.
//
// This module is shared by the admin server and by the scripts in /tools, which use
// preserveSlots() so rebuilding a section never throws away something edited in the admin.

const escHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slotRe = key => new RegExp('<!--c:' + reEsc(key) + '-->([\\s\\S]*?)<!--/c-->');
const tagRe = key => new RegExp('<[a-zA-Z][^>]*\\sdata-c="' + reEsc(key) + '"[^>]*>');

function getSlot(html, key) { const m = slotRe(key).exec(html); return m ? m[1] : null; }
function setSlot(html, key, inner) { return html.replace(new RegExp(slotRe(key).source, 'g'), () => `<!--c:${key}-->${inner}<!--/c-->`); }
function getAttr(html, key, attr = 'href') { const t = tagRe(key).exec(html); if (!t) return null; const m = new RegExp('\\s' + attr + '="([^"]*)"').exec(t[0]); return m ? decode(m[1]) : ''; }
function setAttr(html, key, value, attr = 'href') {
  return html.replace(tagRe(key), tag => new RegExp('\\s' + attr + '="[^"]*"').test(tag)
    ? tag.replace(new RegExp('(\\s' + attr + '=")[^"]*(")'), (_, a, b) => a + escHtml(value) + b)
    : tag.replace(/>$/, ` ${attr}="${escHtml(value)}">`));
}

// ── field types ──
// text   one line or a paragraph of plain text
// list   one item per line; "tpl" is the HTML around each item, with {} where the text goes
// href   a link address, stored on the tag that carries data-c
// email  an address shown as text, which also sets the mailto: link on its tag
function readField(html, f) {
  if (f.type === 'href') return getAttr(html, f.key);
  const inner = getSlot(html, f.key);
  if (inner === null) return null;                       // not on this page
  if (f.type === 'list') return (inner.match(/<li[\s\S]*?<\/li>/g) || []).map(decode).join('\n');
  return decode(inner);
}
function writeField(html, f, value) {
  if (value == null) return html;
  if (f.type === 'href') return tagRe(f.key).test(html) ? setAttr(html, f.key, String(value).trim()) : html;
  if (getSlot(html, f.key) === null) return html;
  if (f.type === 'list') {
    const items = String(value).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    return setSlot(html, f.key, items.map(x => (f.tpl || '<li>{}</li>').replace('{}', () => escHtml(x))).join(''));
  }
  const v = String(value).replace(/\s+/g, ' ').trim();
  // a middle dot between words keeps its non-breaking spaces, so tags like 'Est. 1994 · Tanza' never split around the dot
  html = setSlot(html, f.key, (f.pre || '') + escHtml(v).replace(/ · /g, ' &nbsp;·&nbsp; ') + (f.post || ''));
  if (f.type === 'email' && tagRe(f.key).test(html)) html = setAttr(html, f.key, 'mailto:' + v);
  return html;
}

function readGroup(html, group) { const out = {}; for (const f of group.fields) { const v = readField(html, f); if (v !== null) out[f.key] = v; } return out; }
function writeGroup(html, group, values) { for (const f of group.fields) if (Object.prototype.hasOwnProperty.call(values, f.key)) html = writeField(html, f, values[f.key]); return html; }

// Copy every slot value and data-c link from an older version of a page into a freshly built one.
function preserveSlots(oldHtml, newHtml) {
  newHtml = newHtml.replace(/<!--c:([\w.\-]+)-->[\s\S]*?<!--\/c-->/g, (m, key) => { const old = getSlot(oldHtml, key); return old === null ? m : `<!--c:${key}-->${old}<!--/c-->`; });
  return newHtml.replace(/<[a-zA-Z][^>]*\sdata-c="([\w.\-]+)"[^>]*>/g, (tag, key) => { const old = getAttr(oldHtml, key); return old === null || old === '' ? tag : setAttr(tag, key, old); });
}

// ── what can be edited ──
const T = (key, label, extra) => Object.assign({ key, label, type: 'text' }, extra);
const P = (key, label, extra) => Object.assign({ key, label, type: 'text', long: true }, extra);
const L = (key, label, tpl, extra) => Object.assign({ key, label, type: 'list', tpl }, extra);
const H = (key, label) => ({ key, label, type: 'href', hint: 'A page address such as /college/admissions, or a full https link.' });
const CHECK = '<li><span class="pd-check"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="5 12.5 10 17 19 7"/></svg></span><span>{}</span></li>';

const PROGRAMS = [['bsmt', 'BS Marine Transportation'], ['bsmare', 'BS Marine Engineering'], ['bstm', 'BS Tourism Management'], ['bscrim', 'BS Criminology'], ['bscusad', 'BS Customs Administration'], ['bsoa', 'BS Office Administration']];
const VALUES = 6, STEPS = 11;
const STRANDS = [['adsc', 'ADSC', 'academic'], ['adt', 'ADT', 'academic'], ['admare', 'ADMarE', 'academic'], ['admt', 'ADMT', 'academic'], ['aesh', 'AESH', 'academic'], ['astem', 'ASTEM', 'academic'], ['aup', 'AUP', 'academic'], ['tpdm', 'TPDM', 'techpro'], ['tpm', 'TPM', 'techpro']];

const stepFields = n => [
  T(`college.adm.step${n}.short`, `Step ${n}: short name in the overview`),
  T(`college.adm.step${n}.office`, `Step ${n}: office`),
  L(`college.adm.step${n}.tasks`, `Step ${n}: what to do (one per line)`, '<li>{}</li>'),
  T(`college.adm.step${n}.note`, `Step ${n}: note`),
  { key: `college.adm.step${n}.email`, label: `Step ${n}: office email`, type: 'email' },
  T(`college.adm.step${n}.follow`, `Step ${n}: Facebook page to follow`),
];
const strandFields = ([id, code]) => [
  T(`shs.strand.${id}.name`, `${code}: full name`),
  P(`shs.strand.${id}.desc`, `${code}: description`),
  L(`shs.strand.${id}.focus`, `${code}: what you focus on (one per line)`, '<li>{}</li>'),
  L(`shs.strand.${id}.leads`, `${code}: where it leads (one per line)`, '<li>{}</li>'),
];

// ── Leadership page (About > Leadership). Used here for the admin fields and by tools/leadership-page.js for the page.
const LEADERS = [
  { id: 'chairman', role: 'Chairman of the Board', name: 'Atty. Hernani N. Fabia' },
  { id: 'president', role: 'President', name: 'Atty. Francis Lu Fabia' },
  { id: 'vp-admin', role: 'Vice President for Administration', name: 'Atty. Krisha Fabia-Quiazon' },
  { id: 'vp-acad', role: 'Vice President for Academic Affairs', name: 'Dr. Nerissa Flores' },
  { id: 'vp-training', role: 'Vice President for Training', name: 'Jane Romero' },
  { id: 'dean-maritime', role: 'Dean of the College of Maritime Education', name: 'C/E Jeynard Mowler Tan', accent: '#1244B8' },
  { id: 'head-bsmt', role: 'Head, College of Marine Transportation', name: 'C/M Patrick Del Rosario', accent: '#1244B8' },
  { id: 'head-bsmare', role: 'Head, College of Marine Engineering', name: '3/E Jercie Dizon', accent: '#1244B8' },
  { id: 'head-obt', role: 'Head, On Board Training Department', name: 'C/M Adrian Bawag', accent: '#1244B8' },
  { id: 'dean-business', role: 'Dean of the College of Business and Management', name: 'Dr. Zarny Zaragoza', accent: '#3d2f9e' },
  { id: 'dean-crim', role: 'Dean of the College of Criminal Justice', name: 'Dr. Rudy Gahar', accent: '#8a1818' },
  { id: 'principal-shs', role: 'Principal, Senior High School', name: 'Camille Rementilla', accent: '#181D71' },
  { id: 'dean-osa', role: 'Dean of Student Affairs', name: 'Dr. Celso Servas' },
  { id: 'head-gened', role: 'Head of General Education', name: 'Engr. Pamela Bautista' },
  { id: 'head-research', role: 'Head, Research and Development', name: 'Dr. Diana Rose Manaligod' },
  { id: 'head-registrar', role: 'Head, Registrar', name: 'Rachel Vicedo', unit: 'Colleges' },
  { id: 'head-quality', role: 'Head, Quality Assurance', name: 'Raquel Kaye Gannaban', unit: 'PNTC Colleges and Maritime Training Center' },
  { id: 'mgr-college', role: 'Manager, Marketing, Admission and Aid Department', name: 'Jayson Samson', unit: 'College' },
  { id: 'sup-marketing', role: 'Supervisor, Marketing', name: 'Emil Fugoso' },
  { id: 'mgr-mtc', role: 'Manager, Marketing, Admission and Aid Department', name: 'Mariness Uy-Oco', unit: 'Maritime Training Center' },
  { id: 'sup-finance', role: 'Supervisor, Finance', name: 'Genilyn Dela Cruz', unit: 'Colleges' },
  { id: 'sup-hrdm', role: 'Supervisor, HRDM', name: 'Tracy Lord Rodriguez', unit: 'Colleges' },
];

const GROUPS = [
  { id: 'main-hero', site: 'Main Site', title: 'Home page hero', files: ['PNTC Main Landing Page/index.html'], fields: [
    T('main.hero.pill', 'Small tag above the headline'),
    T('main.hero.line1', 'Headline, line 1'), T('main.hero.line2', 'Headline, line 2 (gold)'), T('main.hero.line3', 'Headline, line 3'),
    P('main.hero.sub', 'Description'),
    T('main.hero.btn1', 'First button, text'), H('main.hero.btn1.href', 'First button, link'),
    T('main.hero.btn2', 'Second button, text'), H('main.hero.btn2.href', 'Second button, link'),
    T('main.hero.wall', 'Caption on the photo wall'),
  ] },
  { id: 'main-cta', site: 'Main Site', title: 'Home page yellow call to action', files: ['PNTC Main Landing Page/index.html'], fields: [
    T('main.cta.eyebrow', 'Small label'), T('main.cta.line1', 'Heading, line 1'), T('main.cta.line2', 'Heading, line 2'),
    P('main.cta.sub', 'Description'),
    T('main.cta.btn1', 'Button 1, text'), H('main.cta.btn1.href', 'Button 1, link'),
    T('main.cta.btn2', 'Button 2, text'), H('main.cta.btn2.href', 'Button 2, link'),
    T('main.cta.btn3', 'Button 3, text'), H('main.cta.btn3.href', 'Button 3, link'),
  ] },
  { id: 'main-about', site: 'Main Site', title: 'About page: who we are, vision and mission', files: ['PNTC Main Landing Page/about.html'], fields: [
    T('about.who.eyebrow', 'Small label'),
    T('about.who.mark', 'Heading, underlined words'), T('about.who.rest', 'Heading, rest of the line'),
    P('about.who.p1', 'First paragraph'), P('about.who.p2', 'Second paragraph'),
    ...[1, 2, 3, 4].flatMap(n => [T(`about.stat${n}.n`, `Number box ${n}: big text`), T(`about.stat${n}.l`, `Number box ${n}: label`)]),
    P('about.vision', 'Vision statement'), P('about.mission', 'Mission statement'),
    P('about.values.intro', 'Core Values introduction'),
  ] },
  { id: 'main-history', site: 'Main Site', title: 'History page: timeline', files: ['PNTC Main Landing Page/about-history.html'], fields: [
    T('history.eyebrow', 'Small label'),
    T('history.mark', 'Heading, underlined word'), T('history.rest', 'Heading, rest of the line'),
    ...[1, 2, 3, 4, 5].flatMap(n => [
      T(`history.e${n}.year`, `Chapter ${n}: year`), T(`history.e${n}.title`, `Chapter ${n}: title`), P(`history.e${n}.desc`, `Chapter ${n}: description`),
      L(`history.e${n}.tags`, `Chapter ${n}: small tags (one per line, may be empty)`, '<li>{}</li>'),
    ]),
  ] },
  { id: 'main-leaders', site: 'Main Site', title: 'Leadership page: leaders', files: ['PNTC Main Landing Page/about-leadership.html'], fields: [
    T('lead.eyebrow', 'Small label'), T('lead.mark', 'Heading, underlined words'), T('lead.rest', 'Heading, rest of the line'),
    T('lead.tree1', 'Switch button 1 (Colleges)'), T('lead.tree2', 'Switch button 2 (Training Center)'),
    T('lead.acad', 'Heading of the academics cards'), T('lead.admin', 'Heading of the administration cards'),
   
    ...LEADERS.flatMap(p => [
      T(`lead.${p.id}.name`, `${p.role}${p.unit ? ' (' + p.unit + ')' : ''}: name`), T(`lead.${p.id}.role`, `${p.role}${p.unit ? ' (' + p.unit + ')' : ''}: title`),
      ...(p.unit ? [T(`lead.${p.id}.unit`, `${p.role} (${p.unit}): unit tag`)] : []),
    ]),
  ] },
  { id: 'main-careers', site: 'Main Site', title: 'Careers page: heading and apply band', note: 'Job openings are managed in Landing Content, under Careers.', files: ['PNTC Main Landing Page/careers.html'], fields: [
    T('careers.eyebrow', 'Small label'), T('careers.mark', 'Heading, underlined word'), T('careers.rest', 'Heading, rest of the line'),
    T('careers.empty', 'Message when no opening matches a search'),
    T('careers.cta.tag', 'Yellow band, small label'), T('careers.cta.title', 'Yellow band, heading'),
    { key: 'careers.email', label: 'HR email (also used by every Apply button)', type: 'email' },
  ] },
  { id: 'college-hero', site: 'Colleges', title: 'College hero', files: ['PNTC Colleges/index.html'], fields: [
    T('college.hero.pill', 'Small tag above the headline'),
    T('college.hero.mark', 'Headline, highlighted word'), T('college.hero.line1', 'Headline, rest of line 1'), T('college.hero.line2', 'Headline, line 2'),
    P('college.hero.sub', 'Description'), T('college.hero.bold', 'Bold ending of the description'),
    T('college.hero.btn1', 'First button, text'), H('college.hero.btn1.href', 'First button, link'),
    T('college.hero.btn2', 'Second button, text'), H('college.hero.btn2.href', 'Second button, link'),
    T('college.hero.proofn', 'Proof line, number'), T('college.hero.proof', 'Proof line, text'),
  ] },
  { id: 'college-values', site: 'Colleges', title: 'What We Stand For', files: ['PNTC Colleges/index.html'],
    fields: Array.from({ length: VALUES }, (_, i) => [T(`college.value${i + 1}.name`, `Value ${i + 1}: name`), P(`college.value${i + 1}.desc`, `Value ${i + 1}: description`)]).flat() },
  ...PROGRAMS.map(([id, name]) => ({ id: 'college-program-' + id, site: 'Colleges', title: 'Program details: ' + name, files: ['PNTC Colleges/programs.html'], fields: [
    T(`college.prog.${id}.college`, 'College'), T(`college.prog.${id}.name`, 'Program name'), P(`college.prog.${id}.tagline`, 'Tagline'),
    L(`college.prog.${id}.points`, 'Selling points (one per line)', CHECK),
    L(`college.prog.${id}.careers`, 'Career paths (one per line)', '<li>{}</li>'),
    P(`college.prog.${id}.now`, 'Why Now'),
    T(`college.prog.${id}.cta`, 'Button text'), H(`college.prog.${id}.cta.href`, 'Button link'),
  ] })),
  { id: 'college-admissions-intro', site: 'Colleges', title: 'Admissions: heading and phases', files: ['PNTC Colleges/admissions.html'], fields: [
    T('college.adm.eyebrow', 'Small label'), T('college.adm.h1', 'Heading, first part'), T('college.adm.h2', 'Heading, highlighted part'),
    T('college.adm.phase1', 'Phase 1 title'), T('college.adm.phase2', 'Phase 2 title'), T('college.adm.finish', 'Closing line'),
  ] },
  { id: 'college-admissions-phase1', site: 'Colleges', title: 'Admissions: steps 1 to 6', files: ['PNTC Colleges/admissions.html'], fields: [1, 2, 3, 4, 5, 6].map(stepFields).flat() },
  { id: 'college-admissions-phase2', site: 'Colleges', title: 'Admissions: steps 7 to 11', files: ['PNTC Colleges/admissions.html'], fields: [7, 8, 9, 10, 11].map(stepFields).flat() },
  { id: 'directory-facts', site: 'Colleges and SHS', title: 'Directory: hours, address and trunk line', note: 'Saved to both the College and the Senior High School directory pages.',
    files: ['PNTC Colleges/directory.html', 'SHS/directory.html'], fields: [
      T('dir.where', 'Where'), T('dir.hours', 'Office hours'), T('dir.phone', 'Trunk line, as shown'),
      { key: 'dir.phone.href', label: 'Trunk line, number to dial', type: 'href', hint: 'Start with tel: and the country code, for example tel:+63464388835.' },
    ] },
  { id: 'shs-hero', site: 'Senior High School', title: 'SHS hero', files: ['SHS/index.html'], fields: [
    T('shs.hero.tag', 'Small tag above the headline'),
    T('shs.hero.line1', 'Headline, line 1'), T('shs.hero.line2', 'Headline, line 2'), T('shs.hero.line3', 'Headline, line 3 (yellow)'),
    P('shs.hero.desc', 'Description'), T('shs.hero.btn1', 'First button, text'), T('shs.hero.btn2', 'Second button, text'),
  ] },
  { id: 'shs-strands-academic', site: 'Senior High School', title: 'Strand guide: Academic Track', files: ['SHS/strands.html'],
    fields: [P('shs.track.academic.desc', 'Track description'), ...STRANDS.filter(s => s[2] === 'academic').map(strandFields).flat()] },
  { id: 'shs-strands-techpro', site: 'Senior High School', title: 'Strand guide: Tech-Pro Track', files: ['SHS/strands.html'],
    fields: [P('shs.track.techpro.desc', 'Track description'), ...STRANDS.filter(s => s[2] === 'techpro').map(strandFields).flat()] },
  { id: 'training-hero', site: 'Training Center', title: 'Training Center hero', files: ['PNTC Maritime Training and Assessment Center/index.html'], fields: [
    T('training.hero.pill', 'Small tag above the headline'),
    T('training.hero.line1', 'Headline, line 1 (white)'), T('training.hero.line3', 'Headline, line 2 (gold)'),
    P('training.hero.sub', 'Description'), T('training.hero.bold', 'Bold ending of the description'),
    T('training.hero.btn1', 'First button, text'), H('training.hero.btn1.href', 'First button, link'),
    T('training.hero.btn2', 'Second button, text'), H('training.hero.btn2.href', 'Second button, link'),
  ] },
  { id: 'training-cta', site: 'Training Center', title: 'Training Center name in the contact and enroll bands', note: 'Used in the navy contact band on the Training Center home page and the enroll band on the courses page.', files: ['PNTC Maritime Training and Assessment Center/index.html', 'PNTC Maritime Training and Assessment Center/maritime-courses.html'], fields: [
    T('training.cta.mark', 'Name, gold part'), T('training.cta.rest', 'Name, white part'),
  ] },
];

module.exports = { GROUPS, LEADERS, escHtml, decode, getSlot, setSlot, getAttr, setAttr, readField, writeField, readGroup, writeGroup, preserveSlots, CHECK };
