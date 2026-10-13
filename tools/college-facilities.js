// College home page and Student Life: facility cards. The Tanza pool card becomes the Audio Visual Room,
// and the Tourism and Criminology laboratory cards get their photos. Rerunnable:  node tools/college-facilities.js
const fs = require('fs');
const path = require('path');
const photo = (comment, file, alt, tag, name, status, delay) => `<!-- ${comment} -->
    <div class="fac-card has-photo reveal" style="transition-delay:${delay}">
      <img class="fac-photo" src="${file}" alt="${alt}" loading="lazy">
      <div class="fac-img-overlay"></div>
      <div class="fac-content">
        <div class="fac-tag">${tag}</div>
        <div class="fac-name">${name}</div>${status ? `\n        <div class="fac-status">${status}</div>` : ''}
      </div>
    </div>`;
const SWAPS = [
  [/<!-- Training Center Swimming Pool[^>]*-->\s*<div class="fac-card reveal"[\s\S]*?<\/div>\n    <\/div>|<!-- Training Center Swimming Pool[^>]*-->\s*<div class="fac-card reveal"[\s\S]*?<div class="fac-status">Tanza Campus<\/div>\s*<\/div>/,
    photo('Audio Visual Room — real photo', 'Facility - Audio Visual Room.jpg', 'Audio Visual Room', 'Campus Facility', 'Audio Visual Room (AVR)', '', '.17s')],
  [/<!-- Tourism Laboratory[^>]*-->\s*<div class="fac-card reveal"[\s\S]*?<div class="fac-status">For BSTM students<\/div>\s*<\/div>/,
    photo('Tourism Laboratory — real photo', 'Facility - Tourism Laboratory.jpg', 'Tourism Laboratory', 'Academic Lab', 'Tourism Laboratory', 'For BSTM students', '.2s')],
  [/<!-- Criminology Laboratory[^>]*-->\s*<div class="fac-card reveal"[\s\S]*?<div class="fac-status">For BSCrim students<\/div>\s*<\/div>/,
    photo('Criminology Laboratory — real photo', 'Facility - Criminology Laboratory.jpg', 'Criminology Laboratory', 'Academic Lab', 'Criminology Laboratory', 'For BSCrim students', '.22s')],
];
const CSS = `<style id="fac-more-photos">
/* extra photo tiles after the first six keep the same height as a grid row */
#facilities .fac-card.has-photo:nth-child(n+7){min-height:clamp(190px,17vw,250px)}
/* the one card left without a photo runs the full width as a band */
@media(min-width:1025px){#facilities .fac-card:not(.has-photo):last-child{grid-column:1/-1;display:grid;grid-template-columns:auto 1fr auto;align-items:center;column-gap:1.4rem}#facilities .fac-card:not(.has-photo):last-child .fac-icon{grid-row:1/4;margin:0}#facilities .fac-card:not(.has-photo):last-child .fac-status{grid-column:3;grid-row:1/4;margin:0}#facilities .fac-card:not(.has-photo):last-child .fac-tag,#facilities .fac-card:not(.has-photo):last-child .fac-name,#facilities .fac-card:not(.has-photo):last-child .fac-desc{grid-column:2;margin-bottom:.2rem;max-width:none}}
</style>
`;
for (const name of ['index.html', 'student-life.html']) {
  const file = path.join(__dirname, '..', 'PNTC Colleges', name);
  let h = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  let n = 0;
  for (const [re, html] of SWAPS) if (re.test(h)) { h = h.replace(re, html); n++; }
  h = h.replace(/<style id="fac-more-photos">[\s\S]*?<\/style>\n/, '');
  h = h.replace('</head>', CSS + '</head>');
  fs.writeFileSync(file, h);
  console.log(name, 'cards replaced:', n);
}
