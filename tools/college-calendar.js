// College > Academic Calendar. Builds the calendar section of PNTC Colleges/calendar.html
// from the Collegiate Calendar for Academic Year 2026-2027 (approved copy, PDF).
// Rerunnable:  node tools/college-calendar.js
const fs = require('fs');
const FILE = require('path').join(__dirname, '..', 'PNTC Colleges', 'calendar.html');
const N = '#1C1650', GOLD = '#F3CF33';

// Categories. "faculty" items are hidden in the default student view.
const CATS = {
  class:    { label: 'Classes and Breaks',  color: '#1C1650' },
  exam:     { label: 'Exams',               color: '#B4232A' },
  orient:   { label: 'Orientation',         color: '#0E7C86' },
  event:    { label: 'Events and Seminars', color: '#6B3FA0' },
  holiday:  { label: 'Holidays',            color: '#9A6B00' },
  enroll:   { label: 'Enrollment',          color: '#1B7F3B' },
  deadline: { label: 'Student Deadlines',   color: '#B45309' },
  faculty:  { label: 'Faculty and Admin',   color: '#5B6072' },
};

// [dates, title, category, major?]. Dates are day numbers in the block's month ("19,21-23"),
// or full ISO dates/ranges for anything that crosses months ("2026-11-25..2026-12-07").
const DATA = {
  '2026-07': [
    ['27', 'Freshmen Orientation, New Students (Batch 1)', 'orient'],
    ['28', 'Quipper Orientation, New Students (Batch 1)', 'orient'],
    ['29', 'Freshmen Orientation, New Students (Batch 2)', 'orient'],
    ['30', 'Quipper Orientation, New Students (Batch 2)', 'orient'],
  ],
  '2026-08': [
    ['3', "Founder's Day", 'event'],
    ['3', 'Freshmen Orientation, New Students (Batch 3)', 'orient'],
    ['4', 'Quipper Orientation, New Students (Batch 3)', 'orient'],
    ['5', 'Freshmen Orientation, New Students (Batch 4)', 'orient'],
    ['6', 'Quipper Orientation, New Students (Batch 4)', 'orient'],
    ['10', 'Freshmen Orientation, New Students (Batch 5)', 'orient'],
    ['11', 'Quipper Orientation, New Students (Batch 5)', 'orient'],
    ['12', 'Freshmen Orientation, New Students (Batch 6)', 'orient'],
    ['13', 'Quipper Orientation, New Students (Batch 6)', 'orient'],
    ['17', 'Freshmen Orientation, New Students (Batch 7)', 'orient'],
    ['18', 'Quipper Orientation, New Students (Batch 7)', 'orient'],
    ['18-19', 'Faculty Onboarding', 'faculty'],
    ['19', 'Freshmen Orientation, New Students (Batch 8)', 'orient'],
    ['20', 'Quipper Orientation, New Students (Batch 8)', 'orient'],
    ['21', 'Ninoy Aquino Day', 'holiday'],
    ['24', 'Faculty General Assembly', 'faculty'],
    ['24', 'Freshmen Orientation, New Students (Batch 9)', 'orient'],
    ['25', 'Quipper Orientation, New Students (Batch 9)', 'orient'],
    ['27', 'Faculty Member Quipper Refresher Training', 'faculty'],
    ['27', 'Faculty Member Onboard Training Assessment', 'faculty'],
    ['31', 'National Heroes Day', 'holiday'],
  ],
  '2026-09': [
    ['1', 'Start of Classes, 1st Semester', 'class', true],
    ['1-4,7-11,14-15', 'Load Revision Period', 'enroll'],
    ['5', 'World Environmental Health Day', 'event'],
    ['14-18', 'National Seafarers Day Celebration', 'event'],
    ['14-18', 'MANA MO Celebration', 'event'],
    ['14-19', 'Submission of Prelim Examination Questionnaire to the College Deans', 'faculty'],
    ['15', 'Last Day of Enrollment', 'enroll', true],
    ['19,21-23', 'Practical Assessment, Prelim', 'exam', true],
    ['24-25', 'Written Examination, Prelim', 'exam', true],
    ['26,28', 'Special Assessment, Prelim', 'exam', true],
    ['30', 'World Tourism Day Celebration', 'event'],
  ],
  '2026-10': [
    ['1', 'Guidance Wellness Day', 'event'],
    ['1-2', 'Encoding and Submission of Prelim Grade to the Office of the College Deans', 'faculty'],
    ['5-7', 'Encoding and Submission of Prelim Grade to the Office of the Registrar', 'faculty'],
    ['5-9', 'Filing of Candidacy and Election of Student Organization Officers', 'event'],
    ['5-9', 'School Adjustment and Effective Study Habits Seminar', 'event'],
    ['5-9', 'TRB Orientation for MT and MarE CCI Students', 'orient'],
    ['10', 'Seminar on Ethical Dilemmas in Trade for BSCA and BSOA', 'event'],
    ['12-17', 'Submission of Midterm Examination Questionnaire to the College Deans', 'faculty'],
    ['13', 'National Mental Health Week', 'event'],
    ['17,19-21', 'Practical Assessment, Midterm', 'exam', true],
    ['21', 'Last Day of Filing for Change of Grade for Prelim (1st Semester, AY 2026-2027)', 'deadline'],
    ['22-23', 'Written Examination, Midterm', 'exam', true],
    ['24,26', 'Special Assessment, Midterm', 'exam', true],
    ['27-29', 'PNTC Foundation Week Celebration', 'event', true],
    ['29-30', 'Encoding and Submission of Midterm Grade to the Office of the College Deans', 'faculty'],
    ['29-31', 'Student Organization Recruitment Week', 'event'],
    ['30', "World Teacher's Day Celebration", 'event'],
  ],
  '2026-11': [
    ['1', "All Saints' Day", 'holiday'],
    ['2', "All Souls' Day", 'holiday'],
    ['3-5', 'Encoding and Submission of Midterm Grade to the Office of the Registrar', 'faculty'],
    ['7', 'Industry Visit and Familiarization for BSCA and BSOA', 'event'],
    ['9', 'Drug Abuse Prevention and Control Week', 'event'],
    ['9', 'Submission of Course Offerings to the College Deans and Principal for 2nd Semester, AY 2026-2027', 'faculty'],
    ['9-14', 'Submission of Final Examination Questionnaire to the College Deans', 'faculty'],
    ['10-16', 'Anger Management and Emotion Regulation Seminar', 'event'],
    ['12-13', 'Encoding of Class Schedule for 2nd Semester to the School System', 'faculty'],
    ['13', 'Tourism In-flight Seminar', 'event'],
    ['13-17', 'Faculty Evaluation for 1st Semester, AY 2026-2027', 'deadline'],
    ['13-17', 'Student Satisfaction Survey, 1st Semester, AY 2026-2027', 'deadline'],
    ['16-19', 'Practical Assessment, Finals', 'exam', true],
    ['19', 'Last Day of Filing for Change of Grade, Midterm', 'deadline'],
    ['19', 'Submission of Initial Faculty Loading to the OVPAA', 'faculty'],
    ['20-21', 'Written Examination, Finals', 'exam', true],
    ['21', 'Last Day of Submission of Completion Form (1st Semester, AY 2025-2026)', 'deadline'],
    ['23-24', 'Special Assessment, Finals', 'exam', true],
    ['2026-11-23..2026-11-28,2026-12-01..2026-12-05,2026-12-07', 'MMRP 1 Training (2nd Year, BSMT and BSMarE)', 'class'],
    ['2026-11-23..2026-11-28,2026-12-01..2026-12-05,2026-12-07', 'MMRP 2 Training (3rd Year, BSMarE)', 'class'],
    ['2026-11-23..2026-11-28,2026-12-01..2026-12-05,2026-12-07', 'Pre-Onboard Training Orientation for BSMarE 3rd Year', 'orient'],
    ['24-25', 'Encoding and Submission of Final Grade to the Office of the College Deans', 'faculty'],
    ['2026-11-25..2026-12-07', 'Semestral Break', 'class', true],
    ['26', 'Paru-Paro Festival', 'holiday'],
    ['27', 'Oath Taking Ceremony for Newly Elected Organization Officers', 'event'],
    ['27-28', 'Encoding and Submission of Final Grade to the Office of the Registrar', 'faculty'],
    ['27-28', 'Signing of Faculty Clearance', 'faculty'],
    ['30', 'Bonifacio Day', 'holiday'],
  ],
  '2026-12': [
    ['1', 'Viewing of Grades', 'deadline'],
    ['1-4', 'Culture and Arts Week', 'event'],
    ['1-7', 'Enrollment Period for 2nd Semester, AY 2026-2027', 'enroll', true],
    ['7', 'Celebrating Differences, Disability Awareness and Inclusion Month Seminar', 'event'],
    ['8', 'Feast of the Immaculate Conception', 'holiday'],
    ['9', 'Start of Classes, 2nd Semester', 'class', true],
    ['9', 'Encoding and Submission of Final Grade for MMRP 1', 'faculty'],
    ['9-22', 'Load Revision Period', 'enroll'],
    ['15', 'World AIDS Day', 'event'],
    ['17', 'Student Christmas Party and Team Building', 'event'],
    ['19', "Start of Students' Christmas Break", 'class', true],
    ['22', 'Last Day of Enrollment', 'enroll', true],
    ['24', 'Christmas Eve', 'holiday'],
    ['25', 'Christmas Day', 'holiday'],
    ['30', 'Rizal Day', 'holiday'],
    ['31', "New Year's Eve", 'holiday'],
  ],
  '2027-01': [
    ['1', "New Year's Day", 'holiday'],
    ['2', 'Resumption of Classes', 'class', true],
    ['11-16', 'Submission of Prelim Examination Questionnaire to the College Deans', 'faculty'],
    ['12', 'Liver Cancer and Viral Hepatitis Control and Prevention Month Seminar', 'event'],
    ['20-23,25-26', 'Practical Assessment, Prelim', 'exam', true],
    ['27-29', 'Written Examination, Prelim', 'exam', true],
    ['30', 'Joint Opening Collar and Recognition of Cadet Officers', 'event'],
    ['2027-01-30,2027-02-01..2027-02-02', 'Special Assessment, Prelim', 'exam', true],
  ],
  '2027-02': [
    ['3-5', "Tourism Students' Ilocos Tour", 'event'],
    ['6', 'Chinese New Year', 'holiday'],
    ['8-9', 'Encoding and Submission of Prelim Grade to the Office of the College Deans', 'faculty'],
    ['9', 'World Heart Day', 'event'],
    ['10-12', 'Encoding and Submission of Prelim Grade to the Office of the Registrar', 'faculty'],
    ['13', 'Mock Board Exam for BSCA 4th Year Students', 'exam'],
    ['19', 'International Tourist Guide Day, CITM', 'event'],
    ['22-26', 'Anti-Hazing Prevention Week Seminar', 'event'],
    ['25', 'People Power Anniversary', 'holiday'],
    ['26', 'Last Day of Filing for Change of Grade for Prelim (2nd Semester, AY 2026-2027)', 'deadline'],
    ['27-28', 'National Arts and English Week', 'event'],
  ],
  '2027-03': [
    ['1', 'Submission of Course Offerings to the College Deans and Principal for 1st Semester, AY 2027-2028', 'faculty'],
    ['1-6', 'Submission of Midterm Examination Questionnaire to the College Deans', 'faculty'],
    ['2', 'World Tuberculosis Day', 'event'],
    ['5-6,10-12', 'Practical Assessment, Midterm', 'exam', true],
    ['9', 'End of Ramadan (Eid al-Fitr)', 'holiday'],
    ['13,15-16', 'Written Assessment, Midterm', 'exam', true],
    ['15-31', 'Student Satisfaction Survey for 2nd Semester, AY 2026-2027', 'deadline'],
    ['15-31', 'Faculty Evaluation for 2nd Semester, AY 2026-2027', 'deadline'],
    ['17-19', 'Special Assessment, Midterm', 'exam', true],
    ['18', 'Encoding of Class Schedule for 1st Semester, AY 2027-2028 in the School System', 'faculty'],
    ['19', 'Gender and Development Program Workshop', 'event'],
    ['22', 'Cavite Day', 'holiday'],
    ['23', 'Submission of Course Offerings to the College Deans for Summer Classes', 'faculty'],
    ['25', 'Maundy Thursday', 'holiday'],
    ['26', 'Good Friday', 'holiday'],
    ['27', 'Black Saturday', 'holiday'],
    ['29', 'Start of Enrollment for 1st Semester, AY 2027-2028 (SHS, Freshmen and Transferees)', 'enroll', true],
    ['29-30', 'Career Guidance Orientation, Maritime', 'event'],
  ],
  '2027-04': [
    ['1-2', 'Encoding and Submission of Midterm Grade to the Office of the College Deans', 'faculty'],
    ['5-7', 'Encoding and Submission of Midterm Grade to the Office of the Registrar', 'faculty'],
    ['7-8', "World Blood Donor's Day", 'event'],
    ['9', 'The Day of Valor', 'holiday'],
    ['12-16', 'Sports Fest 2027', 'event', true],
    ['19-23', 'Resilience, Developing Coping Skills during Adversity Seminar', 'event'],
    ['19-24', 'Submission of Final Examination Questionnaire to the College Deans', 'faculty'],
    ['21', 'Last Day of Filing for Change of Grade for Midterm (2nd Semester, AY 2026-2027)', 'deadline'],
    ['23-24,26-29', 'Practical Assessment, Finals', 'exam', true],
    ['26', 'Encoding of Class Schedule for Summer Term 2027 in the School System', 'faculty'],
    ['2027-04-30,2027-05-03..2027-05-04', 'Written Assessment, Finals', 'exam', true],
  ],
  '2027-05': [
    ['1', 'Labor Day', 'holiday'],
    ['3-21', 'Community Extension Program to Adopted Barangay Residents', 'event'],
    ['4', 'Last Day of Submission of Completion Form (2nd Semester, AY 2025-2026)', 'deadline'],
    ['5-7', 'Special Assessment, Finals', 'exam', true],
    ['5-18', 'MMRP 2, BSMT 3rd Year', 'class'],
    ['5-18', 'Pre-Onboard Training Orientation for BSMT 3rd Year', 'orient'],
    ['7', 'Career Guidance Orientation, BS Customs Administration', 'event'],
    ['7-8', 'Encoding and Submission of Final Grade to the Office of the College Deans', 'faculty'],
    ['8-15', 'Semestral Break', 'class', true],
    ['10-12', 'Encoding and Submission of Final Grade to the Office of the Registrar', 'faculty'],
    ['10-12', 'Signing of Faculty Clearance', 'faculty'],
    ['13-14', 'Viewing of Grades', 'deadline'],
    ['13-14', 'Enrollment for Summer Classes', 'enroll', true],
    ['16', 'Feast of Sacrifice (Eid al-Adha)', 'holiday'],
    ['17', 'Start of Summer Classes', 'class', true],
    ['20', 'Encoding and Submission of MMRP 2 Final Grade to the Office of the Registrar', 'faculty'],
    ['21', 'Last Day of Enrollment and Load Revision, Summer Classes', 'enroll'],
    ['24', 'Submission of Prelim Examination Questionnaire to the College Deans', 'faculty'],
    ['24-25', 'Community Immersion, NSTP', 'event'],
    ['26-27', 'Practical Assessment, Prelim (Summer)', 'exam', true],
    ['27', 'Deliberation of Candidates for Graduation and Ring Hop', 'faculty'],
    ['28', 'Written Assessment, Prelim (Summer)', 'exam', true],
    ['29', 'Special Assessment, Prelim (Summer)', 'exam', true],
  ],
  '2027-06': [
    ['1-2', 'Encoding and Submission of Prelim Grade to the Office of the College Deans', 'faculty'],
    ['3-4', 'Encoding and Submission of Prelim Grade to the Office of the Registrar', 'faculty'],
    ['7', 'Submission of Midterm Examination Questionnaire to the College Deans', 'faculty'],
    ['7', 'Closing Ceremony of NSTP and Turn Over of Leadership of Student Organizations', 'event'],
    ['9-10', 'Practical Assessment, Midterm (Summer)', 'exam', true],
    ['11', 'Written Assessment, Midterm (Summer)', 'exam', true],
    ['11', 'Last Day of Filing for Change of Grade, Prelim (Summer)', 'deadline'],
    ['12', 'Independence Day', 'holiday'],
    ['14', 'Special Assessment, Midterm (Summer)', 'exam', true],
    ['14', 'Last Day of Filing of Completion Form for Summer (2025-2026)', 'deadline'],
    ['15-16', 'Encoding and Submission of Midterm Grade to the Office of the College Deans', 'faculty'],
    ['17-18', 'Encoding and Submission of Midterm Grade to the Office of the Registrar', 'faculty'],
    ['18', '22nd Commencement Exercises', 'event', true],
    ['21', 'Submission of Final Examination Questionnaire to the Office of College Deans', 'faculty'],
    ['24-25', 'Practical Assessment, Finals (Summer)', 'exam', true],
    ['25', 'Last Day of Filing for Change of Grade, Midterm (Summer)', 'deadline'],
    ['26', 'Written Assessment, Finals (Summer)', 'exam', true],
    ['28', 'Special Assessment, Finals (Summer)', 'exam', true],
    ['28', 'End of Summer Classes', 'class', true],
    ['29-30', 'Encoding and Submission of Final Grade to the Office of the Dean', 'faculty'],
    ['2027-06-29..2027-07-10', 'Summer Break', 'class', true],
  ],
  '2027-07': [
    ['1-2,5', 'Encoding and Submission of Final Grade to the Office of the Registrar', 'faculty'],
    ['6-9', 'Enrollment for 1st Semester, AY 2027-2028 (Continuing Students with Summer Classes)', 'enroll', true],
    ['9', 'Last Day of Filing for Change of Grade, Finals (Summer)', 'deadline'],
    ['12', 'Start of Classes, AY 2027-2028', 'class', true],
    ['30', '21st Ring Hop Ceremony', 'event', true],
  ],
};

const OVERVIEW = [
  ['First Semester', 'Sep 1 to Nov 24, 2026', '12 weeks'],
  ['Second Semester', 'Dec 9, 2026 to May 7, 2027', '18 weeks'],
  ['Christmas Vacation', 'Dec 21, 2026 to Jan 1, 2027', 'Classes resume Jan 2'],
  ['Summer Classes', 'May 17 to Jun 28, 2027', '6 weeks'],
  ['Summer Vacation', 'May 8 to Jul 10, 2027', '64 days'],
  ['Next School Year', 'Classes start Jul 12, 2027', 'AY 2027-2028'],
];

// ── date helpers (all in UTC so nothing shifts) ──
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const iso = d => d.toISOString().slice(0, 10);
const D = s => new Date(s + 'T00:00:00Z');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function parts(spec, ym) {
  return spec.split(',').map(tok => {
    tok = tok.trim();
    if (/^\d{4}-/.test(tok)) { const [a, b] = tok.split('..'); return [a, b || a]; }
    const [a, b] = tok.split('-'); const p = n => `${ym}-${String(n).padStart(2, '0')}`;
    return [p(a), p(b || a)];
  });
}
function days(ps) { const out = []; for (const [a, b] of ps) for (let d = D(a); d <= D(b); d.setUTCDate(d.getUTCDate() + 1)) out.push(iso(d)); return out; }
function label(ps, ym) {
  const oneMonth = ps.every(([a, b]) => a.slice(0, 7) === ym && b.slice(0, 7) === ym);
  const f = s => (oneMonth ? '' : MON[+s.slice(5, 7) - 1] + ' ') + (+s.slice(8));
  return ps.map(([a, b]) => a === b ? f(a) : (oneMonth || a.slice(0, 7) === b.slice(0, 7) ? f(a) + ' to ' + (+b.slice(8)) : f(a) + ' to ' + f(b))).join(', ');
}
function sub(ps) {
  if (ps.length === 1 && ps[0][0] === ps[0][1]) return DOW[D(ps[0][0]).getUTCDay()];
  const n = days(ps).length; return n + ' days';
}

// ── build month blocks ──
const months = Object.keys(DATA);
const all = [];
for (const ym of months) DATA[ym].forEach(([spec, title, cat, major], i) => {
  const ps = parts(spec, ym); const ds = days(ps);
  all.push({ ym, ps, ds, title, cat, major: !!major, start: ds[0], end: ds[ds.length - 1], order: i });
});
const byMonth = ym => all.filter(e => e.ym === ym).sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : a.order - b.order);

function miniCal(ym) {
  const [y, m] = ym.split('-').map(Number); const first = new Date(Date.UTC(y, m - 1, 1)); const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let cells = DOW.map(d => `<span class="ac-dow">${d[0]}</span>`).join('');
  for (let i = 0; i < first.getUTCDay(); i++) cells += '<span></span>';
  for (let d = 1; d <= n; d++) {
    const id = `${ym}-${String(d).padStart(2, '0')}`;
    const cats = [...new Set(all.filter(e => e.ds.includes(id)).map(e => e.cat))];
    cells += cats.length ? `<button type="button" class="ac-day" data-d="${id}" data-cats="${cats.join(' ')}" aria-label="${MONTH[m - 1]} ${d}">${d}</button>` : `<span class="ac-day ac-off" data-d="${id}">${d}</span>`;
  }
  return `<div class="ac-mini" aria-hidden="false">${cells}</div>`;
}
const monthHtml = ym => {
  const [y, m] = ym.split('-').map(Number);
  const rows = byMonth(ym).map(e => `        <li class="ac-ev${e.major ? ' ac-major' : ''}" data-cat="${e.cat}" data-s="${e.start}" data-e="${e.end}" data-days="${e.ds.join(' ')}" style="--c:${CATS[e.cat].color}">
          <div class="ac-date"><strong>${esc(label(e.ps, ym))}</strong><span>${esc(sub(e.ps))}</span></div>
          <div class="ac-what"><p>${esc(e.title)}</p><span class="ac-tag">${CATS[e.cat].label}</span></div>
        </li>`).join('\n');
  return `    <section class="ac-month" id="m-${ym}" data-ym="${ym}">
      <div class="ac-side">
        <h2><span>${MONTH[m - 1]}</span> ${y}</h2>
        ${miniCal(ym)}
      </div>
      <ul class="ac-list">
${rows}
        <li class="ac-none" hidden>Nothing in this view for ${MONTH[m - 1]}.</li>
      </ul>
    </section>`;
};

const chips = [['student', 'Student View'], ...Object.entries(CATS).map(([k, v]) => [k, v.label]), ['all', 'Everything']];
const section = `<section id="acad-cal" class="ac">
  <div class="ac-in">
    <div class="ac-top">
      <div class="ac-next" id="acNext" hidden>
        <p class="ac-eyebrow">Coming Up</p>
        <ul id="acNextList"></ul>
      </div>
      <div class="ac-over">
        <p class="ac-eyebrow">Academic Year 2026-2027 at a Glance</p>
        <div class="ac-cards">
${OVERVIEW.map(([a, b, c]) => `          <div class="ac-card"><h3>${a}</h3><p>${b}</p><span>${c}</span></div>`).join('\n')}
        </div>
      </div>
    </div>

    <div class="ac-bar" id="acBar">
      <div class="ac-chips" role="group" aria-label="Show">
${chips.map(([k, l], i) => `        <button type="button" class="ac-chip${i ? '' : ' on'}" data-f="${k}"${CATS[k] ? ` style="--c:${CATS[k].color}"` : ''}>${l}</button>`).join('\n')}
      </div>
      <nav class="ac-months" aria-label="Jump to month">
${months.map(ym => `        <a href="#m-${ym}" data-ym="${ym}">${MON[+ym.slice(5) - 1]}<small>${ym.slice(2, 4)}</small></a>`).join('\n')}
      </nav>
    </div>

    <div class="ac-body" id="acBody" data-f="student">
${months.map(monthHtml).join('\n')}
    </div>

    <p class="ac-src">Based on the approved Collegiate Calendar for Academic Year 2026-2027 of PNTC Colleges, Inc., Dasmariñas City, Cavite. Dates may change. Please confirm with the Office of the Registrar.</p>
  </div>
  <script>
  (function(){
    var body=document.getElementById('acBody');if(!body)return;
    var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var evs=[].slice.call(body.querySelectorAll('.ac-ev'));
    var chips=[].slice.call(document.querySelectorAll('.ac-chip'));
    var now=new Date();var today=now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2)+'-'+('0'+now.getDate()).slice(-2);
    function shown(e,f){var c=e.getAttribute('data-cat');return f==='all'||(f==='student'?c!=='faculty':c===f);}
    function apply(f){
      body.setAttribute('data-f',f);
      chips.forEach(function(c){c.classList.toggle('on',c.getAttribute('data-f')===f);});
      evs.forEach(function(e){e.hidden=!shown(e,f);});
      [].forEach.call(body.querySelectorAll('.ac-month'),function(m){
        var any=[].some.call(m.querySelectorAll('.ac-ev'),function(e){return !e.hidden;});
        m.querySelector('.ac-none').hidden=any;
      });
      [].forEach.call(body.querySelectorAll('.ac-day[data-cats]'),function(d){
        var cs=d.getAttribute('data-cats').split(' ');
        var on=cs.filter(function(c){return f==='all'||(f==='student'?c!=='faculty':c===f);});
        d.classList.toggle('ac-dim',!on.length);
        d.setAttribute('data-top',on.indexOf('exam')>=0?'exam':on.indexOf('holiday')>=0?'holiday':on.indexOf('class')>=0?'class':(on[0]||''));
      });
    }
    chips.forEach(function(c){c.addEventListener('click',function(){apply(c.getAttribute('data-f'));});});
    // past, today, coming up
    evs.forEach(function(e){
      if(e.getAttribute('data-e')<today)e.classList.add('ac-past');
      if((' '+e.getAttribute('data-days')+' ').indexOf(' '+today+' ')>=0)e.classList.add('ac-now');
    });
    var t=body.querySelector('.ac-day[data-d="'+today+'"]');if(t)t.classList.add('ac-today');
    function when(s){var a=new Date(s+'T00:00:00'),b=new Date(today+'T00:00:00');var n=Math.round((a-b)/864e5);return n<=0?'Happening now':n===1?'Tomorrow':'In '+n+' days';}
    var up=evs.filter(function(e){return e.getAttribute('data-cat')!=='faculty'&&e.getAttribute('data-e')>=today;})
      .sort(function(a,b){return a.getAttribute('data-s')<b.getAttribute('data-s')?-1:1;}).slice(0,3);
    if(up.length){
      document.getElementById('acNextList').innerHTML=up.map(function(e){
        var s=e.getAttribute('data-s');
        return '<li style="--c:'+e.style.getPropertyValue('--c')+'"><a href="#m-'+s.slice(0,7)+'"><b>'+MON[+s.slice(5,7)-1]+' '+(+s.slice(8))+'</b><span>'+e.querySelector('.ac-what p').textContent+'</span><em>'+when(s)+'</em></a></li>';
      }).join('');
      document.getElementById('acNext').hidden=false;
    }
    // month nav: mark the current month, follow the scroll
    var links=[].slice.call(document.querySelectorAll('.ac-months a'));
    links.forEach(function(a){if(a.getAttribute('data-ym')===today.slice(0,7))a.classList.add('cur');});
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){var ym=en.target.getAttribute('data-ym');links.forEach(function(a){var on=a.getAttribute('data-ym')===ym;a.classList.toggle('on',on);if(on&&a.scrollIntoView&&a.parentNode.scrollWidth>a.parentNode.clientWidth)a.parentNode.scrollLeft=a.offsetLeft-a.parentNode.clientWidth/2+a.clientWidth/2;});}});},{rootMargin:'-35% 0px -60% 0px'});
      [].forEach.call(body.querySelectorAll('.ac-month'),function(m){io.observe(m);});
    }
    // tap a day on the small calendar to light up what happens that day
    body.addEventListener('click',function(ev){
      var d=ev.target.closest('.ac-day[data-cats]');if(!d)return;
      var id=d.getAttribute('data-d'),first=null;
      evs.forEach(function(e){var hit=!e.hidden&&(' '+e.getAttribute('data-days')+' ').indexOf(' '+id+' ')>=0;e.classList.toggle('ac-hit',hit);if(hit&&!first)first=e;});
      [].forEach.call(body.querySelectorAll('.ac-day.ac-sel'),function(x){x.classList.remove('ac-sel');});d.classList.add('ac-sel');
      if(first&&first.scrollIntoView)first.scrollIntoView({behavior:'smooth',block:'center'});
    });
    apply('student');
  })();
  </script>
</section>`;

const CSS = `<style id="acad-cal-css">
/* College academic calendar */
.ac{background:#fff;padding:clamp(2.5rem,5vw,4rem) clamp(1rem,4vw,3rem) clamp(4rem,7vw,6rem);color:${N};font-family:'Montserrat',sans-serif}
.ac-in{max-width:1180px;margin:0 auto}
.ac-eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(28,22,80,.65);margin:0 0 .9rem}
.ac-top{display:grid;gap:clamp(1.2rem,2.5vw,2rem);margin-bottom:clamp(1.8rem,3.5vw,2.6rem)}
.ac-next{background:${N};color:#fff;border-radius:24px;padding:clamp(1.3rem,2.5vw,1.9rem);position:relative;overflow:hidden}
.ac-next::before{content:'';position:absolute;inset:0;background:radial-gradient(45% 80% at 95% 0%,rgba(243,207,51,.22),transparent 70%);pointer-events:none}
.ac-next .ac-eyebrow{color:${GOLD};position:relative}
.ac-next ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;position:relative}
.ac-next a{display:flex;flex-direction:column;gap:.35rem;height:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-left:5px solid ${GOLD};border-radius:16px;padding:1rem 1.1rem;color:#fff;text-decoration:none;transition:background .2s,transform .2s}
.ac-next a:hover{background:rgba(255,255,255,.14);transform:translateY(-3px)}
.ac-next b{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:1.7rem;line-height:1;text-transform:uppercase;color:${GOLD}}
.ac-next span{font-size:.92rem;font-weight:600;line-height:1.4}
.ac-next em{font-style:normal;font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.8);margin-top:auto}
.ac-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}
.ac-card{border:1px solid #E6E7E8;border-radius:18px;padding:1.1rem 1.2rem;background:linear-gradient(160deg,#fff,#F7F7FB)}
.ac-card h3{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:1.25rem;line-height:1.1;text-transform:uppercase;margin:0 0 .35rem;color:${N}}
.ac-card p{margin:0 0 .5rem;font-size:.92rem;font-weight:600;color:${N}}
.ac-card span{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;background:rgba(243,207,51,.4);color:${N};padding:.22rem .65rem;border-radius:999px}
.ac-bar{position:sticky;top:calc(46px + var(--header-h,68px));z-index:20;background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid #E6E7E8;margin:0 calc(clamp(1rem,4vw,3rem) * -1) clamp(1.5rem,3vw,2.2rem);padding:.75rem clamp(1rem,4vw,3rem) .6rem}
.ac-chips{display:flex;gap:.45rem;overflow-x:auto;scrollbar-width:none;padding-bottom:.55rem}
.ac-chips::-webkit-scrollbar,.ac-months::-webkit-scrollbar{display:none}
.ac-chip{flex:none;font-family:'Montserrat',sans-serif;font-size:.78rem;font-weight:700;color:${N};background:#fff;border:1.5px solid rgba(28,22,80,.2);border-radius:999px;padding:.45rem .95rem;cursor:pointer;display:inline-flex;align-items:center;gap:.45rem;transition:background .2s,color .2s,border-color .2s}
.ac-chip[style]::before{content:'';width:9px;height:9px;border-radius:50%;background:var(--c)}
.ac-chip:hover{border-color:${N}}
.ac-chip.on{background:${N};color:#fff;border-color:${N}}
.ac-chip.on[style]::before{box-shadow:0 0 0 2px #fff}
.ac-months{display:flex;gap:.3rem;overflow-x:auto;scrollbar-width:none}
.ac-months a{flex:none;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:.92rem;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;color:rgba(28,22,80,.7);padding:.3rem .7rem;border-radius:8px;transition:background .2s,color .2s}
.ac-months small{font-size:.68rem;margin-left:.25rem;opacity:.7}
.ac-months a:hover{background:rgba(28,22,80,.07);color:${N}}
.ac-months a.cur{box-shadow:inset 0 -3px 0 ${GOLD}}
.ac-months a.on{background:${GOLD};color:${N}}
.ac-month{display:grid;grid-template-columns:250px minmax(0,1fr);gap:clamp(1.2rem,3vw,2.6rem);padding:0 0 clamp(2rem,4vw,3rem);scroll-margin-top:calc(46px + var(--header-h,68px) + 120px)}
.ac-side{position:sticky;top:calc(46px + var(--header-h,68px) + 118px);align-self:start}
.ac-side h2{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:1.1rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(28,22,80,.6);margin:0 0 .8rem;line-height:1}
.ac-side h2 span{display:block;font-size:clamp(2.2rem,3.4vw,2.9rem);letter-spacing:0;color:${N};margin-bottom:.15rem}
.ac-mini{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;background:#F7F7FB;border:1px solid #E6E7E8;border-radius:16px;padding:.7rem}
.ac-dow{font-size:.62rem;font-weight:700;text-align:center;color:rgba(28,22,80,.55);padding-bottom:.2rem}
.ac-day{all:unset;box-sizing:border-box;aspect-ratio:1;display:grid;place-items:center;font-size:.74rem;font-weight:700;border-radius:8px;color:${N};cursor:pointer;background:rgba(28,22,80,.1);transition:transform .15s,box-shadow .15s}
.ac-day.ac-off{background:none;color:rgba(28,22,80,.45);font-weight:500;cursor:default}
.ac-day[data-top="exam"]{background:#B4232A;color:#fff}
.ac-day[data-top="holiday"]{background:${GOLD};color:${N}}
.ac-day[data-top="class"]{background:${N};color:#fff}
.ac-day.ac-dim{background:none;color:rgba(28,22,80,.45);font-weight:500}
.ac-day[data-cats]:hover{transform:scale(1.12)}
.ac-day:focus-visible,.ac-day.ac-sel{box-shadow:0 0 0 2px #fff,0 0 0 4px ${N}}
.ac-day.ac-today{box-shadow:0 0 0 2px #fff,0 0 0 4px ${GOLD}}
.ac-list{list-style:none;margin:0;padding:0;display:grid;gap:.55rem}
.ac-ev{display:grid;grid-template-columns:128px minmax(0,1fr);gap:1rem;align-items:center;background:#fff;border:1px solid #E6E7E8;border-left:6px solid var(--c);border-radius:14px;padding:.8rem 1rem;transition:box-shadow .2s,transform .2s,opacity .2s}
.ac-ev[hidden]{display:none}
.ac-ev:hover{box-shadow:0 14px 26px -18px rgba(28,22,80,.55);transform:translateX(3px)}
.ac-date strong{display:block;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:1.35rem;line-height:1.05;color:${N}}
.ac-date span{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(28,22,80,.6)}
.ac-what{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.4rem 1rem}
.ac-what p{margin:0;font-size:.95rem;font-weight:500;line-height:1.45;color:${N};flex:1 1 260px}
.ac-tag{flex:none;font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--c);border:1.5px solid var(--c);border-radius:999px;padding:.2rem .6rem;white-space:nowrap}
.ac-major{background:linear-gradient(90deg,color-mix(in srgb,var(--c) 9%,#fff),#fff 70%)}
.ac-major .ac-what p{font-weight:800}
.ac-past{opacity:.5}
.ac-past:hover{opacity:1}
.ac-now{box-shadow:0 0 0 2px ${GOLD};background:#FFFBE6}
.ac-now .ac-date span::after{content:' · Now';color:#B4232A}
.ac-hit{box-shadow:0 0 0 3px ${N}}
.ac-none{font-size:.9rem;color:rgba(28,22,80,.6);border:1px dashed rgba(28,22,80,.25);border-radius:14px;padding:.9rem 1rem}
.ac-src{margin:1rem 0 0;font-size:.78rem;line-height:1.6;color:rgba(28,22,80,.6)}
@media(max-width:900px){
  .ac-next ul{grid-template-columns:1fr}
  .ac-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ac-month{grid-template-columns:minmax(0,1fr)}
  .ac-side{position:static;display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:1rem;align-items:end}
  .ac-side h2{margin:0}
}
@media(max-width:560px){
  .ac-cards{grid-template-columns:1fr}
  .ac-side{grid-template-columns:minmax(0,1fr) 150px}
  .ac-mini{padding:.45rem;gap:2px}
  .ac-day{font-size:.62rem;border-radius:6px}
  .ac-ev{grid-template-columns:minmax(0,1fr);gap:.35rem;padding:.75rem .9rem}
  .ac-date{display:flex;align-items:baseline;gap:.6rem}
}
@media(prefers-reduced-motion:reduce){.ac-ev,.ac-day,.ac-next a{transition:none}}
@media print{.ac-bar,.ac-next,.ac-mini{display:none}.ac-month{grid-template-columns:1fr}.ac-side{position:static}.ac-ev{break-inside:avoid}.ac-past{opacity:1}}
</style>
`;

let h = fs.readFileSync(FILE, 'utf8');
if (h.includes('<section id="acad-cal"')) {
  const a = h.indexOf('<section id="acad-cal"'), b = h.indexOf('</section>', h.indexOf('</script>', a)) + '</section>'.length;
  h = h.slice(0, a) + section + h.slice(b);
} else {
  const a = h.indexOf('<section id="coming-soon"'), b = h.indexOf('</section>', a) + '</section>'.length;
  if (a < 0) throw new Error('placeholder section not found');
  h = h.slice(0, a) + section + h.slice(b);
}
h = h.replace(/<p class="pntc-sub-lead">[^<]*<\/p>/, '<p class="pntc-sub-lead">Key dates for Academic Year 2026-2027 at PNTC Colleges Dasmariñas. See when classes start, when exams are scheduled, and when the breaks and holidays fall.</p>');
h = h.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Academic calendar for Academic Year 2026-2027 at PNTC Colleges in Dasmariñas, Cavite, with class start dates, exam schedules, enrollment periods, holidays and school events.">');
h = h.replace(/<style id="acad-cal-css">[\s\S]*?<\/style>\n?/, '');
h = h.replace('</head>', CSS + '</head>');
fs.writeFileSync(FILE, h);
console.log('calendar built:', all.length, 'entries in', months.length, 'months;', all.filter(e => e.cat !== 'faculty').length, 'in the student view');
