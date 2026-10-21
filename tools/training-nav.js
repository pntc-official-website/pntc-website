// Training Center menu: a "Verify Certificate" link after TESDA, in the desktop menu and the phone menu,
// on every Training Center page. It opens the certificate verification site in a new tab.
// (The same link is in the Training Center footer, set in tools/site-footer.js.)
// Rerunnable:  node tools/training-nav.js
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'PNTC Maritime Training and Assessment Center');
const URL = 'https://secur-a-print.net/pntc2.sap';
const ext = 'target="_blank" rel="noopener"';

let n = 0;
for (const name of fs.readdirSync(DIR).filter(f => f.endsWith('.html'))) {
  const file = path.join(DIR, name);
  const before = fs.readFileSync(file, 'utf8');
  let h = before.replace(/\s*<a href="[^"]*" [^>]*data-verify[^>]*>Verify Certificate<\/a>/g, '');
  // desktop menu, then the phone menu
  h = h.replace(/(<a href="\/training\/tesda"(?: class="is-current" aria-current="page")?>TESDA<\/a>)/, `$1\n    <a href="${URL}" ${ext} data-verify>Verify Certificate</a>`);
  h = h.replace(/(<a href="\/training\/tesda" class="mob-link(?: is-current" aria-current="page)?"[^>]*>TESDA<\/a>)/, `$1\n    <a href="${URL}" ${ext} class="mob-link" data-verify>Verify Certificate</a>`);
  // with six menu items the full menu needs more room, so it folds into the menu button below 1420px instead of 1320px
  h = h.replace(/@media\(max-width:1320px\) and \(min-width:721px\)\{\.hdr-nav\{display:none\}/g, '@media(max-width:1420px) and (min-width:721px){.hdr-nav{display:none}');
  if (h !== before) { fs.writeFileSync(file, h); n++; }
}
console.log('training pages updated:', n);
