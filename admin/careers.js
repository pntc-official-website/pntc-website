// Careers page: turns the job openings saved in the admin (Landing Content > Careers) into the cards on the page.
// Shared by the admin console (admin/server.js) and by tools/careers-page.js.
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const HR_EMAIL = 'hr@pntc.edu.ph';
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const badgeClass = t => (t === 'Part-Time' ? 'b-pt' : t === 'Contract' ? 'b-ct' : 'b-ft');

function card(i) {
  const type = i.badgeType || 'Full-Time';
  const location = i.location || 'Dasmariñas, Cavite';
  const subject = encodeURIComponent('Application for ' + (i.title || 'a position'));
  return `<article class="job-card reveal" data-type="${esc(type)}">`
    + `<div class="job-top"><span class="job-dept">${esc(i.department)}</span><span class="job-badge ${badgeClass(type)}">${esc(type)}</span></div>`
    + `<h3 class="job-title">${esc(i.title)}</h3>`
    + `<p class="job-meta">${PIN}<span>${esc(location)}</span></p>`
    + `<p class="job-desc">${esc(i.description)}</p>`
    + `<a class="job-apply" href="mailto:${HR_EMAIL}?subject=${subject}">Apply for this role <span aria-hidden="true">&rarr;</span></a>`
    + `</article>`;
}

// The block that sits between the PNTC_CAREERS markers on the page
function build(items) {
  return `    <div class="jobs-grid">${(items || []).map(card).join('')}</div>`;
}

module.exports = { build, card, HR_EMAIL };
