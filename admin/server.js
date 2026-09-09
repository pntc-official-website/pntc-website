'use strict';
const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = 3000;

// ── Paths ──────────────────────────────────────────────────────
const WEBSITE_ROOT = path.resolve(__dirname, '..');
const DATA_DIR     = path.join(__dirname, 'data');
const POSTS_FILE   = path.join(DATA_DIR, 'posts.json');

// ── Site Config ────────────────────────────────────────────────
const SITES = {
  shs: {
    id:     'shs',
    name:   'PNTC Senior High School',
    short:  'SHS',
    dir:    'SHS',
    color:  '#181D71',
    accent: '#FFCC00',
    font:   'shs'
  },
  colleges: {
    id:     'colleges',
    name:   'PNTC Colleges',
    short:  'Colleges',
    dir:    'PNTC Colleges',
    color:  '#0B2A6B',
    accent: '#C8960C',
    font:   'barlow'
  },
  maritime: {
    id:     'maritime',
    name:   'PNTC Maritime Training Center',
    short:  'Maritime',
    dir:    'Maritime Training Center',
    color:  '#0D1B3E',
    accent: '#C8960C',
    font:   'barlow'
  },
  aman: {
    id:     'aman',
    name:   'Training Vessel Aman Sinaya',
    short:  'Aman Sinaya',
    dir:    'Aman Sinaya',
    color:  '#0A1F35',
    accent: '#C8960C',
    font:   'barlow'
  }
};

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/site-files', express.static(WEBSITE_ROOT));

// ── Data helpers ───────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR))   fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, '[]', 'utf8');

function readPosts()       { return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8')); }
function writePosts(posts) { fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8'); }

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'post';
}

function ensureUniqSlug(slug, existingPosts, excludeId) {
  let base = slug, n = 1;
  while (existingPosts.some(p => p.slug === slug && p.id !== excludeId)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

// ── Upload storage (per-site) ──────────────────────────────────
function siteStorage(subFolder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const site = SITES[req.params.site || req.body.site];
      if (!site) return cb(new Error('Unknown site'));
      const dir = path.join(WEBSITE_ROOT, site.dir, 'uploads', subFolder || '');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, Date.now() + '-' + Math.random().toString(36).slice(2,7) + ext);
    }
  });
}

const replaceUpload = multer({ storage: multer.memoryStorage() });

// ══════════════════════════════════════════════════════════════
//  Auth
// ══════════════════════════════════════════════════════════════
const ADMIN_EMAIL     = process.env.ADMIN_EMAIL    || 'admissions@mypntc.edu.ph';
const _ADMIN_RAW      = process.env.ADMIN_PASSWORD || 'TheBestOf2026!';
const ADMIN_PASS_HASH = crypto.createHash('sha256').update('pntc2026:' + _ADMIN_RAW).digest('hex');

const sessions = new Map(); // token → expiresAt (ms)

function genToken()     { return crypto.randomBytes(32).toString('hex'); }
function parseCookie(r) { const m = (r.headers.cookie||'').match(/pntc_session=([^;]+)/); return m?m[1]:null; }
function isAuth(req) {
  const t = parseCookie(req);
  if (!t || !sessions.has(t)) return false;
  if (sessions.get(t) < Date.now()) { sessions.delete(t); return false; }
  return true;
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const hash = crypto.createHash('sha256').update('pntc2026:' + (password || '')).digest('hex');
  if ((email || '').trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || hash !== ADMIN_PASS_HASH) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token  = genToken();
  const maxAge = 8 * 3600;
  sessions.set(token, Date.now() + maxAge * 1000);
  res.setHeader('Set-Cookie', `pntc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`);
  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  const t = parseCookie(req); if (t) sessions.delete(t);
  res.setHeader('Set-Cookie', 'pntc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/auth/check', (req, res) => res.json({ ok: isAuth(req) }));

// Protect all /api/* except /api/auth/*
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  if (!isAuth(req)) return res.status(401).json({ error: 'Not authenticated' });
  next();
});

// ══════════════════════════════════════════════════════════════
//  API — Sites
// ══════════════════════════════════════════════════════════════
app.get('/api/sites', (_req, res) => res.json(Object.values(SITES)));

// ══════════════════════════════════════════════════════════════
//  API — Posts
// ══════════════════════════════════════════════════════════════
app.get('/api/posts', (_req, res) => {
  const posts = readPosts().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(posts);
});

app.get('/api/posts/:id', (req, res) => {
  const post = readPosts().find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

app.post('/api/posts', (req, res) => {
  const posts = readPosts();
  const now   = new Date().toISOString();
  const slug  = ensureUniqSlug(slugify(req.body.title || 'untitled'), posts, null);
  const post  = {
    id:            uuidv4(),
    title:         req.body.title         || 'Untitled Post',
    slug,
    excerpt:       req.body.excerpt       || '',
    content:       req.body.content       || '',
    featuredImage: req.body.featuredImage || '',
    sites:         req.body.sites         || [],
    status:        req.body.status        || 'draft',
    category:      req.body.category      || '',
    tags:          req.body.tags          || [],
    author:        req.body.author        || 'PNTC Communications',
    createdAt:     now,
    updatedAt:     now,
    publishedAt:   req.body.status === 'published' ? now : null
  };
  posts.push(post);
  writePosts(posts);
  res.json(post);
});

app.put('/api/posts/:id', (req, res) => {
  const posts = readPosts();
  const idx   = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const current = posts[idx];
  const now     = new Date().toISOString();

  if (req.body.title && req.body.title !== current.title) {
    req.body.slug = ensureUniqSlug(slugify(req.body.title), posts, current.id);
  }

  posts[idx] = {
    ...current,
    ...req.body,
    id:        current.id,
    createdAt: current.createdAt,
    updatedAt: now,
    publishedAt: req.body.status === 'published' && !current.publishedAt ? now : current.publishedAt
  };

  writePosts(posts);
  res.json(posts[idx]);
});

app.delete('/api/posts/:id', (req, res) => {
  let posts = readPosts();
  posts = posts.filter(p => p.id !== req.params.id);
  writePosts(posts);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  API — Publish
// ══════════════════════════════════════════════════════════════
app.post('/api/publish/:id', (req, res) => {
  const posts = readPosts();
  const idx   = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const now = new Date().toISOString();

  // Mark as published BEFORE processing so all site filters include it
  posts[idx].status      = 'published';
  posts[idx].publishedAt = posts[idx].publishedAt || now;
  posts[idx].updatedAt   = now;
  const post = posts[idx];

  const results = [];

  for (const siteId of post.sites) {
    const site = SITES[siteId];
    if (!site) continue;

    const siteDir = path.join(WEBSITE_ROOT, site.dir);
    const blogDir = path.join(siteDir, 'blog');
    fs.mkdirSync(blogDir, { recursive: true });

    const postForSite = { ...post, featuredImage: resolveImageToSite(post.featuredImage, site) };

    // Write post HTML
    const html     = buildPostHTML(postForSite, site);
    const filename = `${post.slug}.html`;
    fs.writeFileSync(path.join(blogDir, filename), html, 'utf8');

    // Collect all published posts for this site with resolved image paths
    const sitePosts = posts
      .filter(p => p.sites.includes(siteId) && p.status === 'published')
      .map(p => ({ ...p, featuredImage: resolveImageToSite(p.featuredImage, site) }));

    // Regenerate blog/index.html listing
    const indexHtml = buildBlogIndex(sitePosts, site);
    fs.writeFileSync(path.join(blogDir, 'index.html'), indexHtml, 'utf8');

    // Update the site's What's New section in index.html
    updateWhatsNew(sitePosts, site, siteDir);

    results.push({ site: site.name, file: `${site.dir}/blog/${filename}` });
  }

  writePosts(posts);
  res.json({ ok: true, published: results, post });
});

// ══════════════════════════════════════════════════════════════
//  API — Image upload (featured image with site param in body)
// ══════════════════════════════════════════════════════════════
app.post('/api/upload/featured', (req, res, next) => {
  const mem = multer({ storage: multer.memoryStorage() }).single('image');
  mem(req, res, err => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ error: 'No image' });

    const siteId = req.body.site;
    const site   = SITES[siteId];
    if (!site) return res.status(400).json({ error: 'Unknown site' });

    const dir = path.join(WEBSITE_ROOT, site.dir, 'uploads', 'featured');
    fs.mkdirSync(dir, { recursive: true });
    const ext      = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const filename = Date.now() + '-' + Math.random().toString(36).slice(2,6) + ext;
    fs.writeFileSync(path.join(dir, filename), req.file.buffer);

    const url = `/site-files/${encodeURIComponent(site.dir)}/uploads/featured/${filename}`;
    res.json({ url, filename, siteDir: site.dir });
  });
});

// ══════════════════════════════════════════════════════════════
//  API — Images per site
// ══════════════════════════════════════════════════════════════
app.get('/api/images/:site', (req, res) => {
  const site = SITES[req.params.site];
  if (!site) return res.status(404).json({ error: 'Unknown site' });

  const siteDir = path.join(WEBSITE_ROOT, site.dir);
  const images  = [];
  const IMG_RE  = /\.(jpe?g|png|gif|webp|svg)$/i;

  function walk(dir, rel) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath  = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (IMG_RE.test(entry.name)) {
        const stat = fs.statSync(fullPath);
        images.push({
          filename: entry.name,
          relPath,
          url:  `/site-files/${encodeURIComponent(site.dir)}/${relPath.replace(/\\/g, '/')}`,
          size: stat.size,
          mtime: stat.mtimeMs
        });
      }
    }
  }

  walk(siteDir, '');
  images.sort((a, b) => b.mtime - a.mtime);
  res.json(images);
});

// Replace an existing image in-place
app.post('/api/images/:site/replace', replaceUpload.single('image'), (req, res) => {
  const site = SITES[req.params.site];
  if (!site || !req.file || !req.body.relPath) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const targetPath = path.join(WEBSITE_ROOT, site.dir, req.body.relPath);
  if (!fs.existsSync(path.dirname(targetPath))) {
    return res.status(404).json({ error: 'Target directory not found' });
  }
  fs.writeFileSync(targetPath, req.file.buffer);
  res.json({ ok: true, url: `/site-files/${encodeURIComponent(site.dir)}/${req.body.relPath}` });
});

// ══════════════════════════════════════════════════════════════
//  HTML Generators
// ══════════════════════════════════════════════════════════════
function buildPostHTML(post, site) {
  const date = new Date(post.publishedAt || post.createdAt)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const isSHS = site.id === 'shs';

  const fonts = isSHS
    ? `<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
    : `<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;

  const titleFont   = isSHS ? `'Alfa Slab One', serif` : `'Barlow Condensed', sans-serif`;
  const bodyFont    = isSHS ? `'Inter', sans-serif`    : `'Montserrat', sans-serif`;
  const titleWeight = isSHS ? `400` : `900`;
  const titleSize   = isSHS ? `clamp(1.8rem,4vw,3.2rem)` : `clamp(2rem,5vw,3.8rem)`;

  const logoPath = '../PNTC White Horizontal.png';
  const blogPath = 'index.html';
  const homePath = '../index.html';

  const tags = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(post.title)} – ${escHtml(site.name)}</title>
<meta name="description" content="${escHtml(post.excerpt || post.title)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:${bodyFont};background:#fff;color:#222;overflow-x:hidden;line-height:1.7}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
:root{--navy:${site.color};--accent:${site.accent}}
.nav{position:sticky;top:0;z-index:200;background:var(--navy);height:72px;display:flex;align-items:center;padding:0 clamp(1.25rem,4vw,3rem);gap:2rem;box-shadow:0 2px 20px rgba(0,0,0,.4)}
.nav-logo{height:44px;width:auto;object-fit:contain;flex-shrink:0}
.nav-links{display:flex;align-items:center;gap:2rem;margin-left:auto}
.nav-links a{font-size:.82rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.65);transition:color .2s}
.nav-links a:hover{color:var(--accent)}
.nav-cta{flex-shrink:0;padding:.5rem 1.4rem;background:var(--accent);color:#111;font-weight:800;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;border-radius:${isSHS ? '20px' : '2px'};transition:opacity .2s}
.nav-cta:hover{opacity:.85}
.crumb{background:#F6F7FB;padding:10px clamp(1.25rem,4vw,3rem);font-size:.78rem;color:#777;letter-spacing:.04em}
.crumb a{color:var(--navy);font-weight:600}
.crumb a:hover{text-decoration:underline}
.post-hero{background:var(--navy);padding:clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,3rem);position:relative;overflow:hidden}
.post-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.06) 0%,transparent 60%)}
.post-eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);margin-bottom:.75rem;position:relative;z-index:1}
.post-title{font-family:${titleFont};font-weight:${titleWeight};font-size:${titleSize};color:#fff;line-height:1.1;max-width:800px;position:relative;z-index:1;margin-bottom:1.25rem;letter-spacing:${isSHS ? '.01em' : '.02em'}}
.post-meta{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;color:rgba(255,255,255,.5);font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;position:relative;z-index:1}
.feat-img{width:100%;max-height:540px;object-fit:cover;display:block}
.post-wrap{max-width:820px;margin:0 auto;padding:clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,2rem)}
.post-wrap h2{font-family:${titleFont};font-weight:${titleWeight};font-size:clamp(1.4rem,3vw,2rem);color:var(--navy);margin:2.5rem 0 1rem;letter-spacing:.02em;${!isSHS ? 'text-transform:uppercase;' : ''}}
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
.back-btn{display:inline-flex;align-items:center;gap:.5rem;color:var(--navy);font-weight:700;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase;padding:.75rem 1.75rem;border:2px solid var(--navy);border-radius:${isSHS ? '6px' : '2px'};transition:all .2s}
.back-btn:hover{background:var(--navy);color:#fff}
footer{background:var(--navy);color:rgba(255,255,255,.45);text-align:center;padding:2.5rem 1.5rem;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase}
footer strong{color:var(--accent)}
</style>
</head>
<body>
<nav class="nav">
  <img src="${logoPath}" alt="PNTC" class="nav-logo">
  <div class="nav-links">
    <a href="${homePath}">Home</a>
    <a href="${blogPath}">News &amp; Blog</a>
  </div>
  <a href="${homePath}#contact" class="nav-cta">Inquire Now</a>
</nav>
<div class="crumb">
  <a href="${homePath}">Home</a> &rsaquo; <a href="${blogPath}">News &amp; Blog</a> &rsaquo; ${escHtml(post.title)}
</div>
<div class="post-hero">
  ${post.category ? `<div class="post-eyebrow">${escHtml(post.category)}</div>` : ''}
  <h1 class="post-title">${escHtml(post.title)}</h1>
  <div class="post-meta">
    <span>${escHtml(post.author)}</span>
    <span>&middot;</span>
    <span>${date}</span>
  </div>
</div>
${post.featuredImage ? `<img src="${toBlogRelPath(post.featuredImage, site)}" alt="${escHtml(post.title)}" class="feat-img">` : ''}
<article class="post-wrap">
  ${post.content}
</article>
${tags ? `<div class="tags">${tags}</div>` : ''}
<div class="back-row">
  <a href="${blogPath}" class="back-btn">← Back to News &amp; Blog</a>
</div>
<footer>
  <strong>${escHtml(site.name)}</strong><br>
  Dasmariñas, Cavite, Philippines<br><br>
  &copy; ${new Date().getFullYear()} PNTC. All rights reserved.
</footer>
</body>
</html>`;
}

function buildBlogIndex(posts, site) {
  const published = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const isSHS     = site.id === 'shs';
  const titleFont = isSHS ? `'Alfa Slab One', serif` : `'Barlow Condensed', sans-serif`;
  const bodyFont  = isSHS ? `'Inter', sans-serif`    : `'Montserrat', sans-serif`;
  const fonts     = isSHS
    ? `<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
    : `<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;

  const cards = published.map(p => {
    const date = new Date(p.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return `
    <a href="${p.slug}.html" class="card">
      ${p.featuredImage ? `<div class="card-img" style="background-image:url('${toBlogRelPath(p.featuredImage, site)}')"></div>` : `<div class="card-img card-img-placeholder"></div>`}
      <div class="card-body">
        ${p.category ? `<span class="card-cat">${escHtml(p.category)}</span>` : ''}
        <h2 class="card-title">${escHtml(p.title)}</h2>
        ${p.excerpt ? `<p class="card-excerpt">${escHtml(p.excerpt)}</p>` : ''}
        <div class="card-meta">${escHtml(p.author)} &middot; ${date}</div>
      </div>
    </a>`;
  }).join('');

  const empty = published.length === 0
    ? `<div class="empty">No posts yet. Check back soon!</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>News &amp; Blog – ${escHtml(site.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:${bodyFont};background:#F6F7FB;color:#222;overflow-x:hidden}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}
:root{--navy:${site.color};--accent:${site.accent}}
.nav{position:sticky;top:0;z-index:200;background:var(--navy);height:72px;display:flex;align-items:center;padding:0 clamp(1.25rem,4vw,3rem);gap:2rem;box-shadow:0 2px 20px rgba(0,0,0,.4)}
.nav-logo{height:44px;width:auto;object-fit:contain;flex-shrink:0}
.nav-links{display:flex;align-items:center;gap:2rem;margin-left:auto}
.nav-links a{font-size:.82rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.65);transition:color .2s}
.nav-links a:hover{color:var(--accent)}
.nav-cta{flex-shrink:0;padding:.5rem 1.4rem;background:var(--accent);color:#111;font-weight:800;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;border-radius:${isSHS ? '20px' : '2px'}}
.page-hero{background:var(--navy);padding:clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,3rem);overflow:hidden;position:relative}
.page-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,transparent 55%)}
.eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);margin-bottom:.6rem;position:relative;z-index:1}
.page-title{font-family:${titleFont};font-weight:${isSHS ? 400 : 900};font-size:clamp(2rem,5vw,3.5rem);color:#fff;position:relative;z-index:1;letter-spacing:.02em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem;max-width:1200px;margin:0 auto;padding:clamp(2rem,4vw,3rem) clamp(1.25rem,4vw,2rem)}
.card{background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,0,0,.07);transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 28px rgba(0,0,0,.12)}
.card-img{height:200px;background-size:cover;background-position:center;background-color:#E8EBF2}
.card-img-placeholder{background:linear-gradient(135deg,var(--navy),rgba(0,0,0,.4))}
.card-body{padding:1.5rem;display:flex;flex-direction:column;flex:1}
.card-cat{font-size:.68rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:.5rem}
.card-title{font-family:${titleFont};font-weight:${isSHS ? 400 : 800};font-size:1.25rem;color:var(--navy);line-height:1.2;margin-bottom:.75rem;flex:1}
.card-excerpt{font-size:.88rem;line-height:1.6;color:#666;margin-bottom:1rem;font-weight:300;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-meta{font-size:.75rem;color:#999;letter-spacing:.04em;margin-top:auto}
.empty{text-align:center;color:#999;padding:5rem 2rem;font-size:1rem}
footer{background:var(--navy);color:rgba(255,255,255,.4);text-align:center;padding:2.5rem 1.5rem;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase}
footer strong{color:var(--accent)}
</style>
</head>
<body>
<nav class="nav">
  <img src="../PNTC White Horizontal.png" alt="PNTC" class="nav-logo">
  <div class="nav-links">
    <a href="../index.html">Home</a>
  </div>
  <a href="../index.html#contact" class="nav-cta">Inquire Now</a>
</nav>
<div class="page-hero">
  <div class="eyebrow">Latest Updates</div>
  <h1 class="page-title">News &amp; Blog</h1>
</div>
<div class="grid">
  ${cards}
</div>
${empty}
<footer>
  <strong>${escHtml(site.name)}</strong><br>
  Dasmariñas, Cavite, Philippines<br><br>
  &copy; ${new Date().getFullYear()} PNTC. All rights reserved.
</footer>
</body>
</html>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Image path helpers ─────────────────────────────────────────
function toSiteRelPath(adminUrl, site) {
  if (!adminUrl) return '';
  const prefix  = `/site-files/${encodeURIComponent(site.dir)}/`;
  const prefix2 = `/site-files/${site.dir}/`;
  if (adminUrl.startsWith(prefix))  return decodeURIComponent(adminUrl.slice(prefix.length));
  if (adminUrl.startsWith(prefix2)) return adminUrl.slice(prefix2.length);
  return adminUrl;
}

function toBlogRelPath(adminUrl, site) {
  const rel = toSiteRelPath(adminUrl, site);
  if (!rel || rel.startsWith('http') || rel.startsWith('../')) return rel;
  return '../' + rel;
}

function resolveImageToSite(adminUrl, targetSite) {
  if (!adminUrl) return '';
  for (const site of Object.values(SITES)) {
    const prefix  = `/site-files/${encodeURIComponent(site.dir)}/`;
    const prefix2 = `/site-files/${site.dir}/`;
    let rel;
    if (adminUrl.startsWith(prefix))  rel = decodeURIComponent(adminUrl.slice(prefix.length));
    else if (adminUrl.startsWith(prefix2)) rel = adminUrl.slice(prefix2.length);
    if (rel === undefined) continue;
    if (site.dir === targetSite.dir) return adminUrl;
    const srcPath  = path.join(WEBSITE_ROOT, site.dir, rel);
    const filename = path.basename(rel);
    const destDir  = path.join(WEBSITE_ROOT, targetSite.dir, 'uploads', 'featured');
    fs.mkdirSync(destDir, { recursive: true });
    if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, path.join(destDir, filename));
    return `/site-files/${encodeURIComponent(targetSite.dir)}/uploads/featured/${filename}`;
  }
  return adminUrl;
}

// ── What's New updater ─────────────────────────────────────────
function updateWhatsNew(allPosts, site, siteDir) {
  const indexPath = path.join(siteDir, 'index.html');
  if (!fs.existsSync(indexPath)) return;

  let html = fs.readFileSync(indexPath, 'utf8');
  const START = '<!-- PNTC_NEWS_START -->';
  const END   = '<!-- PNTC_NEWS_END -->';
  const si    = html.indexOf(START);
  const ei    = html.indexOf(END);
  if (si === -1 || ei === -1) return;

  const published = allPosts
    .slice()
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);

  let block;
  if (site.id === 'shs')           block = buildSHSNewsBlock(published, site);
  else if (site.id === 'colleges') block = buildCollegesNewsBlock(published, site);
  else                             block = buildDefaultNewsBlock(published, site);

  html = html.slice(0, si) + START + '\n' + block + '\n  ' + END + html.slice(ei + END.length);
  fs.writeFileSync(indexPath, html, 'utf8');
}

function buildSHSNewsBlock(posts, site) {
  if (!posts.length) return '';
  const cards = posts.map(p => {
    const date  = new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const img   = toSiteRelPath(p.featuredImage, site);
    const thumb = img
      ? `<div class="ev-thumb-wrap"><img src="${img}" alt="${escHtml(p.title)}" style="width:100%;height:100%;object-fit:cover"></div>`
      : `<div class="ev-thumb-wrap" style="background:linear-gradient(135deg,#181D71,#0d1245)"></div>`;
    return `      <a href="blog/${p.slug}.html" class="ev-card" style="text-decoration:none;color:inherit;cursor:pointer">
        ${thumb}
        <div class="ev-body-wrap">
          <div class="ev-date">${escHtml(date)}</div>
          <div class="ev-title">${escHtml(p.title)}</div>
          <div class="ev-text">${escHtml(p.excerpt || '')}</div>
          ${p.category ? `<span class="ev-tag">${escHtml(p.category)}</span>` : ''}
        </div>
      </a>`;
  }).join('\n');

  return `  <div class="events-grid" style="margin-bottom:1rem">
    <div class="events-row">
${cards}
    </div>
  </div>
  <div style="text-align:right;padding:0 0 16px">
    <a href="blog/index.html" style="font-size:13px;font-weight:700;color:#181D71;letter-spacing:.06em;text-transform:uppercase">See all posts →</a>
  </div>`;
}

function buildCollegesNewsBlock(posts, site) {
  if (!posts.length) return '';
  const SVG   = `<svg viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/></svg>`;
  const cards = posts.map((p, i) => {
    const date  = new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const img   = toSiteRelPath(p.featuredImage, site);
    const thumb = img
      ? `<div class="news-thumb"><img src="${img}" alt="${escHtml(p.title)}" style="object-position:center top"></div>`
      : `<div class="news-thumb" style="background:linear-gradient(135deg,#0B2A6B,#061c4a)"></div>`;
    const delay = i > 0 ? ` style="transition-delay:${i * 0.1}s"` : '';
    return `    <article class="news-card reveal"${delay}>
      ${thumb}
      <div class="news-body">
        ${p.category ? `<span class="news-tag">${escHtml(p.category)}</span>` : ''}
        <div class="news-date">${escHtml(date)}</div>
        <h3>${escHtml(p.title)}</h3>
        <p>${escHtml(p.excerpt || '')}</p>
        <a href="blog/${p.slug}.html" class="news-link">Read More ${SVG}</a>
      </div>
    </article>`;
  }).join('\n');

  return `  <div class="news-grid">
${cards}
  </div>`;
}

function buildDefaultNewsBlock(posts, site) {
  if (!posts.length) return '';
  const cards = posts.map(p => {
    const date = new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const img  = toSiteRelPath(p.featuredImage, site);
    return `    <a href="blog/${p.slug}.html" class="news-card" style="text-decoration:none;color:inherit">
      ${img ? `<div class="news-thumb"><img src="${img}" alt="${escHtml(p.title)}"></div>` : `<div class="news-thumb"></div>`}
      <div class="news-body">
        ${p.category ? `<span class="news-tag">${escHtml(p.category)}</span>` : ''}
        <div class="news-date">${escHtml(date)}</div>
        <h3>${escHtml(p.title)}</h3>
        <p>${escHtml(p.excerpt || '')}</p>
      </div>
    </a>`;
  }).join('\n');

  return `  <div class="news-grid">
${cards}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
//  Landing Page Content Management
// ══════════════════════════════════════════════════════════════
const LANDING_DIR  = path.join(__dirname, 'data');
const LANDING_PAGE = path.join(WEBSITE_ROOT, 'PNTC Main Landing Page', 'index.html');

const LANDING_TYPES = {
  research:    { file: path.join(LANDING_DIR, 'research.json'),    start: '<!-- PNTC_RESEARCH_START -->',  end: '<!-- PNTC_RESEARCH_END -->'   },
  careers:     { file: path.join(LANDING_DIR, 'careers.json'),     start: '<!-- PNTC_CAREERS_START -->',   end: '<!-- PNTC_CAREERS_END -->'    },
  directory:   { file: path.join(LANDING_DIR, 'directory.json'),   start: '<!-- PNTC_DIRECTORY_START -->', end: '<!-- PNTC_DIRECTORY_END -->'  },
  merchandise: { file: path.join(LANDING_DIR, 'merchandise.json'), start: '<!-- PNTC_MERCH_START -->',     end: '<!-- PNTC_MERCH_END -->'      }
};

for (const cfg of Object.values(LANDING_TYPES)) {
  if (!fs.existsSync(cfg.file)) fs.writeFileSync(cfg.file, '[]', 'utf8');
}

function readLanding(type)        { return JSON.parse(fs.readFileSync(LANDING_TYPES[type].file, 'utf8')); }
function writeLanding(type, items) { fs.writeFileSync(LANDING_TYPES[type].file, JSON.stringify(items, null, 2), 'utf8'); }

app.get('/api/landing/:type', (req, res) => {
  const { type } = req.params;
  if (!LANDING_TYPES[type]) return res.status(404).json({ error: 'Unknown type' });
  res.json(readLanding(type));
});

app.post('/api/landing/:type', (req, res) => {
  const { type } = req.params;
  if (!LANDING_TYPES[type]) return res.status(404).json({ error: 'Unknown type' });
  const items = readLanding(type);
  const item  = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  items.push(item);
  writeLanding(type, items);
  res.json(item);
});

app.put('/api/landing/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!LANDING_TYPES[type]) return res.status(404).json({ error: 'Unknown type' });
  const items = readLanding(type);
  const idx   = items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, id, updatedAt: new Date().toISOString() };
  writeLanding(type, items);
  res.json(items[idx]);
});

app.delete('/api/landing/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!LANDING_TYPES[type]) return res.status(404).json({ error: 'Unknown type' });
  writeLanding(type, readLanding(type).filter(i => i.id !== id));
  res.json({ ok: true });
});

app.post('/api/landing/:type/publish', (req, res) => {
  const { type } = req.params;
  if (!LANDING_TYPES[type]) return res.status(404).json({ error: 'Unknown type' });
  if (!fs.existsSync(LANDING_PAGE)) return res.status(404).json({ error: 'Landing page not found' });

  const items = readLanding(type);
  const cfg   = LANDING_TYPES[type];
  let   html  = fs.readFileSync(LANDING_PAGE, 'utf8');

  const si = html.indexOf(cfg.start);
  const ei = html.indexOf(cfg.end);
  if (si === -1 || ei === -1) return res.status(500).json({ error: 'Markers not found in landing page' });

  const block = buildLandingBlock(type, items);
  html = html.slice(0, si) + cfg.start + '\n' + block + '\n    ' + cfg.end + html.slice(ei + cfg.end.length);
  fs.writeFileSync(LANDING_PAGE, html, 'utf8');
  res.json({ ok: true, type, count: items.length });
});

function buildLandingBlock(type, items) {
  if (!items.length) return '';
  switch (type) {
    case 'research':    return buildResearchBlock(items);
    case 'careers':     return buildCareersBlock(items);
    case 'directory':   return buildDirectoryBlock(items);
    case 'merchandise': return buildMerchandiseBlock(items);
    default: return '';
  }
}

function buildResearchBlock(items) {
  const cards = items.map(item => `      <div class="research-card reveal">
        <div class="rc-icon">${escHtml(item.icon || '🏅')}</div>
        <div class="rc-title">${escHtml(item.title)}</div>
        <p class="rc-body">${escHtml(item.body)}</p>
        <div class="rc-year">${escHtml(item.year || '')}</div>
      </div>`).join('\n');
  return `    <div class="research-grid">
${cards}
    </div>`;
}

function buildCareersBlock(items) {
  const cards = items.map(item => {
    const badgeClass = item.badgeType === 'Part-Time' ? 'b-pt' : 'b-ft';
    return `      <div class="job-card reveal">
        <div class="job-dept">${escHtml(item.department)}</div>
        <div class="job-title">${escHtml(item.title)}</div>
        <div class="job-meta"><span>📍 ${escHtml(item.location || 'Dasmariñas, Cavite')}</span></div>
        <p class="job-desc">${escHtml(item.description)}</p>
        <span class="job-badge ${badgeClass}">${escHtml(item.badgeType || 'Full-Time')}</span>
      </div>`;
  }).join('\n');
  return `    <div class="jobs-grid">
${cards}
    </div>`;
}

function buildDirectoryBlock(items) {
  const cards = items.map(item => {
    const contacts = (item.contacts || []).map(c => {
      if (c.startsWith('mailto:') || c.startsWith('http') || c.startsWith('tel:')) {
        return `<a href="${escHtml(c)}">${escHtml(c.replace(/^(mailto:|tel:)/,''))}</a>`;
      }
      return `<a href="mailto:${escHtml(c)}">${escHtml(c)}</a>`;
    }).join('');
    return `      <div class="dir-card reveal">
        <div class="dir-ico">${escHtml(item.icon || '📋')}</div>
        <div class="dir-name">${escHtml(item.name)}</div>
        <p class="dir-desc">${escHtml(item.description)}</p>
        <div class="dir-contacts">${contacts}</div>
      </div>`;
  }).join('\n');
  return `    <div class="dir-grid">
${cards}
    </div>`;
}

function buildMerchandiseBlock(items) {
  const cards = items.map(item => {
    const imgClass     = item.imgClass || 'mi-navy';
    const inquireEmail = `mailto:info@pntc.edu.ph?subject=Merchandise - ${encodeURIComponent(item.name || '')}`;
    return `      <div class="merch-card reveal">
        <div class="merch-img ${escHtml(imgClass)}">${escHtml(item.icon || '🛍️')}</div>
        <div class="merch-body">
          <div class="merch-cat">${escHtml(item.category)}</div>
          <div class="merch-name">${escHtml(item.name)}</div>
          <p class="merch-note">${escHtml(item.note)}</p>
          <div class="merch-price">${escHtml(item.price)}</div>
          <button class="merch-btn" onclick="location.href='${inquireEmail}'">Inquire</button>
        </div>
      </div>`;
  }).join('\n');
  return `    <div class="merch-grid">
${cards}
    </div>`;
}

// ── Root redirect ──────────────────────────────────────────────
app.get('/', (_req, res) => res.redirect('/login.html'));

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   PNTC Admin Console                     ║');
  console.log('  ║   http://localhost:3000                   ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  Keep this window open while using the admin.');
  console.log('  Press Ctrl+C to stop.\n');
});
