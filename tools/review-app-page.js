// Training Center: the PNTC Maritime Review app page (/training/review-app).
// Wording comes from the PNTC Maritime Review company profile and the app's Google Play listing.
// Every text sits in a Site Content slot (group training-review in admin/content.js).
// The Google Play address is kept on the hero button. The page copies it to every other download button,
// and the tutorial video plays whatever YouTube link is set on the "Watch on YouTube" link.
// Images: review-app-*.png / .jpg in the Training Center folder (replaceable from the admin Images screen).
// Rerunnable:  node tools/review-app-page.js
const fs = require('fs');
const path = require('path');
const C = require('../admin/content.js');
const FILE = path.join(__dirname, '..', 'PNTC Maritime Training and Assessment Center', 'review-app.html');
const CSS = fs.readFileSync(path.join(__dirname, 'review-app-page.css'), 'utf8').replace(/\r\n/g, '\n').trim();
const slot = (key, v) => `<!--c:${key}-->${v}<!--/c-->`;
const IMG = '/maritime/review-app-';
const PLAY = 'https://play.google.com/store/apps/details?id=com.pntc.pntcreview';
const VIDEO = 'https://youtube.com/shorts/cjOo_QfN7wU';

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${extra}>${d}</svg>`;
const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00D7FE" d="M3.6 1.8 13.4 12l-9.8 10.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2z"/><path fill="#FFCE00" d="m16.7 8.7-3.3 3.3 3.3 3.3 3.8-2.1c1-.6 1-1.8 0-2.4z"/><path fill="#FF3A44" d="M13.4 12 3.6 22.2c.4.2.9.2 1.4-.1l11.7-6.8z"/><path fill="#00F076" d="M3.6 1.8c.4-.2.9-.2 1.4.1l11.7 6.8L13.4 12z"/></svg>',
  video: svg('<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
  badge: svg('<circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8.5 13.5-1.5 8 5-3 5 3-1.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  flame: svg('<path d="M12 22c4 0 7-2.8 7-6.8 0-3.6-2.4-5.6-3.6-8.2-.4 2-1.4 3.2-2.6 3.6.4-3.4-1-6.6-4.3-8.6.4 3.4-1.4 5.6-2.8 7.6C4.6 11.4 5 13 5 15.2 5 19.2 8 22 12 22z" fill="currentColor"/>'),
  compass: svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  anchor: svg('<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V21M5 12H3a9 9 0 0 0 18 0h-2M8 10.5h8"/>'),
  radio: svg('<path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4"/><circle cx="12" cy="12" r="2"/>'),
  xp: svg('<path d="M4 17h16M4 17V7l4 5 4-6 4 6 4-5v10"/>'),
  medal: svg('<circle cx="12" cy="14" r="6"/><path d="M8.5 9 6 3h4l2 4 2-4h4l-2.5 6M12 11.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>'),
  fire: svg('<path d="M12 21c3.6 0 6-2.4 6-5.8 0-3.2-2.2-5-3.2-7.4-.4 1.8-1.2 2.8-2.2 3.2.3-3-1-5.8-3.8-7.6.3 3-1.2 4.9-2.4 6.7C5.4 11.6 6 13 6 15.2 6 18.6 8.4 21 12 21z"/>'),
  clip: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M8.5 10l1.5 1.5 3-3M8.5 16l1.5 1.5 3-3M15 10.5h1.5M15 16.5h1.5"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  book: svg('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/><path d="M9 7h7M9 11h5"/>'),
  renew: svg('<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>'),
  left: svg('<path d="M15 5l-7 7 7 7"/>'),
  right: svg('<path d="M9 5l7 7-7 7"/>'),
  phone: svg('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  fb: svg('<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6.5v3.5H9V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
  yt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8z"/><path fill="#fff" d="M9.8 15.1 15.6 12 9.8 8.9z"/></svg>',
};

const playBtn = (key, first) => `<a class="ra-btn ra-play"${first ? ` data-c="ra.play.href" href="${PLAY}"` : ` href="${PLAY}" data-ra-play`} target="_blank" rel="noopener">${ICON.play}<span><small>${slot(key + '.small', 'Get it on')}</small><b>${slot(key + '.big', 'Google Play')}</b></span></a>`;

const banner = `<section id="page-banner" class="pntc-sub">
  <div class="pntc-sub-in">
    <p class="pntc-sub-eyebrow">${slot('ra.banner.eyebrow', 'Training &amp; Assessment')}</p>
    <h1>${slot('ra.banner.title', 'Maritime Review App')}</h1>
    <p class="pntc-sub-lead">${slot('ra.banner.lead', 'PNTC Maritime Review, the gamified Android reviewer that helps seafarers prepare for their MARINA examinations.')}</p>
  </div>
</section>`;

// the app introduction with the phone, right below the banner
const hero = `<section class="ra ra-hero" id="review-app">
  <div class="ra-wrap ra-hero-grid">
    <div>
      <p class="ra-pill"><img src="${IMG}icon.png" alt="" width="30" height="30">${slot('ra.hero.tag', 'PNTC Maritime Review')}</p>
      <h2 class="ra-h1"><span>${slot('ra.hero.line1', 'Study Hard.')}</span><span class="g">${slot('ra.hero.line2', 'Level Harder.')}</span></h2>
      <p class="ra-sub">${slot('ra.hero.sub', 'PNTC Maritime Review is an Android app that prepares seafarers for MARINA examinations. Every question you answer earns experience points, builds your daily streak and brings you closer to your license.')}</p>
      <div class="ra-btns">
        ${playBtn('ra.hero.play', true)}
        <a class="ra-btn ra-ghost" href="#tutorial">${ICON.video}${slot('ra.hero.btn2', 'Watch the Tutorial')}</a>
      </div>
      <div class="ra-stats">
        <div class="ra-stat"><b>${slot('ra.stat1.n', '4.9')}${ICON.star}</b><small>${slot('ra.stat1.l', 'Rating on Google Play')}</small></div>
        <div class="ra-stat"><b>${slot('ra.stat2.n', '500+')}</b><small>${slot('ra.stat2.l', 'Downloads')}</small></div>
        <div class="ra-stat"><b>${slot('ra.stat3.n', 'Free')}</b><small>${slot('ra.stat3.l', 'To Start')}</small></div>
      </div>
    </div>
    <div class="ra-stage">
      <span class="ra-ring" aria-hidden="true"></span>
      <img class="ra-phone" src="${IMG}phone.png" alt="The PNTC Maritime Review app showing the Daily Mock Test, Retake and competence list" width="560" height="1105">
      <div class="ra-chip c1" aria-hidden="true"><i>${ICON.badge}</i><span><b>${slot('ra.chip1.title', 'Badge Unlocked')}</b><small>${slot('ra.chip1.text', 'First Step')}</small></span></div>
      <div class="ra-chip c2" aria-hidden="true"><i>${ICON.flame}</i><span><b>${slot('ra.chip2.title', 'Daily Streak')}</b><small>${slot('ra.chip2.text', '20 questions a day')}</small></span></div>
    </div>
  </div>
</section>`;

const about = `<section class="ra ra-sec ra-about" id="about-app">
  <div class="ra-wrap ra-two">
    <div class="ra-rv">
      <p class="ra-eyebrow">${slot('ra.about.eyebrow', 'About the App')}</p>
      <h2 class="ra-h2">${slot('ra.about.title', 'Level up your maritime career')} <em>${slot('ra.about.mark', 'without the boredom')}</em></h2>
      <p class="ra-lead">${slot('ra.about.p1', 'PNTC Maritime Review brings maritime exam preparation to your phone through gamified digital learning. It joins traditional maritime education with technology and turns licensure preparation into an engaging experience you can see progress in.')}</p>
      <p class="ra-lead">${slot('ra.about.p2', 'Board exam questions become a digital progression system. Instead of passive memorization, you build active mastery and study consistently, anytime and anywhere.')}</p>
      <ul class="ra-checks">${slot('ra.about.list', ['Made for MARINA examinations', 'Experience points, badges and daily streaks', 'Stats that show where you need more work', 'Free to start on Android'].map(x => `<li>${x}</li>`).join(''))}</ul>
    </div>
    <div class="ra-logo-card ra-rv"><img src="${IMG}logo.png" alt="PNTC Maritime Review logo" width="520" height="656" loading="lazy"></div>
  </div>
</section>

<section class="ra ra-quote" aria-label="What our reviewees say">
  <div class="ra-wrap ra-quote-in ra-rv">
    <p>${slot('ra.quote.text', '“Because it feels like I’m grinding a video game, except the final boss is my future.”')}</p>
    <small>${slot('ra.quote.label', 'Why reviewees stay hooked')}</small>
  </div>
</section>`;

const covers = [
  ['compass', 'OIC Level', 'Officer in Charge', 'Modules made for the Officer in Charge of a Navigational Watch and the Officer in Charge of an Engineering Watch.'],
  ['anchor', 'Management Level', 'Captains, Chief Mates and Engineers', 'Advanced review materials for Captains, Chief Mates, Chief Engineers and Second Engineers.'],
  ['radio', 'GOC Exam', 'General Operator’s Certificate', 'Full review packages for the GMDSS radio examination, in line with MARINA radio communication assessment standards.'],
];
const cover = `<section class="ra ra-sec ra-cover" id="exams">
  <div class="ra-wrap">
    <div class="ra-head center ra-rv">
      <p class="ra-eyebrow">${slot('ra.cover.eyebrow', 'Exam Coverage')}</p>
      <h2 class="ra-h2">${slot('ra.cover.title', 'Built for the exam')} <em>${slot('ra.cover.mark', 'you are taking')}</em></h2>
      <p class="ra-lead">${slot('ra.cover.lead', 'Pick your exam and the app gives you the official guidelines and a review set made for it.')}</p>
    </div>
    <div class="ra-cards">
      ${covers.map(([ic, t, h, p], i) => `<article class="ra-card ra-rv"><div class="ra-card-ico">${ICON[ic]}</div><p class="t">${slot(`ra.cover${i + 1}.tag`, t)}</p><h3>${slot(`ra.cover${i + 1}.title`, h)}</h3><p>${slot(`ra.cover${i + 1}.text`, p)}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>`;

const tiles = [
  ['xp', 'Earn Experience Points', 'Every question you answer fills your progress bar. Watch your points add up and unlock rare titles.'],
  ['medal', 'Badges and Achievements', 'Collect badges from First Step, for your first completed competence, up to Streak Legend, for 180 days of review without a miss.'],
  ['fire', 'Daily Review Streaks', 'Answer 20 questions a day to earn points and keep your review streak going.'],
  ['clip', 'Daily Mock Test and Retake', 'Take a daily mock test of random questions, then retake the ones you got wrong until they stick.'],
  ['chart', 'Stats That Make You Smarter', 'See your weakest areas, follow your accuracy over time and look back on your best performance.'],
  ['book', 'Exam Guidelines Built In', 'Choose the exam you plan to take and get its official guidelines right inside the app.'],
];
const feat = `<section class="ra ra-sec ra-feat" id="features">
  <div class="ra-wrap">
    <div class="ra-head ra-rv">
      <p class="ra-eyebrow">${slot('ra.feat.eyebrow', 'Features')}</p>
      <h2 class="ra-h2">${slot('ra.feat.title', 'Gamified')} <em>${slot('ra.feat.mark', 'to the core')}</em></h2>
      <p class="ra-lead">${slot('ra.feat.lead', 'A full progression system turns repetitive board exam review into something you want to come back to every day.')}</p>
    </div>
    <div class="ra-tiles">
      ${tiles.map(([ic, h, p], i) => `<article class="ra-tile ra-rv"><span class="ra-tile-n" aria-hidden="true">0${i + 1}</span><i>${ICON[ic]}</i><h3>${slot(`ra.feat${i + 1}.title`, h)}</h3><p>${slot(`ra.feat${i + 1}.text`, p)}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>`;

const shotAlt = ['Review screen with Daily Mock Test and Retake', 'A question with answer choices', 'Answer explanation after a question', 'Choosing a module to review', 'Your statistics and correct answers', 'Badges earned in the app', 'Your profile and competence title'];
const shots = `<section class="ra ra-sec ra-shots" id="screens">
  <div class="ra-wrap">
    <div class="ra-head center ra-rv">
      <p class="ra-eyebrow">${slot('ra.shots.eyebrow', 'Inside the App')}</p>
      <h2 class="ra-h2">${slot('ra.shots.title', 'Take a look')} <em>${slot('ra.shots.mark', 'inside')}</em></h2>
    </div>
  </div>
  <div class="ra-show" id="ra-show" aria-roledescription="slideshow" aria-label="App screens">
    ${shotAlt.map((a, i) => `<figure class="ra-slide" data-i="${i}"><img src="${IMG}shot${i + 1}.jpg" alt="${a}" width="600" height="1066"${i > 2 && i < shotAlt.length - 2 ? ' loading="lazy"' : ''}></figure>`).join('\n    ')}
  </div>
  <div class="ra-show-nav">
    <button type="button" class="ra-nav-btn" data-dir="-1" aria-label="Previous screen">${ICON.left}</button>
    <div class="ra-dots">${shotAlt.map((a, i) => `<button type="button" data-i="${i}" aria-label="Screen ${i + 1}"></button>`).join('')}</div>
    <button type="button" class="ra-nav-btn" data-dir="1" aria-label="Next screen">${ICON.right}</button>
  </div>
</section>`;

const steps = [
  ['Download the app', 'Get PNTC Maritime Review free on Google Play.'],
  ['Create your account', 'Sign up and set up your profile.'],
  ['Pick your exam', 'Choose the examination you are preparing for and read its guidelines.'],
  ['Review every day', 'Take the daily mock test, keep your streak and watch your stats improve.'],
];
const tut = `<section class="ra ra-sec ra-tut" id="tutorial">
  <div class="ra-wrap ra-tut-grid">
    <div class="ra-vid ra-rv"><iframe id="ra-video" title="PNTC Maritime Review tutorial" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
    <div class="ra-rv">
      <p class="ra-eyebrow">${slot('ra.tut.eyebrow', 'Video Tutorial')}</p>
      <h2 class="ra-h2">${slot('ra.tut.title', 'Get started')} <em>${slot('ra.tut.mark', 'in minutes')}</em></h2>
      <p class="ra-lead">${slot('ra.tut.lead', 'Watch the short tutorial to see how the app works, from your first question to your first badge.')}</p>
      <ol class="ra-steps">
        ${steps.map(([b, s], i) => `<li><div><b>${slot(`ra.step${i + 1}.title`, b)}</b><span>${slot(`ra.step${i + 1}.text`, s)}</span></div></li>`).join('\n        ')}
      </ol>
      <div class="ra-btns">
        ${playBtn('ra.tut.play')}
        <a class="ra-yt" id="ra-yt" data-c="ra.video.href" href="${VIDEO}" target="_blank" rel="noopener">${ICON.yt}${slot('ra.tut.yt', 'Watch on YouTube')}</a>
      </div>
    </div>
  </div>
</section>`;

const plans = [
  ['OIC Level', 'OIC Deck and Engine Review', '2,508', 'Gamified review for the Officer in Charge of a Navigational Watch and of an Engineering Watch.'],
  ['Management Level', 'MGMT Deck and Engine Review', '2,508', 'Gamified review for Management Level Officers in the deck and engine departments.'],
  ['GOC', 'GOC Review', '788', 'Gamified review for the General Operator’s Certificate for GMDSS Radio Communications.'],
];
const plan = `<section class="ra ra-sec ra-plans" id="plans">
  <div class="ra-wrap">
    <div class="ra-head center ra-rv">
      <p class="ra-eyebrow">${slot('ra.plans.eyebrow', 'Review Plans')}</p>
      <h2 class="ra-h2">${slot('ra.plans.title', 'Pay once.')} <em>${slot('ra.plans.mark', 'Review until you pass.')}</em></h2>
      <p class="ra-lead">${slot('ra.plans.lead', 'Every plan is a one-time payment with free unlimited renewals until you pass.')}</p>
    </div>
    <div class="ra-plan-grid">
      ${plans.map(([t, h, pr, p], i) => `<article class="ra-plan ra-rv${i === 1 ? ' hot' : ''}"><p class="ra-plan-tag">${slot(`ra.plan${i + 1}.tag`, t)}</p><h3>${slot(`ra.plan${i + 1}.title`, h)}</h3><div class="ra-price"><small>₱</small>${slot(`ra.plan${i + 1}.price`, pr)}</div><p class="ra-once">${slot(`ra.plan${i + 1}.once`, 'One-Time Payment')}</p><p>${slot(`ra.plan${i + 1}.text`, p)}</p><div class="ra-renew">${ICON.renew}${slot(`ra.plan${i + 1}.renew`, 'Free unlimited renewals until you pass')}</div><a class="ra-btn" href="${PLAY}" data-ra-play target="_blank" rel="noopener">${slot(`ra.plan${i + 1}.btn`, 'Get This Plan')}</a></article>`).join('\n      ')}
    </div>
    <p class="ra-plans-note ra-rv">${slot('ra.plans.note', 'The app is free to start. A premium plan unlocks all questions.')}</p>
  </div>
</section>`;

const lead = `<section class="ra ra-sec ra-lead-sec" id="team">
  <div class="ra-wrap ra-lead-grid">
    <div class="ra-rv">
      <div class="ra-lead-photo"><img src="${IMG}lead.jpg" alt="C/E Jeynard Moler J. Tan" width="640" height="657" loading="lazy"></div>
      <p class="ra-lead-name">${slot('ra.lead.name', 'C/E Jeynard Moler J. Tan, MScMarE')}</p>
      <p class="ra-lead-role">${slot('ra.lead.role', 'Lead Project Manager, PNTC Maritime Review')}</p>
    </div>
    <div class="ra-lead-text ra-rv">
      <p class="ra-eyebrow">${slot('ra.lead.eyebrow', 'Meet the Lead')}</p>
      <h2 class="ra-h2">${slot('ra.lead.title', 'Led by a')} <em>${slot('ra.lead.mark', 'Chief Engineer')}</em></h2>
      <p>${slot('ra.lead.p1', 'Chief Engineer Jeynard Moler J. Tan is a maritime leader, executive and technologist whose career joins more than a decade of shipboard operations with academic and corporate leadership.')}</p>
      <p>${slot('ra.lead.p2', 'He graduated Magna Cum Laude in Marine Engineering, holds a Master of Science in Maritime Education and is a Japan-trained SECOJ Fellow. He has served as Dean of Maritime Education in several institutions and as Chief Operating Officer, President and Vice President.')}</p>
      <p>${slot('ra.lead.p3', 'As Lead Project Manager of PNTC Maritime Review, he drives the digital approach that prepares the next generation of seafarers for academic and operational excellence.')}</p>
    </div>
  </div>
</section>`;

const cta = `<section class="ra ra-cta" id="contact-review">
  <div class="ra-wrap ra-cta-grid">
    <div class="ra-rv">
      <p class="ra-eyebrow">${slot('ra.cta.eyebrow', 'Start Today')}</p>
      <h2 class="ra-h2">${slot('ra.cta.title', 'Your license is')} <em>${slot('ra.cta.mark', 'one more level away')}</em></h2>
      <p class="ra-lead">${slot('ra.cta.lead', 'Do not leave your MARINA license to chance. Study on the go, track your progress and level up your career from your pocket.')}</p>
      <div class="ra-btns">${playBtn('ra.cta.play')}</div>
    </div>
    <div class="ra-contact ra-rv">
      <a data-c="ra.cta.phone.href" href="tel:+639171191087"><i>${ICON.phone}</i><span><small>${slot('ra.cta.phone.label', 'Call or Text')}</small>${slot('ra.cta.phone', '+63 917 119 1087')}</span></a>
      <a data-c="ra.cta.fb.href" href="https://www.facebook.com/pntcmaritimereview" target="_blank" rel="noopener"><i>${ICON.fb}</i><span><small>${slot('ra.cta.fb.label', 'Facebook')}</small>${slot('ra.cta.fb', 'facebook.com/pntcmaritimereview')}</span></a>
      <a data-c="ra.cta.email" href="mailto:maritimereview@mypntc.edu.ph"><i>${ICON.mail}</i><span><small>${slot('ra.cta.email.label', 'Email')}</small>${slot('ra.cta.email', 'maritimereview@mypntc.edu.ph')}</span></a>
    </div>
  </div>
</section>`;

const SCRIPT = `<script id="ra-js">
document.documentElement.classList.add('ra-js');
document.addEventListener('DOMContentLoaded',function(){
  /* every download button uses the Google Play address set on the hero button */
  var main=document.querySelector('[data-c="ra.play.href"]');
  if(main)document.querySelectorAll('[data-ra-play]').forEach(function(a){a.href=main.href;});
  /* the tutorial plays the YouTube link set on "Watch on YouTube" */
  var yt=document.getElementById('ra-yt'),fr=document.getElementById('ra-video');
  if(yt&&fr){var m=/(?:shorts\\/|youtu\\.be\\/|[?&]v=|embed\\/)([\\w-]{11})/.exec(yt.href);if(m)fr.src='https://www.youtube-nocookie.com/embed/'+m[1]+'?rel=0&playsinline=1';}
  /* screenshot slideshow: the current screen in front, its neighbours fanned out behind, plays by itself */
  var show=document.getElementById('ra-show');
  if(show){
    var slides=[].slice.call(show.querySelectorAll('.ra-slide')),dots=[].slice.call(document.querySelectorAll('.ra-dots button')),n=slides.length,cur=0,timer=null;
    var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    function go(i){cur=(i+n)%n;slides.forEach(function(el,k){var d=k-cur;if(d>n/2)d-=n;if(d<-n/2)d+=n;el.setAttribute('data-pos',Math.abs(d)>2?'off':String(d));el.setAttribute('aria-hidden',d!==0);});dots.forEach(function(b,k){b.classList.toggle('on',k===cur);});}
    function play(){stop();if(!still)timer=setInterval(function(){go(cur+1);},3800);}
    function stop(){if(timer){clearInterval(timer);timer=null;}}
    document.querySelectorAll('.ra-nav-btn').forEach(function(b){b.addEventListener('click',function(){go(cur+(+b.dataset.dir));play();});});
    dots.forEach(function(b){b.addEventListener('click',function(){go(+b.dataset.i);play();});});
    slides.forEach(function(el){el.addEventListener('click',function(){var p=el.getAttribute('data-pos');if(p!=='0'&&p!=='off'){go(+el.dataset.i);play();}});});
    show.addEventListener('mouseenter',stop);show.addEventListener('mouseleave',play);
    var sx=null;
    show.addEventListener('pointerdown',function(e){sx=e.clientX;});
    show.addEventListener('pointerup',function(e){if(sx===null)return;var dx=e.clientX-sx;sx=null;if(Math.abs(dx)>40){go(cur+(dx<0?1:-1));play();}});
    document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else play();});
    go(0);play();
  }
  /* reveal on scroll */
  var els=[].slice.call(document.querySelectorAll('.ra-rv'));
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){io.observe(e);});
  setTimeout(function(){els.forEach(function(e){if(e.getBoundingClientRect().top<innerHeight)e.classList.add('in');});},1500);
});
</script>`;

const body = [banner, hero, about, cover, feat, shots, tut, plan, lead, cta].join('\n\n');
const TITLE = 'PNTC Maritime Review App | MARINA Exam Reviewer for Seafarers';
const DESC = 'PNTC Maritime Review is a gamified Android reviewer for MARINA examinations, with OIC, Management Level and GOC review, daily streaks, badges and progress stats.';

const before = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
let h = before;
const a = h.search(/<section id="page-banner"|<section class="ra ra-hero"/);
const b = h.indexOf('<script src="/admin/chat-widget.js"');
if (a < 0 || b < a) throw new Error('review-app.html: page body not found');
h = h.slice(0, a) + body + '\n\n\n\n' + h.slice(b);
h = h.replace(/<style id="ra-css">[\s\S]*?<\/style>\n<script id="ra-js">[\s\S]*?<\/script>\n/, '');
h = h.replace('<meta name="description"', `<style id="ra-css">\n${CSS}\n</style>\n${SCRIPT}\n<meta name="description"`);
h = h.replace('<meta name="robots" content="noindex, follow">\n', '');
h = h.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);
h = h.replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*(">)/g, `$1${DESC}$2`);
h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${TITLE}">`);
h = h.replace(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="https://www.pntc.edu.ph/maritime/review-app-shot1.jpg">');
h = h.replace(/"name":"Maritime Review App for Seafarers \| PNTC Training Center","description":"[^"]*"/, `"name":"${TITLE}","description":"${DESC}"`);
// the Montserrat weights used on this page
h = h.replace('family=Montserrat:wght@300;400;500;600;700', 'family=Montserrat:wght@300;400;500;600;700;800');
h = C.preserveSlots(before, h);
fs.writeFileSync(FILE, h);
console.log('review-app.html built', h.length);
