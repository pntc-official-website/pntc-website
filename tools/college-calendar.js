// College > Academic Calendar. Rebuilds PNTC Colleges/calendar.html from content/college-calendar.json.
// The admin console does the same thing when the calendar is saved there (Site Content > Academic Calendar).
// Rerunnable:  node tools/college-calendar.js
const fs = require('fs');
const path = require('path');
const CAL = require('../admin/calendar.js');
const FILE = path.join(__dirname, '..', 'PNTC Colleges', 'calendar.html');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'college-calendar.json'), 'utf8'));
const errs = CAL.validate(data);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
fs.writeFileSync(FILE, CAL.apply(fs.readFileSync(FILE, 'utf8'), data));
const b = CAL.build(data);
console.log('calendar built:', b.entries, 'entries in', b.months, 'months;', b.student, 'in the student view');
