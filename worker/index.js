// Cloudflare Worker for the PNTC website.
// Website files are served by Cloudflare from dist/ (see wrangler.jsonc). Requests to /api/* run here,
// in the same Express admin server the site used on Vercel (admin/server.js), through Cloudflare's Node.js support.
import { httpServerHandler } from 'cloudflare:node';
import app from '../admin/server.js';

app.listen(8787);
export default httpServerHandler({ port: 8787 });
