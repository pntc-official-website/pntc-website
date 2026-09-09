'use strict';
/**
 * republish-to-github.js
 * Fetches every published post from Supabase and (re)commits its HTML to GitHub.
 * Also rebuilds the blog/index.html and the What's New section on each site's index.html.
 *
 * Run from the admin directory:
 *   node republish-to-github.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GH_TOKEN     = process.env.GITHUB_TOKEN;
const GH_OWNER     = process.env.GITHUB_OWNER;
const GH_REPO      = process.env.GITHUB_REPO;
const GH_BRANCH    = process.env.GITHUB_BRANCH || 'main';

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌  SUPABASE_URL / SUPABASE_SERVICE_KEY missing in .env'); process.exit(1); }
if (!GH_TOKEN || !GH_OWNER || !GH_REPO) { console.error('❌  GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO missing in .env'); process.exit(1); }

if (GH_TOKEN.startsWith('github_pat_')) {
  console.warn('⚠️  Warning: GITHUB_TOKEN looks like a fine-grained PAT (github_pat_...).');
  console.warn('    If this fails with 403, generate a Classic PAT at github.com/settings/tokens');
  console.warn('    with the "repo" scope, update .env and Vercel env vars, then re-run.\n');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SITES = {
  shs:      { id:'shs',      name:'PNTC Senior High School',          short:'SHS',        dir:'SHS',                      color:'#181D71', accent:'#FFCC00' },
  colleges: { id:'colleges', name:'PNTC Colleges',                    short:'Colleges',   dir:'PNTC Colleges',            color:'#0B2A6B', accent:'#C8960C' },
  maritime: { id:'maritime', name:'PNTC Maritime Training Center',    short:'Maritime',   dir:'Maritime Training Center', color:'#0D1B3E', accent:'#C8960C' },
  aman:     { id:'aman',     name:'Training Vessel Aman Sinaya',      short:'Aman Sinaya',dir:'Aman Sinaya',              color:'#0A1F35', accent:'#C8960C' }
};

// ── GitHub helpers ─────────────────────────────────────────────────────────────
async function ghGetFile(filePath) {
  const encoded = filePath.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encoded}?ref=${GH_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!res.ok) return null;
  return res.json();
}

async function ghPutFile(filePath, content, message, sha) {
  const encoded = filePath.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encoded}`;
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: GH_BRANCH
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub ${res.status}: ${err.slice(0, 300)}`);
  }
  return res.json();
}

// ── HTML builders (mirror server.js exactly) ───────────────────────────────────
function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function toBlogRelPath(url, site) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const p = `/site-files/${site.dir}/`;
  if (url.startsWith(p)) return '../' + url.slice(p.length);
  if (url.startsWith('/site-files/')) return '../' + url.split('/').slice(3).join('/');
  return url.startsWith('../') || url.startsWith('/') ? url : '../' + url;
}

function toSiteRelPath(url, site) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const p = `/site-files/${site.dir}/`;
  if (url.startsWith(p)) return url.slice(p.length);
  if (url.startsWith('/site-files/')) return url.split('/').slice(3).join('/');
  return url;
}

function buildPostHTML(post, site) {
  const date = new Date(post.publishedAt || post.createdAt)
    .toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const isSHS = site.id === 'shs';
  const fonts = isSHS
    ? `<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
    : `<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
  const titleFont   = isSHS ? `'Alfa Slab One', serif`   : `'Barlow Condensed', sans-serif`;
  const bodyFont    = isSHS ? `'Inter', sans-serif`       : `'Montserrat', sans-serif`;
  const titleWeight = isSHS ? `400` : `900`;
  const titleSize   = isSHS ? `clamp(1.8rem,4vw,3.2rem)` : `clamp(2rem,5vw,3.8rem)`;
  const tags = (post.tags||[]).map(t=>`<span class="tag">${escHtml(t)}</span>`).join('');
  const imgSrc = toBlogRelPath(post.featuredImage, site);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(post.title)} – ${escHtml(site.name)}</title>
<meta name="description" content="${escHtml(post.excerpt||post.title)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:${bodyFont};background:#fff;color:#222;overflow-x:hidden;line-height:1.7}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}
:root{--navy:${site.color};--accent:${site.accent}}
.nav{position:sticky;top:0;z-index:200;background:var(--navy);height:72px;display:flex;align-items:center;padding:0 clamp(1.25rem,4vw,3rem);gap:2rem;box-shadow:0 2px 20px rgba(0,0,0,.4)}
.nav-logo{height:44px;width:auto;object-fit:contain;flex-shrink:0}
.nav-links{display:flex;align-items:center;gap:2rem;margin-left:auto}
.nav-links a{font-size:.82rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.65);transition:color .2s}
.nav-links a:hover{color:var(--accent)}
.nav-cta{flex-shrink:0;padding:.5rem 1.4rem;background:var(--accent);color:#111;font-weight:800;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;border-radius:${isSHS?'20px':'2px'};transition:opacity .2s}
.nav-cta:hover{opacity:.85}
.crumb{background:#F6F7FB;padding:10px clamp(1.25rem,4vw,3rem);font-size:.78rem;color:#777;letter-spacing:.04em}
.crumb a{color:var(--navy);font-weight:600}
.crumb a:hover{text-decoration:underline}
.post-hero{background:var(--navy);padding:clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,3rem);position:relative;overflow:hidden}
.post-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.06) 0%,transparent 60%)}
.post-eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);margin-bottom:.75rem;position:relative;z-index:1}
.post-title{font-family:${titleFont};font-weight:${titleWeight};font-size:${titleSize};color:#fff;line-height:1.1;max-width:800px;position:relative;z-index:1;margin-bottom:1.25rem;letter-spacing:${isSHS?'.01em':'.02em'}}
.post-meta{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;color:rgba(255,255,255,.5);font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;position:relative;z-index:1}
.feat-img{width:100%;max-height:540px;object-fit:cover;display:block}
.post-wrap{max-width:820px;margin:0 auto;padding:clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,2rem)}
.post-wrap h2{font-family:${titleFont};font-weight:${titleWeight};font-size:clamp(1.4rem,3vw,2rem);color:var(--navy);margin:2.5rem 0 1rem;letter-spacing:.02em;${!isSHS?'text-transform:uppercase;':''}}
.post-wrap h3{font-size:1.1rem;font-weight:700;color:var(--navy);margin:2rem 0 .75rem}
.post-wrap p{font-size:1.05rem;line-height:1.85;color:#333;margin-bottom:1.25rem;font-weight:300}
.post-wrap ul,.post-wrap ol{margin:1.25rem 0 1.25rem 1.5rem;font-size:1.05rem;line-height:1.85;color:#333}
.post-wrap li{margin-bottom:.5rem}
.post-wrap img{border-radius:6px;margin:1.75rem 0}
.post-wrap blockquote{border-left:4px solid var(--accent);padding:1rem 1.5rem;margin:1.75rem 0;background:#FEFBF2;border-radius:0 6px 6px 0;font-style:italic;color:#555}
.post-wrap a{color:var(--navy);text-decoration:underline}
.post-wrap hr{border:none;border-top:1px solid #E8EBF2;margin:2.5rem 0}
.tags{max-width:820px;margin:0 auto;padding:0 clamp(1.25rem,4vw,2rem) 2.5rem;display:flex;flex-wrap:wrap;gap:.5rem}
.tag{background:#EEF2FF;color:var(--navy);font-size:.72rem;font-weight:700;padding:.35rem .85rem;border-radius:20px;letter-spacing:.06em;text-transform:uppercase}
.back-row{text-align:center;padding:0 1rem 3.5rem}
.back-btn{display:inline-flex;align-items:center;gap:.5rem;color:var(--navy);font-weight:700;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase;padding:.75rem 1.75rem;border:2px solid var(--navy);border-radius:${isSHS?'6px':'2px'};transition:all .2s}
.back-btn:hover{background:var(--navy);color:#fff}
footer{background:var(--navy);color:rgba(255,255,255,.45);text-align:center;padding:2.5rem 1.5rem;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase}
footer strong{color:var(--accent)}
</style>
</head>
<body>
<nav class="nav">
  <img src="../PNTC White Horizontal.png" alt="PNTC" class="nav-logo">
  <div class="nav-links">
    <a href="../index.html">Home</a>
    <a href="index.html">News &amp; Blog</a>
  </div>
  <a href="../index.html#contact" class="nav-cta">Inquire Now</a>
</nav>
<div class="crumb">
  <a href="../index.html">Home</a> &rsaquo; <a href="index.html">News &amp; Blog</a> &rsaquo; ${escHtml(post.title)}
</div>
<div class="post-hero">
  ${post.category?`<div class="post-eyebrow">${escHtml(post.category)}</div>`:''}
  <h1 class="post-title">${escHtml(post.title)}</h1>
  <div class="post-meta">
    <span>${escHtml(post.author)}</span><span>&middot;</span><span>${date}</span>
  </div>
</div>
${imgSrc?`<img src="${imgSrc}" alt="${escHtml(post.title)}" class="feat-img">`:''}
<article class="post-wrap">${post.content}</article>
${tags?`<div class="tags">${tags}</div>`:''}
<div class="back-row"><a href="index.html" class="back-btn">← Back to News &amp; Blog</a></div>
<footer>
  <strong>${escHtml(site.name)}</strong><br>
  Dasmariñas, Cavite, Philippines<br><br>
  &copy; ${new Date().getFullYear()} PNTC. All rights reserved.
</footer>
</body></html>`;
}

function buildBlogIndex(posts, site) {
  const published = posts.filter(p=>p.status==='published').sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
  const isSHS    = site.id==='shs';
  const titleFont= isSHS?`'Alfa Slab One', serif`:`'Barlow Condensed', sans-serif`;
  const bodyFont = isSHS?`'Inter', sans-serif`:`'Montserrat', sans-serif`;
  const fonts    = isSHS
    ?`<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
    :`<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
  const cards = published.map(p=>{
    const date=new Date(p.publishedAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
    const imgSrc = toBlogRelPath(p.featuredImage, site);
    return `<a href="${p.slug}.html" class="card">
      ${imgSrc?`<div class="card-img" style="background-image:url('${imgSrc}')"></div>`:`<div class="card-img card-img-placeholder"></div>`}
      <div class="card-body">
        ${p.category?`<span class="card-cat">${escHtml(p.category)}</span>`:''}
        <h2 class="card-title">${escHtml(p.title)}</h2>
        ${p.excerpt?`<p class="card-excerpt">${escHtml(p.excerpt)}</p>`:''}
        <div class="card-meta">${escHtml(p.author)} &middot; ${date}</div>
      </div></a>`;
  }).join('');
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>News &amp; Blog – ${escHtml(site.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:${bodyFont};background:#F6F7FB;color:#222;overflow-x:hidden}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}
:root{--navy:${site.color};--accent:${site.accent}}
.nav{position:sticky;top:0;z-index:200;background:var(--navy);height:72px;display:flex;align-items:center;padding:0 clamp(1.25rem,4vw,3rem);gap:2rem;box-shadow:0 2px 20px rgba(0,0,0,.4)}
.nav-logo{height:44px;width:auto;object-fit:contain;flex-shrink:0}
.nav-links{display:flex;align-items:center;gap:2rem;margin-left:auto}
.nav-links a{font-size:.82rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.65);transition:color .2s}
.nav-links a:hover{color:var(--accent)}
.nav-cta{flex-shrink:0;padding:.5rem 1.4rem;background:var(--accent);color:#111;font-weight:800;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;border-radius:${isSHS?'20px':'2px'}}
.page-hero{background:var(--navy);padding:clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,3rem);overflow:hidden;position:relative}
.page-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,transparent 55%)}
.eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);margin-bottom:.6rem;position:relative;z-index:1}
.page-title{font-family:${titleFont};font-weight:${isSHS?400:900};font-size:clamp(2rem,5vw,3.5rem);color:#fff;position:relative;z-index:1;letter-spacing:.02em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem;max-width:1200px;margin:0 auto;padding:clamp(2rem,4vw,3rem) clamp(1.25rem,4vw,2rem)}
.card{background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,0,0,.07);transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 28px rgba(0,0,0,.12)}
.card-img{height:200px;background-size:cover;background-position:center;background-color:#E8EBF2}
.card-img-placeholder{background:linear-gradient(135deg,var(--navy),rgba(0,0,0,.4))}
.card-body{padding:1.5rem;display:flex;flex-direction:column;flex:1}
.card-cat{font-size:.68rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:.5rem}
.card-title{font-family:${titleFont};font-weight:${isSHS?400:800};font-size:1.25rem;color:var(--navy);line-height:1.2;margin-bottom:.75rem;flex:1}
.card-excerpt{font-size:.88rem;line-height:1.6;color:#666;margin-bottom:1rem;font-weight:300;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-meta{font-size:.75rem;color:#999;letter-spacing:.04em;margin-top:auto}
.empty{text-align:center;color:#999;padding:5rem 2rem;font-size:1rem}
footer{background:var(--navy);color:rgba(255,255,255,.4);text-align:center;padding:2.5rem 1.5rem;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase}
footer strong{color:var(--accent)}
</style></head><body>
<nav class="nav">
  <img src="../PNTC White Horizontal.png" alt="PNTC" class="nav-logo">
  <div class="nav-links"><a href="../index.html">Home</a></div>
  <a href="../index.html#contact" class="nav-cta">Inquire Now</a>
</nav>
<div class="page-hero"><div class="eyebrow">Latest Updates</div><h1 class="page-title">News &amp; Blog</h1></div>
<div class="grid">${cards}</div>
${published.length===0?`<div class="empty">No posts yet. Check back soon!</div>`:''}
<footer><strong>${escHtml(site.name)}</strong><br>Dasmariñas, Cavite, Philippines<br><br>&copy; ${new Date().getFullYear()} PNTC. All rights reserved.</footer>
</body></html>`;
}

function buildCollegesNewsBlock(posts, site) {
  if (!posts.length) return '';
  const SVG = `<svg viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/></svg>`;
  const cards = posts.map((p, i) => {
    const date = new Date(p.publishedAt).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'});
    const img = toSiteRelPath(p.featuredImage, site);
    const thumb = img
      ? `<div class="news-thumb"><img src="${img}" alt="${escHtml(p.title)}" style="object-position:center top"></div>`
      : `<div class="news-thumb" style="background:linear-gradient(135deg,#0B2A6B,#061c4a)"></div>`;
    const delay = i > 0 ? ` style="transition-delay:${i*0.1}s"` : '';
    return `<article class="news-card reveal"${delay}>${thumb}<div class="news-body">${p.category?`<span class="news-tag">${escHtml(p.category)}</span>`:''}<div class="news-date">${escHtml(date)}</div><h3>${escHtml(p.title)}</h3><p>${escHtml(p.excerpt||'')}</p><a href="blog/${p.slug}.html" class="news-link">Read More ${SVG}</a></div></article>`;
  }).join('\n');
  return `  <div class="news-grid">${cards}</div>`;
}

function buildSHSNewsBlock(posts, site) {
  if (!posts.length) return '';
  const cards = posts.map(p => {
    const date = new Date(p.publishedAt).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
    const img = toSiteRelPath(p.featuredImage, site);
    const thumb = img
      ? `<div class="ev-thumb-wrap"><img src="${img}" alt="${escHtml(p.title)}" style="width:100%;height:100%;object-fit:cover"></div>`
      : `<div class="ev-thumb-wrap" style="background:linear-gradient(135deg,#181D71,#0d1245)"></div>`;
    return `<a href="blog/${p.slug}.html" class="ev-card" style="text-decoration:none;color:inherit;cursor:pointer">${thumb}<div class="ev-body-wrap"><div class="ev-date">${escHtml(date)}</div><div class="ev-title">${escHtml(p.title)}</div><div class="ev-text">${escHtml(p.excerpt||'')}</div>${p.category?`<span class="ev-tag">${escHtml(p.category)}</span>`:''}</div></a>`;
  }).join('\n');
  return `  <div class="events-grid" style="margin-bottom:1rem"><div class="events-row">${cards}</div></div>
  <div style="text-align:right;padding:0 0 16px"><a href="blog/index.html" style="font-size:13px;font-weight:700;color:#181D71;letter-spacing:.06em;text-transform:uppercase">See all posts →</a></div>`;
}

function buildDefaultNewsBlock(posts, site) {
  if (!posts.length) return '';
  const cards = posts.map(p => {
    const date = new Date(p.publishedAt).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'});
    const img = toSiteRelPath(p.featuredImage, site);
    return `<a href="blog/${p.slug}.html" class="news-card" style="text-decoration:none;color:inherit">${img?`<div class="news-thumb"><img src="${img}" alt="${escHtml(p.title)}"></div>`:`<div class="news-thumb"></div>`}<div class="news-body">${p.category?`<span class="news-tag">${escHtml(p.category)}</span>`:''}<div class="news-date">${escHtml(date)}</div><h3>${escHtml(p.title)}</h3><p>${escHtml(p.excerpt||'')}</p></div></a>`;
  }).join('\n');
  return `  <div class="news-grid">${cards}</div>`;
}

async function updateWhatsNew(allPosts, site) {
  const filePath = `${site.dir}/index.html`;
  const existing = await ghGetFile(filePath);
  if (!existing) { console.log(`  ⚠️  ${filePath} not found in GitHub — skipping What's New update`); return; }
  let html = Buffer.from(existing.content, 'base64').toString('utf8');
  const START = '<!-- PNTC_NEWS_START -->';
  const END   = '<!-- PNTC_NEWS_END -->';
  const si = html.indexOf(START), ei = html.indexOf(END);
  if (si === -1 || ei === -1) { console.log(`  ⚠️  News markers not found in ${filePath} — skipping`); return; }
  const top3 = allPosts.slice().sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt)).slice(0,3);
  let block;
  if (site.id === 'shs') block = buildSHSNewsBlock(top3, site);
  else if (site.id === 'colleges') block = buildCollegesNewsBlock(top3, site);
  else block = buildDefaultNewsBlock(top3, site);
  html = html.slice(0, si) + START + '\n' + block + '\n  ' + END + html.slice(ei + END.length);
  await ghPutFile(filePath, html, `Update What's New: ${site.name}`, existing.sha);
  console.log(`  ✅  Updated What's New section in ${filePath}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  PNTC Republish to GitHub\n');
  console.log(`   Repo   : ${GH_OWNER}/${GH_REPO} (branch: ${GH_BRANCH})`);
  console.log(`   Supabase: ${SUPABASE_URL}\n`);

  // Fetch all published posts
  const { data: allPosts, error } = await supabase
    .from('posts').select('*').eq('status', 'published')
    .order('publishedAt', { ascending: false });

  if (error) { console.error('❌  Supabase error:', error.message); process.exit(1); }
  if (!allPosts || !allPosts.length) { console.log('ℹ️  No published posts found in Supabase.'); return; }

  console.log(`Found ${allPosts.length} published post(s):\n`);
  allPosts.forEach(p => console.log(`  • [${(p.sites||[]).join(', ')}] ${p.title}`));
  console.log('');

  // Group posts by site
  const bySite = {};
  for (const post of allPosts) {
    for (const siteId of (post.sites || [])) {
      if (!SITES[siteId]) continue;
      if (!bySite[siteId]) bySite[siteId] = [];
      bySite[siteId].push(post);
    }
  }

  for (const [siteId, sitePosts] of Object.entries(bySite)) {
    const site = SITES[siteId];
    console.log(`\n── ${site.name} (${sitePosts.length} post(s)) ──`);

    for (const post of sitePosts) {
      const postFilePath = `${site.dir}/blog/${post.slug}.html`;
      try {
        const postHtml = buildPostHTML(post, site);
        const existing = await ghGetFile(postFilePath);
        await ghPutFile(postFilePath, postHtml, `Publish: ${post.title}`, existing?.sha);
        console.log(`  ✅  ${postFilePath}`);
      } catch (e) {
        console.error(`  ❌  ${postFilePath}: ${e.message}`);
      }
    }

    // Rebuild blog index
    try {
      const indexFilePath = `${site.dir}/blog/index.html`;
      const indexHtml     = buildBlogIndex(sitePosts, site);
      const existIdx      = await ghGetFile(indexFilePath);
      await ghPutFile(indexFilePath, indexHtml, `Update blog index: ${site.name}`, existIdx?.sha);
      console.log(`  ✅  ${indexFilePath} (blog index)`);
    } catch (e) {
      console.error(`  ❌  blog index: ${e.message}`);
    }

    // Update What's New on site homepage
    try {
      await updateWhatsNew(sitePosts, site);
    } catch (e) {
      console.error(`  ❌  What's New: ${e.message}`);
    }
  }

  console.log('\n✅  Done! Vercel will auto-redeploy in ~30 seconds.\n');
}

main().catch(e => { console.error('\n❌  Fatal:', e.message); process.exit(1); });
