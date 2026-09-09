'use strict';
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Supabase ────────────────────────────────────────────────────
// Use placeholder values if env vars missing so the module loads without throwing.
// Actual API calls will fail gracefully with a clear error message.
const supabase = createClient(
  process.env.SUPABASE_URL         || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
);

// ── GitHub ─────────────────────────────────────────────────────
const GH_TOKEN  = process.env.GITHUB_TOKEN;
const GH_OWNER  = process.env.GITHUB_OWNER;
const GH_REPO   = process.env.GITHUB_REPO;
const GH_BRANCH = process.env.GITHUB_BRANCH || 'main';

async function ghGetFile(filePath) {
  const encoded = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
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
  const encoded = filePath.split('/').map(p => encodeURIComponent(p)).join('/');
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encoded}`;
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch:  GH_BRANCH
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
    throw new Error(`GitHub API ${res.status}: ${err}`);
  }
  return res.json();
}

// ── Site Config ────────────────────────────────────────────────
const SITES = {
  shs: {
    id: 'shs', name: 'PNTC Senior High School', short: 'SHS',
    dir: 'SHS', color: '#181D71', accent: '#FFCC00', font: 'shs'
  },
  colleges: {
    id: 'colleges', name: 'PNTC Colleges', short: 'Colleges',
    dir: 'PNTC Colleges', color: '#0B2A6B', accent: '#C8960C', font: 'barlow'
  },
  maritime: {
    id: 'maritime', name: 'PNTC Maritime Training Center', short: 'Maritime',
    dir: 'Maritime Training Center', color: '#0D1B3E', accent: '#C8960C', font: 'barlow'
  },
  aman: {
    id: 'aman', name: 'Training Vessel Aman Sinaya', short: 'Aman Sinaya',
    dir: 'Aman Sinaya', color: '#0A1F35', accent: '#C8960C', font: 'barlow'
  }
};

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Local dev only: serve website files so /site-files/ works in the admin
if (process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const WEBSITE_ROOT = path.resolve(__dirname, '..');
    if (fs.existsSync(WEBSITE_ROOT)) {
      app.use('/site-files', express.static(WEBSITE_ROOT));
    }
  } catch (_) {}
}

// ── Helpers ────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'post';
}

async function ensureUniqSlug(slug, excludeId) {
  let base = slug, n = 1;
  while (true) {
    let q = supabase.from('posts').select('id').eq('slug', slug);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q;
    if (!data || data.length === 0) break;
    slug = `${base}-${n++}`;
  }
  return slug;
}

const replaceUpload = multer({ storage: multer.memoryStorage() });

// ══════════════════════════════════════════════════════════════
//  API — Sites
// ══════════════════════════════════════════════════════════════
app.get('/api/sites', (_req, res) => res.json(Object.values(SITES)));

// ══════════════════════════════════════════════════════════════
//  API — Posts
// ══════════════════════════════════════════════════════════════
app.get('/api/posts', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts').select('*')
      .order('updatedAt', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Shared publish logic ───────────────────────────────────────
async function publishPostToGitHub(post) {
  const results = [];
  for (const siteId of (post.sites || [])) {
    const site = SITES[siteId];
    if (!site) continue;

    const postForSite  = { ...post, featuredImage: resolveImageForSite(post.featuredImage, site) };
    const postHtml     = buildPostHTML(postForSite, site);
    const postFilePath = `${site.dir}/blog/${post.slug}.html`;
    const existPost    = await ghGetFile(postFilePath);
    await ghPutFile(postFilePath, postHtml, `Publish: ${post.title}`, existPost?.sha);

    const { data: sitePosts } = await supabase
      .from('posts').select('*')
      .contains('sites', [siteId])
      .eq('status', 'published')
      .order('publishedAt', { ascending: false });

    const sitePostsMapped = (sitePosts || []).map(p => ({
      ...p, featuredImage: resolveImageForSite(p.featuredImage, site)
    }));

    const indexHtml     = buildBlogIndex(sitePostsMapped, site);
    const indexFilePath = `${site.dir}/blog/index.html`;
    const existIndex    = await ghGetFile(indexFilePath);
    await ghPutFile(indexFilePath, indexHtml, `Update blog index: ${site.name}`, existIndex?.sha);

    await updateWhatsNewGitHub(sitePostsMapped, site);
    results.push({ site: site.name, file: postFilePath });
  }
  return results;
}

app.post('/api/posts', async (req, res) => {
  try {
    const now    = new Date().toISOString();
    const status = req.body.status || 'draft';
    const slug   = await ensureUniqSlug(slugify(req.body.title || 'untitled'), null);
    const post   = {
      id:            uuidv4(),
      title:         req.body.title         || 'Untitled Post',
      slug,
      excerpt:       req.body.excerpt       || '',
      content:       req.body.content       || '',
      featuredImage: req.body.featuredImage || '',
      sites:         req.body.sites         || [],
      status,
      category:      req.body.category      || '',
      tags:          req.body.tags          || [],
      author:        req.body.author        || 'PNTC Communications',
      createdAt:     now,
      updatedAt:     now,
      publishedAt:   status === 'published' ? now : null
    };
    const { data, error } = await supabase.from('posts').insert(post).select().single();
    if (error) throw error;

    if (status === 'published' && post.sites.length) {
      try {
        const published = await publishPostToGitHub(data);
        return res.json({ ...data, _published: published });
      } catch (pubErr) {
        console.error('Auto-publish error:', pubErr);
        return res.json({ ...data, _publishError: pubErr.message });
      }
    }
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('posts').select('*').eq('id', req.params.id).single();
    if (fetchErr || !current) return res.status(404).json({ error: 'Not found' });

    const now = new Date().toISOString();
    if (req.body.title && req.body.title !== current.title) {
      req.body.slug = await ensureUniqSlug(slugify(req.body.title), current.id);
    }
    const updated = {
      ...current,
      ...req.body,
      id:          current.id,
      createdAt:   current.createdAt,
      updatedAt:   now,
      publishedAt: req.body.status === 'published' && !current.publishedAt ? now : current.publishedAt
    };
    const { data, error } = await supabase
      .from('posts').update(updated).eq('id', current.id).select().single();
    if (error) throw error;

    if (updated.status === 'published' && (updated.sites || []).length) {
      try {
        const published = await publishPostToGitHub(data);
        return res.json({ ...data, _published: published });
      } catch (pubErr) {
        console.error('Auto-publish error:', pubErr);
        return res.json({ ...data, _publishError: pubErr.message });
      }
    }
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Publish endpoint (kept for manual re-publish) ──────────────
app.post('/api/publish/:id', async (req, res) => {
  try {
    const { data: post, error: fetchErr } = await supabase
      .from('posts').select('*').eq('id', req.params.id).single();
    if (fetchErr || !post) return res.status(404).json({ error: 'Not found' });

    const now     = new Date().toISOString();
    const updated = {
      ...post,
      status:      'published',
      publishedAt: post.publishedAt || now,
      updatedAt:   now
    };
    await supabase.from('posts').update(updated).eq('id', post.id);

    const results = await publishPostToGitHub(updated);
    res.json({ ok: true, published: results, post: updated });
  } catch (e) {
    console.error('Publish error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  API — Image Upload (to Supabase Storage)
// ══════════════════════════════════════════════════════════════
app.post('/api/upload/featured', (req, res) => {
  const mem = multer({ storage: multer.memoryStorage() }).single('image');
  mem(req, res, async err => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image' });

    const siteId = req.body.site;
    const site   = SITES[siteId];
    if (!site) return res.status(400).json({ error: 'Unknown site' });

    try {
      const ext       = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const filename  = `${Date.now()}-${Math.random().toString(36).slice(2,6)}${ext}`;
      const storePath = `${site.dir}/uploads/featured/${filename}`;

      const { error: upErr } = await supabase.storage
        .from('site-images')
        .upload(storePath, req.file.buffer, { contentType: req.file.mimetype });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from('site-images').getPublicUrl(storePath);

      res.json({ url: publicUrl, filename, siteDir: site.dir });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// ══════════════════════════════════════════════════════════════
//  API — Images per site (from Supabase Storage)
// ══════════════════════════════════════════════════════════════
app.get('/api/images/:site', async (req, res) => {
  const site = SITES[req.params.site];
  if (!site) return res.status(404).json({ error: 'Unknown site' });

  try {
    const IMG_RE = /\.(jpe?g|png|gif|webp|svg)$/i;
    const images = [];

    async function listDir(prefix) {
      const { data: entries, error } = await supabase.storage
        .from('site-images').list(prefix, { limit: 500 });
      if (error || !entries) return;
      for (const entry of entries) {
        const fullPath = `${prefix}/${entry.name}`;
        if (!entry.id) {
          await listDir(fullPath);
        } else if (IMG_RE.test(entry.name)) {
          const { data: { publicUrl } } = supabase.storage
            .from('site-images').getPublicUrl(fullPath);
          images.push({
            filename: entry.name,
            relPath:  fullPath.replace(`${site.dir}/`, ''),
            url:      publicUrl,
            size:     entry.metadata?.size || 0,
            mtime:    new Date(entry.created_at || 0).getTime()
          });
        }
      }
    }

    await listDir(site.dir);
    images.sort((a, b) => b.mtime - a.mtime);
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/images/:site/replace', replaceUpload.single('image'), async (req, res) => {
  const site = SITES[req.params.site];
  if (!site || !req.file || !req.body.relPath) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  try {
    const storePath = `${site.dir}/${req.body.relPath}`;
    const { error } = await supabase.storage
      .from('site-images')
      .upload(storePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('site-images').getPublicUrl(storePath);

    res.json({ ok: true, url: publicUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  Landing Page Content Management
// ══════════════════════════════════════════════════════════════
const LANDING_TABLE_MAP = {
  research:    'research',
  careers:     'careers',
  directory:   'directory',
  merchandise: 'merchandise'
};

const LANDING_MARKERS = {
  research:    { start: '<!-- PNTC_RESEARCH_START -->',  end: '<!-- PNTC_RESEARCH_END -->'  },
  careers:     { start: '<!-- PNTC_CAREERS_START -->',   end: '<!-- PNTC_CAREERS_END -->'   },
  directory:   { start: '<!-- PNTC_DIRECTORY_START -->', end: '<!-- PNTC_DIRECTORY_END -->' },
  merchandise: { start: '<!-- PNTC_MERCH_START -->',     end: '<!-- PNTC_MERCH_END -->'     }
};

app.get('/api/landing/:type', async (req, res) => {
  const { type } = req.params;
  if (!LANDING_TABLE_MAP[type]) return res.status(404).json({ error: 'Unknown type' });
  try {
    const { data, error } = await supabase
      .from(LANDING_TABLE_MAP[type]).select('*')
      .order('createdAt', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/landing/:type', async (req, res) => {
  const { type } = req.params;
  if (!LANDING_TABLE_MAP[type]) return res.status(404).json({ error: 'Unknown type' });
  try {
    const now  = new Date().toISOString();
    const item = { id: uuidv4(), ...req.body, createdAt: now, updatedAt: now };
    const { data, error } = await supabase.from(LANDING_TABLE_MAP[type]).insert(item).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/landing/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!LANDING_TABLE_MAP[type]) return res.status(404).json({ error: 'Unknown type' });
  try {
    const updated = { ...req.body, id, updatedAt: new Date().toISOString() };
    const { data, error } = await supabase
      .from(LANDING_TABLE_MAP[type]).update(updated).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/landing/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!LANDING_TABLE_MAP[type]) return res.status(404).json({ error: 'Unknown type' });
  try {
    const { error } = await supabase.from(LANDING_TABLE_MAP[type]).delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/landing/:type/publish', async (req, res) => {
  const { type } = req.params;
  if (!LANDING_TABLE_MAP[type]) return res.status(404).json({ error: 'Unknown type' });
  try {
    const { data: items, error } = await supabase
      .from(LANDING_TABLE_MAP[type]).select('*')
      .order('createdAt', { ascending: true });
    if (error) throw error;

    const cfg         = LANDING_MARKERS[type];
    const landingPath = 'PNTC Main Landing Page/index.html';
    const existing    = await ghGetFile(landingPath);
    if (!existing) return res.status(404).json({ error: 'Landing page not found in repo' });

    let html = Buffer.from(existing.content, 'base64').toString('utf8');
    const si = html.indexOf(cfg.start);
    const ei = html.indexOf(cfg.end);
    if (si === -1 || ei === -1) return res.status(500).json({ error: 'Markers not found' });

    const block = buildLandingBlock(type, items || []);
    html = html.slice(0, si) + cfg.start + '\n' + block + '\n    ' + cfg.end + html.slice(ei + cfg.end.length);

    await ghPutFile(landingPath, html, `Update landing ${type}`, existing.sha);
    res.json({ ok: true, type, count: (items || []).length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  Auth (direct GoTrue REST — avoids service-role header clash)
// ══════════════════════════════════════════════════════════════
const COOKIE_NAME  = 'pntc_session';
const COOKIE_MAX   = 7 * 24 * 3600; // 7 days
const GOTRUE_URL   = (process.env.SUPABASE_URL || '').replace(/\/$/, '') + '/auth/v1';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

function getSessionToken(cookieHeader) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k.trim() === COOKIE_NAME) return v.join('=') || null;
  }
  return null;
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, error: 'Supabase env vars are missing. Add SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel → Project Settings → Environment Variables, then redeploy.' });
  }
  try {
    const r = await fetch(`${GOTRUE_URL}/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok || !data.access_token) {
      return res.status(401).json({ ok: false, error: data.error_description || data.msg || 'Invalid email or password.' });
    }
    res.setHeader('Set-Cookie',
      `${COOKIE_NAME}=${data.access_token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX}; SameSite=Lax`
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Auth service unreachable: ' + e.message });
  }
});

app.get('/api/auth/check', async (req, res) => {
  const token = getSessionToken(req.headers.cookie);
  if (!token) return res.json({ ok: false });
  try {
    const r = await fetch(`${GOTRUE_URL}/user`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
    });
    res.json({ ok: r.ok });
  } catch {
    res.json({ ok: false });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = getSessionToken(req.headers.cookie);
  if (token) {
    try {
      await fetch(`${GOTRUE_URL}/logout`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
    } catch (_) {}
  }
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  res.json({ ok: true });
});

app.get('/', (_req, res) => res.redirect('/index.html'));

// ══════════════════════════════════════════════════════════════
//  HTML Generators (output identical to original)
// ══════════════════════════════════════════════════════════════
function buildPostHTML(post, site) {
  const date = new Date(post.publishedAt || post.createdAt)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isSHS       = site.id === 'shs';
  const fonts       = isSHS
    ? `<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
    : `<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
  const titleFont   = isSHS ? `'Alfa Slab One', serif`   : `'Barlow Condensed', sans-serif`;
  const bodyFont    = isSHS ? `'Inter', sans-serif`       : `'Montserrat', sans-serif`;
  const titleWeight = isSHS ? `400` : `900`;
  const titleSize   = isSHS ? `clamp(1.8rem,4vw,3.2rem)` : `clamp(2rem,5vw,3.8rem)`;
  const logoPath    = '../PNTC White Horizontal.png';
  const blogPath    = 'index.html';
  const homePath    = '../index.html';
  const tags        = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

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
  ${post.category?`<div class="post-eyebrow">${escHtml(post.category)}</div>`:''}
  <h1 class="post-title">${escHtml(post.title)}</h1>
  <div class="post-meta">
    <span>${escHtml(post.author)}</span><span>&middot;</span><span>${date}</span>
  </div>
</div>
${post.featuredImage?`<img src="${toBlogRelPath(post.featuredImage,site)}" alt="${escHtml(post.title)}" class="feat-img">`:''}
<article class="post-wrap">${post.content}</article>
${tags?`<div class="tags">${tags}</div>`:''}
<div class="back-row"><a href="${blogPath}" class="back-btn">← Back to News &amp; Blog</a></div>
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
    return `<a href="${p.slug}.html" class="card">
      ${p.featuredImage?`<div class="card-img" style="background-image:url('${toBlogRelPath(p.featuredImage,site)}')"></div>`:`<div class="card-img card-img-placeholder"></div>`}
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

function escHtml(str){return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function toSiteRelPath(adminUrl,site){
  if(!adminUrl)return'';
  if(adminUrl.startsWith('http://')||adminUrl.startsWith('https://'))return adminUrl;
  const p1=`/site-files/${encodeURIComponent(site.dir)}/`;
  const p2=`/site-files/${site.dir}/`;
  if(adminUrl.startsWith(p1))return decodeURIComponent(adminUrl.slice(p1.length));
  if(adminUrl.startsWith(p2))return adminUrl.slice(p2.length);
  return adminUrl;
}

function toBlogRelPath(adminUrl,site){
  const rel=toSiteRelPath(adminUrl,site);
  if(!rel||rel.startsWith('http')||rel.startsWith('../')||rel.startsWith('/'))return rel;
  return'../'+rel;
}

function resolveImageForSite(adminUrl){return adminUrl||'';}

async function updateWhatsNewGitHub(allPosts,site){
  const filePath=`${site.dir}/index.html`;
  const existing=await ghGetFile(filePath);
  if(!existing)return;
  let html=Buffer.from(existing.content,'base64').toString('utf8');
  const START='<!-- PNTC_NEWS_START -->';
  const END='<!-- PNTC_NEWS_END -->';
  const si=html.indexOf(START),ei=html.indexOf(END);
  if(si===-1||ei===-1)return;
  const published=allPosts.slice().sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt)).slice(0,3);
  let block;
  if(site.id==='shs')block=buildSHSNewsBlock(published,site);
  else if(site.id==='colleges')block=buildCollegesNewsBlock(published,site);
  else block=buildDefaultNewsBlock(published,site);
  html=html.slice(0,si)+START+'\n'+block+'\n  '+END+html.slice(ei+END.length);
  await ghPutFile(filePath,html,`Update What's New: ${site.name}`,existing.sha);
}

function buildSHSNewsBlock(posts,site){
  if(!posts.length)return'';
  const cards=posts.map(p=>{
    const date=new Date(p.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const img=toSiteRelPath(p.featuredImage,site);
    const thumb=img?`<div class="ev-thumb-wrap"><img src="${img}" alt="${escHtml(p.title)}" style="width:100%;height:100%;object-fit:cover"></div>`:`<div class="ev-thumb-wrap" style="background:linear-gradient(135deg,#181D71,#0d1245)"></div>`;
    return`<a href="blog/${p.slug}.html" class="ev-card" style="text-decoration:none;color:inherit;cursor:pointer">${thumb}<div class="ev-body-wrap"><div class="ev-date">${escHtml(date)}</div><div class="ev-title">${escHtml(p.title)}</div><div class="ev-text">${escHtml(p.excerpt||'')}</div>${p.category?`<span class="ev-tag">${escHtml(p.category)}</span>`:''}</div></a>`;
  }).join('\n');
  return`  <div class="events-grid" style="margin-bottom:1rem"><div class="events-row">${cards}</div></div>
  <div style="text-align:right;padding:0 0 16px"><a href="blog/index.html" style="font-size:13px;font-weight:700;color:#181D71;letter-spacing:.06em;text-transform:uppercase">See all posts →</a></div>`;
}

function buildCollegesNewsBlock(posts,site){
  if(!posts.length)return'';
  const SVG=`<svg viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/></svg>`;
  const cards=posts.map((p,i)=>{
    const date=new Date(p.publishedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
    const img=toSiteRelPath(p.featuredImage,site);
    const thumb=img?`<div class="news-thumb"><img src="${img}" alt="${escHtml(p.title)}" style="object-position:center top"></div>`:`<div class="news-thumb" style="background:linear-gradient(135deg,#0B2A6B,#061c4a)"></div>`;
    const delay=i>0?` style="transition-delay:${i*0.1}s"`:'';
    return`<article class="news-card reveal"${delay}>${thumb}<div class="news-body">${p.category?`<span class="news-tag">${escHtml(p.category)}</span>`:''}<div class="news-date">${escHtml(date)}</div><h3>${escHtml(p.title)}</h3><p>${escHtml(p.excerpt||'')}</p><a href="blog/${p.slug}.html" class="news-link">Read More ${SVG}</a></div></article>`;
  }).join('\n');
  return`  <div class="news-grid">${cards}</div>`;
}

function buildDefaultNewsBlock(posts,site){
  if(!posts.length)return'';
  const cards=posts.map(p=>{
    const date=new Date(p.publishedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
    const img=toSiteRelPath(p.featuredImage,site);
    return`<a href="blog/${p.slug}.html" class="news-card" style="text-decoration:none;color:inherit">${img?`<div class="news-thumb"><img src="${img}" alt="${escHtml(p.title)}"></div>`:`<div class="news-thumb"></div>`}<div class="news-body">${p.category?`<span class="news-tag">${escHtml(p.category)}</span>`:''}<div class="news-date">${escHtml(date)}</div><h3>${escHtml(p.title)}</h3><p>${escHtml(p.excerpt||'')}</p></div></a>`;
  }).join('\n');
  return`  <div class="news-grid">${cards}</div>`;
}

function buildLandingBlock(type,items){
  if(!items.length)return'';
  switch(type){
    case'research':return buildResearchBlock(items);
    case'careers':return buildCareersBlock(items);
    case'directory':return buildDirectoryBlock(items);
    case'merchandise':return buildMerchandiseBlock(items);
    default:return'';
  }
}

function buildResearchBlock(items){
  return`    <div class="research-grid">${items.map(i=>`<div class="research-card reveal"><div class="rc-icon">${escHtml(i.icon||'🏅')}</div><div class="rc-title">${escHtml(i.title)}</div><p class="rc-body">${escHtml(i.body)}</p><div class="rc-year">${escHtml(i.year||'')}</div></div>`).join('')}</div>`;
}
function buildCareersBlock(items){
  return`    <div class="jobs-grid">${items.map(i=>`<div class="job-card reveal"><div class="job-dept">${escHtml(i.department)}</div><div class="job-title">${escHtml(i.title)}</div><div class="job-meta"><span>📍 ${escHtml(i.location||'Dasmariñas, Cavite')}</span></div><p class="job-desc">${escHtml(i.description)}</p><span class="job-badge ${i.badgeType==='Part-Time'?'b-pt':'b-ft'}">${escHtml(i.badgeType||'Full-Time')}</span></div>`).join('')}</div>`;
}
function buildDirectoryBlock(items){
  return`    <div class="dir-grid">${items.map(i=>{const contacts=(i.contacts||[]).map(c=>{if(c.startsWith('mailto:')||c.startsWith('http')||c.startsWith('tel:'))return`<a href="${escHtml(c)}">${escHtml(c.replace(/^(mailto:|tel:)/,''))}</a>`;return`<a href="mailto:${escHtml(c)}">${escHtml(c)}</a>`;}).join('');return`<div class="dir-card reveal"><div class="dir-ico">${escHtml(i.icon||'📋')}</div><div class="dir-name">${escHtml(i.name)}</div><p class="dir-desc">${escHtml(i.description)}</p><div class="dir-contacts">${contacts}</div></div>`;}).join('')}</div>`;
}
function buildMerchandiseBlock(items){
  return`    <div class="merch-grid">${items.map(i=>`<div class="merch-card reveal"><div class="merch-img ${escHtml(i.imgClass||'mi-navy')}">${escHtml(i.icon||'🛍️')}</div><div class="merch-body"><div class="merch-cat">${escHtml(i.category)}</div><div class="merch-name">${escHtml(i.name)}</div><p class="merch-note">${escHtml(i.note)}</p><div class="merch-price">${escHtml(i.price)}</div><button class="merch-btn" onclick="location.href='mailto:info@pntc.edu.ph?subject=Merchandise - ${encodeURIComponent(i.name||'')}'">Inquire</button></div></div>`).join('')}</div>`;
}

// ── Start / Export ─────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n  PNTC Admin Console');
    console.log(`  http://localhost:${PORT}\n`);
  });
} else {
  module.exports = app;
}
