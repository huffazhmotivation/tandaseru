/* tandaseru — API kecil di Cloudflare Pages (mode "_worker.js", jalan juga untuk upload drag & drop)
 *
 *   GET    /api/content   data situs terbit (publik)
 *   PUT    /api/content   simpan data terbit            [butuh ADMIN_PASSWORD]
 *   DELETE /api/content   kembalikan ke bawaan          [butuh ADMIN_PASSWORD]
 *   POST   /api/img       unggah 1 foto → { url }        [butuh ADMIN_PASSWORD]
 *   GET    /api/img/:id   tampilkan foto
 *
 * Binding yang dibutuhkan (Settings → Bindings):
 *   KV namespace  : TANDASERU_KV
 *   Secret/Variable: ADMIN_PASSWORD
 */
const CONTENT_KEY = 'site:published';
const MAX_JSON = 8 * 1024 * 1024;   // foto disimpan terpisah, jadi JSON kecil
const MAX_IMG = 6 * 1024 * 1024;
const IMG_TYPES = /^image\/(webp|jpeg|png|gif|avif)$/;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });

// cek kata sandi admin (dibandingkan lewat hash agar waktunya konstan)
async function guard(request, env) {
  if (!env.TANDASERU_KV) return json({ error: 'KV belum terhubung. Tambahkan binding bernama TANDASERU_KV.' }, 500);
  if (!env.ADMIN_PASSWORD) return json({ error: 'Variabel ADMIN_PASSWORD belum diatur di Cloudflare.' }, 500);
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(String(env.ADMIN_PASSWORD)))
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let d = given ? 0 : 1;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0 ? null : json({ error: 'Kata sandi salah' }, 401);
}

async function content(request, env) {
  if (request.method === 'GET') {
    if (!env.TANDASERU_KV) return json({ error: 'KV belum terhubung' }, 500);
    const v = await env.TANDASERU_KV.get(CONTENT_KEY);
    if (!v) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    return new Response(v, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=10' } });
  }
  const denied = await guard(request, env); if (denied) return denied;
  if (request.method === 'PUT') {
    const text = await request.text();
    if (text.length > MAX_JSON) return json({ error: 'Data terlalu besar' }, 413);
    let data;
    try { data = JSON.parse(text); } catch (e) { return json({ error: 'JSON tidak valid' }, 400); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Format data salah' }, 400);
    await env.TANDASERU_KV.put(CONTENT_KEY, text);
    return json({ ok: true });
  }
  if (request.method === 'DELETE') { await env.TANDASERU_KV.delete(CONTENT_KEY); return json({ ok: true }); }
  return json({ error: 'Method tidak didukung' }, 405, { Allow: 'GET, PUT, DELETE' });
}

async function uploadImage(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method tidak didukung' }, 405, { Allow: 'POST' });
  const denied = await guard(request, env); if (denied) return denied;
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!IMG_TYPES.test(type)) return json({ error: 'Hanya file gambar (webp/jpeg/png/gif/avif)' }, 415);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: 'File kosong' }, 400);
  if (buf.byteLength > MAX_IMG) return json({ error: 'Foto terlalu besar (maks 6 MB)' }, 413);
  // nama = hash isi → foto yang sama tidak disimpan dua kali (hemat kuota tulis KV)
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  const id = [...hash].slice(0, 16).map((n) => n.toString(16).padStart(2, '0')).join('');
  const key = 'img:' + id;
  const have = await env.TANDASERU_KV.getWithMetadata(key, 'stream');
  if (have.value) { try { await have.value.cancel(); } catch (e) {} }
  else await env.TANDASERU_KV.put(key, buf, { metadata: { type } });
  return json({ url: '/api/img/' + id });
}

async function serveImage(request, env, ctx, id) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  if (!/^[a-f0-9]{32}$/.test(id) || !env.TANDASERU_KV) return new Response('Not found', { status: 404 });
  let cache = null;
  try { cache = caches.default; const hit = await cache.match(request); if (hit) return hit; } catch (e) { cache = null; }
  const { value, metadata } = await env.TANDASERU_KV.getWithMetadata('img:' + id, 'stream');
  if (!value) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const res = new Response(value, {
    headers: {
      'Content-Type': (metadata && metadata.type) || 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
  if (cache) { try { ctx.waitUntil(cache.put(request, res.clone())); } catch (e) {} }
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/content') return await content(request, env);
      if (pathname === '/api/img') return await uploadImage(request, env);
      if (pathname.startsWith('/api/img/')) return await serveImage(request, env, ctx, pathname.slice(9));
      if (pathname.startsWith('/api/')) return json({ error: 'Tidak ditemukan' }, 404);
    } catch (e) {
      return json({ error: 'Kesalahan server: ' + (e && e.message ? e.message : e) }, 500);
    }
    return env.ASSETS.fetch(request); // file statis (index.html, admin.html, assets/, foto/)
  }
};
