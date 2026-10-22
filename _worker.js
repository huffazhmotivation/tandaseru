/* tandaseru — API kecil di Cloudflare Pages (mode "_worker.js", jalan juga untuk upload drag & drop)
 *
 *   GET    /api/content   data situs terbit (publik)
 *   PUT    /api/content   simpan data terbit            [butuh ADMIN_PASSWORD]
 *   DELETE /api/content   kembalikan ke bawaan          [butuh ADMIN_PASSWORD]
 *   POST   /api/img       unggah 1 foto → { url }        [butuh ADMIN_PASSWORD]
 *   GET    /api/img/:id   tampilkan foto
 *   POST   /api/login     masuk admin (set cookie)       | POST /api/logout keluar
 *   GET    /admin         hanya dilayani setelah login (cookie); selain itu → form login
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


/* ---------- login admin: halaman /admin & berkasnya hanya dilayani setelah masuk ---------- */
const COOKIE = 'ts_admin';
const ADMIN_FILES = new Set(['/admin', '/admin/', '/admin.html', '/assets/admin.js', '/assets/admin.css']);
const hex = (buf) => [...new Uint8Array(buf)].map((n) => n.toString(16).padStart(2, '0')).join('');
const sessionValue = async (env) =>
  hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('tandaseru-admin-session:' + env.ADMIN_PASSWORD)));
const readCookie = (request, name) => {
  const m = (request.headers.get('Cookie') || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? m.slice(name.length + 1) : '';
};
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function isAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const c = readCookie(request, COOKIE);
  return !!c && safeEqual(c, await sessionValue(env));
}
async function passwordOk(given, env) {
  if (!given || !env.ADMIN_PASSWORD) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(String(env.ADMIN_PASSWORD)))
  ]);
  return safeEqual(hex(a), hex(b));
}
async function login(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method tidak didukung' }, 405, { Allow: 'POST' });
  if (!env.ADMIN_PASSWORD) return json({ error: 'Variabel ADMIN_PASSWORD belum diatur di Cloudflare.' }, 500);
  let pw = '';
  try { pw = String((await request.json()).password || ''); } catch (e) {}
  if (!(await passwordOk(pw.trim(), env))) {
    await new Promise((r) => setTimeout(r, 800)); // sedikit tahan tebakan beruntun
    return json({ error: 'Kata sandi salah' }, 401);
  }
  return json({ ok: true }, 200, {
    'Set-Cookie': `${COOKIE}=${await sessionValue(env)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`
  });
}
const logout = () => json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });

const LOGIN_PAGE = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Masuk Admin — tandaseru!</title>
<style>
*{box-sizing:border-box;margin:0}body{min-height:100vh;display:grid;place-items:center;padding:20px;background:#F3EEE4;color:#0B1B16;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
form{width:100%;max-width:360px;background:#fff;border-radius:28px;padding:32px 28px;box-shadow:0 10px 40px rgba(11,27,22,.08)}
h1{font-size:22px;letter-spacing:-.03em;margin-bottom:4px}h1 i{font-style:normal;color:#C0A062}
p{color:#667068;font-size:13px;margin-bottom:20px}
input{width:100%;padding:13px 16px;border:1px solid rgba(11,27,22,.22);border-radius:999px;font:inherit;margin-bottom:12px}
input:focus{outline:2px solid #C0A062;outline-offset:1px}
button{width:100%;padding:13px;border:0;border-radius:999px;background:#1D4B3E;color:#fff;font:inherit;font-weight:700;cursor:pointer}
button:disabled{opacity:.6}#e{color:#B3261E;font-size:13px;min-height:20px;margin-top:10px}
</style></head><body>
<form id="f"><h1>tandaseru<i>!</i> admin</h1><p>Masukkan kata sandi untuk membuka panel admin.</p>
<input id="p" type="password" placeholder="Kata sandi" autocomplete="current-password" autofocus required>
<button id="b">Masuk</button><div id="e" role="alert"></div></form>
<script>
document.getElementById('f').addEventListener('submit',async function(ev){
  ev.preventDefault();var b=document.getElementById('b'),e=document.getElementById('e'),pw=document.getElementById('p').value.trim();
  b.disabled=true;e.textContent='';
  try{var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    if(r.ok){try{localStorage.setItem('tandaseru:token',pw)}catch(x){}location.replace('/admin');return}
    var d={};try{d=await r.json()}catch(x){}e.textContent=d.error||'Gagal masuk';
  }catch(x){e.textContent='Tidak bisa terhubung. Coba lagi.'}
  b.disabled=false;
});
</script></body></html>`;
const loginPage = (status) => new Response(LOGIN_PAGE, {
  status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
});

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
      if (pathname === '/api/login') return await login(request, env);
      if (pathname === '/api/logout') return logout();
      if (ADMIN_FILES.has(pathname)) {
        if (!(await isAdmin(request, env))) {
          // berkas admin (js/css) tidak boleh bocor; halaman /admin → form login
          return pathname.startsWith('/assets/') ? new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } }) : loginPage(401);
        }
        const url = new URL(request.url);
        // Pages membuat /admin.html → redirect ke /admin, jadi ambil lewat /admin (hindari loop)
        const target = pathname.startsWith('/assets/') ? request : new Request(new URL('/admin', url.origin), request);
        let res = await env.ASSETS.fetch(target);
        if (res.status >= 300 && res.status < 400 && res.headers.get('Location'))
          res = await env.ASSETS.fetch(new Request(new URL(res.headers.get('Location'), url.origin), request));
        const out = new Response(res.body, res);
        out.headers.set('Cache-Control', 'private, no-store');
        return out;
      }
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
