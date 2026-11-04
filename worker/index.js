// Cloudflare Worker for the PNTC website.
// Website files are served by Cloudflare from dist/ (see wrangler.jsonc). Requests to /api/* run here,
// in the same Express admin server the site used on Vercel (admin/server.js), through Cloudflare's Node.js support.
import { httpServerHandler } from 'cloudflare:node';
import app from '../admin/server.js';

app.listen(8787);
const server = httpServerHandler({ port: 8787 });

// Public answers that are the same for every visitor are kept at Cloudflare for a while, so Supabase is asked
// once per period instead of once per visitor (protects the Supabase free tier egress).
const CACHE_SECONDS = {
  '/api/public/posts': 300,       // latest blog posts on the College and Training Center home pages
  '/api/chat/agent-status': 60,   // the "agent is online" label on every page
  '/api/sites': 3600,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ttl = CACHE_SECONDS[url.pathname];
    if (request.method !== 'GET' || !ttl) return server.fetch(request, env, ctx);

    const cache = caches.default;
    const key = new Request(url.toString(), { method: 'GET' });
    const hit = await cache.match(key);
    if (hit) return hit;

    const fresh = await server.fetch(request, env, ctx);
    if (!fresh.ok) return fresh;
    const res = new Response(fresh.body, fresh);
    res.headers.set('Cache-Control', `public, max-age=${ttl}`);
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  },
};
