/* tandaseru — render landing page dari data */
(function () {
  const isPreview = new URLSearchParams(location.search).has('preview');
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nl = (s) => esc(s).replace(/\n/g, '<br>');
  const rupiah = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(Number(n) || 0);
  const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const pad = (i) => String(i + 1).padStart(2, '0');

  let S = TSStore.load();
  const ui = { deck: 0, feat: 0, cat: 'Semua', q: '', sort: 'default', openId: null, size: '', color: '', img: 0 };
  let rendered = false;

  const waLink = (text) => {
    const num = String(S.brand.whatsapp || '').replace(/\D/g, '');
    return `https://wa.me/${num}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  };
  const WA_PATH = 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4Z';
  const chOf = (k) => (S.checkout && S.checkout[k]) || {};
  const waOn = () => chOf('whatsapp').enabled !== false && !!String(S.brand.whatsapp || '').replace(/\D/g, '');
  const storeUrl = (k) => (chOf(k).enabled && String(chOf(k).url || '').trim()) || '';
  // tujuan tombol umum (nav, hero, footer): WhatsApp, lalu Shopee/Lynk, lalu katalog
  function contact() {
    if (waOn()) return { href: waLink('Halo ' + S.brand.name + ', saya mau tanya produk.'), label: 'WhatsApp', ext: true };
    const k = ['shopee', 'lynk'].find(storeUrl);
    if (k) return { href: storeUrl(k), label: k === 'shopee' ? 'Shopee' : 'Lynk.id', ext: true };
    return { href: '#koleksi', label: 'Belanja', ext: false };
  }
  const cAttr = () => { const c = contact(); return `href="${esc(c.href)}"${c.ext ? ' target="_blank" rel="noopener"' : ''}`; };
  const wordmark = () => `${esc(S.brand.name)}<i>!</i>`;
  // tanda seru terakhir pada judul diberi warna aksen
  const accentBang = (s) => nl(s).replace(/!(<br>)?$/, '<em>!</em>$1');

  /* ---------- ilustrasi busana pria (dipakai bila foto belum diunggah) ---------- */
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const norm = (h) => { h = String(h || '').trim(); if (/^#[0-9a-f]{3}$/i.test(h)) h = '#' + [...h.slice(1)].map((c) => c + c).join(''); return /^#[0-9a-f]{6}$/i.test(h) ? h : '#CBBFA9'; };
  const mix = (a, b, t) => { const A = rgb(norm(a)), B = rgb(norm(b)); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lumOf = (h) => { const [r, g, b] = rgb(norm(h)); return (r * .3 + g * .59 + b * .11) / 255; };

  const KINDS = [
    ['peci', /peci|kopiah|songkok|topi|aksesori|sajadah|tasbih/],
    ['sarung', /sarung/],
    ['outer', /outer|jaket|hoodie|cardigan|blazer/],
    ['celana', /celana|bawahan|jogger|cargo|chino/],
    ['kemeja', /kemeja|atasan|kaos|polo/],
    ['gamis', /gamis|jubah|thobe|dress/],
    ['koko', /koko|setelan/]
  ];
  const kindOf = (p) => {
    if (p && p.fig) return p.fig;
    const s = ((p && (p.category + ' ' + p.name)) || '').toLowerCase();
    const k = KINDS.find(([, re]) => re.test(s));
    return k ? k[0] : 'koko';
  };

  function figure(tone, kind) {
    const t = norm(tone), lum = lumOf(t);
    const gd = mix(t, '#000', .22), gl = mix(t, '#fff', .16);
    const light = lum > .62;
    const bgs = light ? ['#A99B88', '#8E9984', '#9AA3A6', '#B59A92'] : ['#DCCDBA', '#CDD3C4', '#D9D7D1', '#E2D3C8'];
    const seed = [...t].reduce((a, c) => a + c.charCodeAt(0), 0);
    const bg = bgs[seed % bgs.length];
    const skin = ['#D9B298', '#C99C7C', '#E0BFA6'][seed % 3];
    const hairC = '#25201C', cream = '#EDE5D6', dark = '#2A2824';
    const beard = seed % 2 === 0;
    const line = (d, c, o, w = 1.4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}"/>`;
    const dots = (x, ys, c) => ys.map((y) => `<circle cx="${x}" cy="${y}" r="1.9" fill="${c}"/>`).join('');
    // lengan panjang + tangan (kiri, lalu dicerminkan ke kanan)
    const sleeve = (L, c) => {
      const h = L - 150;
      const one = `<path d="M106 150 L86 162 C78 ${150 + h * .45} 73 ${150 + h * .8} 70 ${L} L93 ${L + 4} C99 ${150 + h * .7} 109 ${150 + h * .4} 119 172 Z" fill="${c}"/><ellipse cx="81" cy="${L + 11}" rx="8" ry="10.5" fill="${skin}"/>`;
      return one + `<g transform="translate(300 0) scale(-1 1)">${one}</g>`;
    };
    const legs = (c, top, flare = 0) => `<path d="M${98 - flare} ${top} L149 ${top} L148 388 L${92 - flare} 388 Z" fill="${c}"/><path d="M151 ${top} L${202 + flare} ${top} L${208 + flare} 388 L152 388 Z" fill="${c}"/>`;
    const torso = (len, c, w = 0) => `<path d="M104 150 C124 142 176 142 196 150 L${208 + w} ${len} C180 ${len + 8} 120 ${len + 8} ${92 - w} ${len} Z" fill="${c}"/>`;
    const mandarin = (c) => `<path d="M135 144 L135 156 L165 156 L165 144 Z" fill="${c}"/>`;

    const H = (x) => `<g transform="translate(0 20)">${x}</g>`; // turunkan kepala agar leher proporsional
    let body = '', head = '';
    const peciC = kind === 'gamis' ? '#EFE9DC' : '#1D1B19';
    const cap = (c) => `<path d="M128 74 C128 50 172 50 172 74 L172 79 L128 79 Z" fill="${c}"/><rect x="128" y="75" width="44" height="4" fill="${mix(c, '#fff', .15)}"/>`;
    const hair = `<path d="M130 80 C126 52 174 52 170 80 C166 68 134 68 130 80 Z" fill="${hairC}"/>`;
    const face = `<rect x="140" y="100" width="20" height="30" rx="4" fill="${skin}"/><ellipse cx="150" cy="86" rx="20" ry="25" fill="${skin}"/><ellipse cx="130" cy="88" rx="3.4" ry="6" fill="${skin}"/><ellipse cx="170" cy="88" rx="3.4" ry="6" fill="${skin}"/>` +
      (beard ? `<path d="M130 90 C131 124 169 124 170 90 C166 106 134 106 130 90 Z" fill="${hairC}"/><path d="M142 104 Q150 108 158 104" stroke="${skin}" stroke-width="2" fill="none"/>` : '');
    const useCap = ['koko', 'gamis', 'sarung', 'peci'].includes(kind);

    if (kind === 'gamis') {
      body = sleeve(300, gl) + `<path d="M104 150 C124 142 176 142 196 150 L222 388 C184 396 116 396 78 388 Z" fill="${t}"/>` + mandarin(gd) +
        line('M150 156 L150 250', gd, .6) + dots(146, [172, 198, 224], gd) + line('M126 190 L106 390', gd, .35) + line('M174 190 L194 390', gd, .35) + line('M138 250 L130 390', gd, .25) + line('M162 250 L170 390', gd, .25);
    } else if (kind === 'sarung') {
      let plaid = '';
      for (let x = 100; x <= 200; x += 12) plaid += line(`M${x} 264 L${x + (x - 150) * .12} 388`, cream, .35, 1);
      for (let y = 280; y < 388; y += 20) plaid += line(`M92 ${y} L208 ${y}`, cream, .3, 1);
      body = sleeve(284, cream) + `<path d="M94 262 L206 262 L214 388 L86 388 Z" fill="${t}"/>${plaid}` + line('M94 268 C130 280 170 280 206 268', gd, .7, 2) +
        torso(272, cream) + mandarin(mix(cream, '#000', .12)) + line('M150 156 L150 270', gd, .5) + dots(146, [176, 204, 232], gd);
    } else if (kind === 'celana') {
      body = legs(t, 248, 2) + line('M104 300 h26 v26 h-26 Z', gd, .6) + line('M196 300 h-26 v26 h26 Z', gd, .6) + line('M92 372 L148 372', gd, .5) + line('M152 372 L208 372', gd, .5) +
        sleeve(284, cream) + torso(256, cream) + `<path d="M132 148 Q150 168 168 148" fill="${mix(cream, '#000', .12)}"/><rect x="98" y="244" width="104" height="8" fill="${gd}"/>`;
    } else if (kind === 'kemeja') {
      body = legs(dark, 290) + sleeve(272, gl) + torso(302, t, 6) +
        `<path d="M150 158 L130 150 L136 172 Z" fill="${gd}"/><path d="M150 158 L170 150 L164 172 Z" fill="${gd}"/>` + line('M150 168 L150 306', gd, .6) + dots(146, [190, 220, 250, 280], gd) +
        line('M164 196 h22 v24 h-22 Z', gd, .55) + line('M114 196 h22 v24 h-22 Z', gd, .55);
    } else if (kind === 'outer') {
      body = legs(dark, 296) + sleeve(292, t) + `<path d="M118 150 L182 150 L186 300 L114 300 Z" fill="${cream}"/>` +
        `<path d="M104 150 C118 144 134 146 146 150 L144 308 L88 304 Z" fill="${t}"/><path d="M196 150 C182 144 166 146 154 150 L156 308 L212 304 Z" fill="${t}"/>` +
        line('M150 150 L150 308', gd, .9, 2) + line('M104 170 L96 300', gd, .3) + line('M196 170 L204 300', gd, .3) + `<rect x="98" y="296" width="104" height="9" rx="2" fill="${gd}"/>`;
    } else if (kind === 'peci') {
      // potret setengah badan: peci menjadi pusat perhatian
      const bust = sleeve(300, cream) + torso(360, cream, 10) + mandarin(mix(cream, '#000', .1)) + line('M150 156 L150 360', gd, .35) + dots(146, [176, 204], gd);
      return svg(bg, mix(bg, '#fff', .42), `<g transform="translate(-75 -64) scale(1.5)">${bust}${H(face + cap(t))}</g>`);
    } else { // koko
      body = legs(dark, 290) + sleeve(284, gl) + torso(298, t) + mandarin(gd) +
        line('M150 156 L150 300', gd, .6) + dots(146, [176, 204, 232, 260], gd) + line('M166 214 h20 v22 h-20 Z', gd, .5);
    }
    head = H(face + (useCap ? cap(peciC) : hair));
    return svg(bg, mix(bg, '#fff', .42), body + head);
  }

  function svg(bg, circle, inner) {
    return `<svg class="fig" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="300" height="400" fill="${bg}"/>
      <circle cx="150" cy="200" r="120" fill="${circle}"/>
      <rect y="386" width="300" height="14" fill="${mix(bg, '#000', .07)}"/>
      <ellipse cx="164" cy="390" rx="108" ry="8" fill="#000" opacity=".22"/>
      <defs><filter id="ds" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="7" dy="5" stdDeviation="6" flood-color="#000" flood-opacity=".32"/></filter></defs>
      <g filter="url(#ds)">${inner}</g></svg>`;
  }

  const media = (src, tone, kind, eager) => (src ? `<img src="${esc(src)}" alt="" decoding="async"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>` : figure(tone, kind));
  const section = (name) => `data-section="${name}"`;
  const visibleProducts = () => S.catalog.products.filter((p) => !p.hidden);
  const featuredProduct = () => {
    const vp = visibleProducts(), f = S.featured || {};
    return vp.find((x) => x.id === f.id) || vp.find((x) => x.badge === 'Best seller') || vp[0];
  };
  const isLg = () => false;

  /* ---------- bagian-bagian halaman ---------- */
  function tplNav() {
    const a = S.announcement;
    return `
      ${a.enabled && a.text ? `<div class="announce" ${section('general')}>${esc(a.text)}</div>` : ''}
      <header class="nav" id="nav" ${section('general')}>
        <div class="wrap nav-in">
          <nav class="nav-l"><a class="lk" href="#koleksi">Koleksi</a><a class="lk" href="#tentang">Tentang</a></nav>
          <a class="logo" href="#top" aria-label="${esc(S.brand.name)}">${wordmark()}</a>
          <div class="nav-r">
            <a class="lk" href="#cara-pesan">Cara pesan</a><a class="lk" href="#faq">FAQ</a>
            <a class="btn sm" ${cAttr()}>${esc(contact().label)}</a>
            <button class="burger" data-act="menu" aria-label="Buka menu" aria-expanded="false"><span></span></button>
          </div>
        </div>
        <nav class="menu" aria-label="Menu"><a href="#koleksi">Koleksi</a><a href="#tentang">Tentang</a><a href="#cara-pesan">Cara pesan</a><a href="#faq">FAQ</a></nav>
      </header>`;
  }

  const ICON = {
    shirt: 'M8 3 4 6l2 3 2-1v12h8V8l2 1 2-3-4-3c0 2-1.5 3-4 3S8 5 8 3Z',
    leaf: 'M5 19c0-9 5-14 14-14 0 9-5 14-14 14Zm0 0 8-8',
    gem: 'M6 4h12l3.5 5L12 21 2.5 9 6 4ZM2.5 9h19M9 4 7 9l5 12 5-12-2-5',
    wind: 'M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8',
    fit: 'M4 20 20 4l0 0M8 16l-2-2M11 13l-2-2M14 10l-2-2M17 7l-2-2M6 18l-2 2M4 20h4',
    drop: 'M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z',
    cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.5L20.5 8H6.2M9.5 21h.01M17.5 21h.01'
  };
  const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[k]}"/></svg>`;
  const SPARK = '<svg class="spark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1c.7 6 3 9.3 11 11-8 1.7-10.3 5-11 11-.7-6-3-9.3-11-11C9 10.300 11.300 7 12 1Z"/></svg>';
  const splitTitle = (t) => { const a = String(t || '').split('\n'); return { s: esc(a[0] || ''), b: esc(a.slice(1).join(' ')).replace(/!$/, '<em>!</em>') }; };
  const heroLines = (t) => String(t).split('\n').map((l, i) => `<span class="ln"><span style="--i:${i}">${esc(l).replace(/!$/, '<em>!</em>')}</span></span>`).join('');
  function deckSlides() {
    const h = S.hero, f = featuredProduct();
    let list = f ? [f, ...visibleProducts().filter((p) => p.id !== f.id && !p.soldout)].slice(0, 4) : [];
    if (h.image) {
      const idx = list.findIndex((p) => (p.images && p.images[0]) === h.image);
      if (idx > 0) { const [x] = list.splice(idx, 1); list.unshift(x); }
      else if (idx < 0) list = [{ custom: true, image: h.image, tone: h.tone, name: h.caption || S.brand.tagline, category: S.brand.name }, ...list].slice(0, 4);
    }
    return list;
  }
  const slideImg = (p) => (p.custom ? p.image : p.images && p.images[0]);
  const lookHtml = (p) => `<span class="pc-img">${media(slideImg(p), p.tone, p.custom ? 'koko' : kindOf(p))}</span><span class="pc-tx"><small>${esc(p.category)}</small><b>${esc(p.name)}</b>${p.custom ? '' : `<em>${rupiah(p.price)}</em>`}</span>${p.custom ? '' : '<span class="go">→</span>'}`;

  function tplHero() {
    const h = S.hero, vp = visibleProducts();
    const feats = (h.features || []).filter((x) => x && x.trim()).slice(0, 3);
    const fk = ['shirt', 'leaf', 'gem'];
    const title = esc(h.title).replace(/!(\s*)$/, '<em>!</em>').replace(/\n/g, '<br>');
    const slides = deckSlides();
    if (ui.deck >= slides.length) ui.deck = 0;
    const n = slides.length, cur = slides[ui.deck];
    return `
      <section class="hero" id="hero" ${section('hero')}>
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <p class="eyebrow rv">${esc(h.eyebrow)}</p>
            <h1 class="rv d1">${title}</h1>
            <p class="lead rv d2">${nl(h.text)}</p>
            <div class="actions rv d3">
              ${h.cta ? `<a class="btn" href="#koleksi">${esc(h.cta)} <span class="ar">→</span></a>` : ''}
              ${h.cta2 ? `<a class="btn ghost" ${cAttr()}>${esc(h.cta2)}</a>` : ''}
            </div>
            ${feats.length ? `<ul class="trust rv d3">${feats.map((f, i) => `<li>${ic(fk[i % 3])}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
          </div>
          <div class="hero-visual rv d1">
            <div class="deck" id="deck" aria-roledescription="carousel" aria-label="Foto koleksi">
              ${slides.map((p, i) => { const q = (i - ui.deck + n) % n; return `<div class="dcard${q === 0 ? ' front' : ''}" data-i="${i}" style="--p:${q}"><div class="tilt"><div class="frame">${media(slideImg(p), p.tone, p.custom ? 'koko' : kindOf(p), q === 0)}</div><span class="dtag">${esc(p.category)}</span><i class="glare"></i></div></div>`; }).join('')}
            </div>
            ${cur ? `<button class="hv-look" id="deckLook" ${cur.custom ? '' : `data-act="open" data-id="${esc(cur.id)}"`}>${lookHtml(cur)}</button>` : ''}
            ${n > 1 ? `<div class="deck-ui"><button class="dbtn" data-act="dprev" aria-label="Sebelumnya">←</button><div class="ddots">${slides.map((p, i) => `<button class="ddot${i === ui.deck ? ' on' : ''}" data-act="ddot" data-i="${i}" aria-label="Foto ${i + 1}"><i></i></button>`).join('')}</div><button class="dbtn" data-act="dnext" aria-label="Berikutnya">→</button></div>
            <button class="deck-seal" data-act="dnext" aria-label="Foto berikutnya"><svg viewBox="0 0 120 120" aria-hidden="true"><g class="ring"><defs><path id="circ" d="M60 60 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0"/></defs><text><textPath href="#circ" textLength="292" lengthAdjust="spacing">GESER • KLIK • JELAJAHI • </textPath></text></g></svg><b>→</b></button>` : ''}
            ${h.proof ? `<div class="hv-proof"><span class="av">${vp.slice(0, 3).map((p) => `<span>${media(p.images && p.images[0], p.tone, kindOf(p))}</span>`).join('')}</span><span>${esc(h.proof)}</span></div>` : ''}
          </div>
        </div>
      </section>`;
  }

  /* ---- interaksi deck foto hero ---- */
  let deckTimer = 0;
  function setDeck(i, dir = 1) {
    const cards = [...document.querySelectorAll('.dcard')], n = cards.length;
    if (n < 2) return;
    const prev = ui.deck; ui.deck = ((i % n) + n) % n;
    if (ui.deck === prev) return;
    cards.forEach((c, k) => {
      const q = (k - ui.deck + n) % n;
      c.classList.toggle('front', q === 0);
      if (k === prev && dir > 0) {
        c.classList.add('fly');
        setTimeout(() => { c.style.transition = 'none'; c.classList.remove('fly'); c.style.setProperty('--p', (k - ui.deck + n) % n); void c.offsetWidth; c.style.transition = ''; }, 700);
      } else if (k === ui.deck && dir < 0) {
        c.style.transition = 'none'; c.classList.add('fly'); c.style.setProperty('--p', 0); void c.offsetWidth; c.style.transition = ''; c.classList.remove('fly');
      } else c.style.setProperty('--p', q);
    });
    const sl = deckSlides()[ui.deck], look = $('#deckLook');
    if (look && sl) {
      look.innerHTML = lookHtml(sl);
      if (sl.custom) { look.removeAttribute('data-act'); look.removeAttribute('data-id'); } else { look.dataset.act = 'open'; look.dataset.id = sl.id; }
      look.classList.remove('swap'); void look.offsetWidth; look.classList.add('swap');
    }
    document.querySelectorAll('.ddot').forEach((d, k) => { d.classList.remove('on'); if (k === ui.deck) { void d.offsetWidth; d.classList.add('on'); } });
  }
  function startDeck() {
    clearInterval(deckTimer);
    if (isPreview || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    deckTimer = setInterval(() => {
      const d = $('#deck'); if (!d || d.matches(':hover') || d.dataset.drag) return;
      const r = d.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      setDeck(ui.deck + 1);
    }, 5200);
  }
  function initDeck() {
    // geser (swipe/drag), klik kartu depan, dan miring 3D mengikuti kursor
    let sx = 0, down = false, moved = 0;
    document.addEventListener('pointerdown', (e) => { const d = e.target.closest && e.target.closest('#deck'); if (!d) return; down = true; moved = 0; sx = e.clientX; d.dataset.drag = '1'; });
    document.addEventListener('pointermove', (e) => {
      const d = $('#deck'); if (!d) return;
      if (down) moved = e.clientX - sx;
      if (e.pointerType === 'mouse' && !down) {
        const f = d.querySelector('.dcard.front .tilt'); if (!f) return;
        const r = d.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (x < -.1 || x > 1.1 || y < -.1 || y > 1.1) return;
        f.style.setProperty('--ry', ((x - .5) * 11).toFixed(2) + 'deg'); f.style.setProperty('--rx', (-(y - .5) * 9).toFixed(2) + 'deg');
        f.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); f.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      }
    });
    document.addEventListener('pointerup', (e) => {
      const d = $('#deck'); if (!down) return; down = false; if (d) delete d.dataset.drag;
      if (Math.abs(moved) > 55) setDeck(ui.deck + (moved < 0 ? 1 : -1), moved < 0 ? 1 : -1);
      else if (Math.abs(moved) < 6 && e.target.closest && e.target.closest('.dcard.front')) {
        const sl = deckSlides()[ui.deck]; if (sl && !sl.custom) openModal(sl.id);
      }
      startDeck();
    });
    document.addEventListener('pointerleave', () => {}, true);
    document.addEventListener('mouseout', (e) => {
      const d = e.target.closest && e.target.closest('#deck');
      if (d && !d.contains(e.relatedTarget)) { const f = d.querySelector('.dcard.front .tilt'); if (f) { f.style.setProperty('--rx', '0deg'); f.style.setProperty('--ry', '0deg'); } }
    });
  }

  function tplTicker() {
    const items = (S.marquee || []).filter((x) => x && x.trim());
    if (!items.length) return '';
    const one = items.map((t) => `<span class="ticker-item">${esc(t)}</span>`).join('').repeat(Math.max(1, Math.ceil(6 / items.length)));
    return `<div class="ticker" ${section('values')} aria-hidden="true"><div class="ticker-track"><div class="ticker-row">${one}</div><div class="ticker-row">${one}</div></div></div>`;
  }

  function tplValues() {
    const v = S.values, ik = ['wind', 'fit', 'drop'];
    return `
      <section class="section" id="nilai" ${section('values')}>
        <div class="wrap">
          <div class="rv" style="text-align:center"><p class="eyebrow">Kenapa ${esc(S.brand.name)}</p><h2 class="h2 values-title" style="margin-top:18px">${nl(v.title)}</h2></div>
          <div class="vcards">${v.items.map((it, i) => `<article class="vcard rv d${i % 3 + 1}"><span class="vic">${ic(ik[i % 3])}</span><h3>${esc(it.title)}</h3><p>${nl(it.text)}</p></article>`).join('')}</div>
        </div>
      </section>`;
  }

  function tplCategories() {
    const vis = visibleProducts();
    const cats = S.catalog.categories.filter((k) => vis.some((p) => p.category === k));
    if (cats.length < 2) return '';
    const c = S.catalog;
    return `
      <section class="section tiles-sec" id="kategori" ${section('catalog')}>
        <div class="wrap">
          <div class="section-head rv"><div><p class="eyebrow">${esc(c.tilesEyebrow || 'Jelajahi')}</p><h2 class="h2">${nl(c.tilesTitle || 'Kategori')}</h2></div><p class="lead">Pilih kategori favoritmu, lalu buka koleksinya.</p></div>
          <div class="panels rv" id="panels">
            ${cats.map((k, i) => { const p = vis.find((x) => x.category === k); const n = vis.filter((x) => x.category === k).length;
              return `<button class="panel${i === 0 ? ' active' : ''}" data-act="panel" data-cat="${esc(k)}"><div class="frame">${media(p.images && p.images[0], p.tone, kindOf(p))}</div><span class="p-no">${pad(i)}</span><span class="p-vert">${esc(k)}</span><span class="p-info"><b>${esc(k)}</b><small>${n} model · lihat koleksi</small><i>→</i></span></button>`; }).join('')}
          </div>
        </div>
      </section>`;
  }

  const promoOn = () => {
    const p = S.promo;
    if (!p || !p.enabled) return false;
    if (p.endsAt) { const t = Date.parse(p.endsAt); if (!isNaN(t) && t <= Date.now()) return false; }
    return true;
  };
  const FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3.500 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 1.500.700 2.500 1.500 2.500C10.500 9 12 6.500 12 3Z"/></svg>';
  const COPY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.500"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  function tplPromo() {
    if (!promoOn()) return '';
    const p = S.promo, lines = String(p.title || '').split('\n').filter((l) => l.trim());
    const title = lines.map((l, i) => (i === 0 ? `<span>${esc(l)}</span>` : `<mark>${esc(l)}</mark>`)).join(' ');
    const href = String(p.ctaLink || '').trim() || '#koleksi';
    const ext = /^https?:/i.test(href);
    return `
      <section class="promo-sec" id="promo" ${section('promo')}>
        <div class="wrap"><div class="promo rv">
          <div class="promo-l">
            <span class="pbadge">${FLAME}${esc(p.badge)}</span>
            <h2 class="ptitle">${title}</h2>
            ${p.text ? `<p class="ptext">${nl(p.text)}</p>` : ''}
            <div class="pact">
              <a class="btn" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(p.cta)} <span class="ar">→</span></a>
              ${p.code ? `<button class="coupon" data-act="copy" data-code="${esc(p.code)}" aria-label="Salin kode ${esc(p.code)}"><small>Kode</small><b>${esc(p.code)}</b><i>${COPY}</i></button>` : ''}
            </div>
          </div>
          <div class="promo-r">
            ${p.percent ? `<p class="plabel">${esc(p.percentLabel)}</p><div class="pnum">${esc(p.percent)}</div>` : ''}
            ${p.showCountdown && p.endsAt ? `<p class="plabel clock">Berakhir dalam</p><div class="cd" data-end="${esc(p.endsAt)}">${[['d', 'Hari'], ['h', 'Jam'], ['m', 'Menit'], ['s', 'Detik']].map(([k, l]) => `<div class="cdb"><b data-cd="${k}">00</b><small>${l}</small></div>`).join('')}</div>` : ''}
          </div>
        </div></div>
      </section>`;
  }
  function tickPromo() {
    const cd = $('.cd'); if (!cd) return;
    let ms = Date.parse(cd.dataset.end) - Date.now();
    if (isNaN(ms)) return;
    if (ms <= 0) { const sec = $('#promo'); if (sec) sec.remove(); return; }
    const v = { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
    for (const k in v) { const el = cd.querySelector(`[data-cd="${k}"]`); if (el) el.textContent = String(v[k]).padStart(2, '0'); }
  }

  function tplLookbook() {
    const l = S.lookbook;
    if (!l || !l.items.length) return '';
    return `
      <section class="section" id="lookbook" ${section('lookbook')}>
        <div class="wrap">
          <div class="section-head rv"><div><p class="eyebrow">${esc(l.eyebrow)}</p><h2 class="h2">${nl(l.title)}</h2></div></div>
          <div class="look n${Math.min(l.items.length, 4)}">
            ${l.items.map((it, i) => `<figure class="look-item i${i} rv d${i % 3 + 1}">${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.label)}" loading="lazy" decoding="async">` : figure(S.theme.accent, ['koko', 'gamis', 'kemeja', 'sarung'][i % 4])}<figcaption><span>${pad(i)}</span><b>${esc(it.label)}</b><small>${esc(it.text)}</small></figcaption></figure>`).join('')}
          </div>
        </div>
      </section>`;
  }

  function featItems() {
    const f = featuredProduct();
    if (!f) return [];
    const rest = visibleProducts().filter((p) => p.id !== f.id && !p.soldout);
    return [f, ...rest].slice(0, 4);
  }
  function tplFeatured() {
    const f = S.featured || {};
    const items = featItems();
    if (!items.length) return '';
    if (ui.feat >= items.length) ui.feat = 0;
    return `
      <section class="section featured" id="pilihan" ${section('catalog')} style="padding-top:0">
        <div class="wrap"><div class="feat-card rv"><div class="feat-grid">
          <figure class="feat-art">
            <div class="fw feat-stage">${items.map((p, i) => `<div class="frame slide${i === ui.feat ? ' on' : ''}" data-i="${i}">${media(p.images && p.images[0], p.tone, kindOf(p))}</div>`).join('')}<i class="offset"></i></div>
            <span class="tagbox" id="featTag">${esc(items[ui.feat].badge || 'Pilihan')}</span>
            <span class="feat-count"><b id="featNo">${pad(ui.feat)}</b> / ${pad(items.length - 1)}</span>
          </figure>
          <div class="feat-copy">
            <p class="eyebrow">${esc(f.eyebrow || 'Pilihan')}</p>
            <h2 class="h2">${nl(f.title)}</h2>
            <div class="feat-slides">${items.map((p, i) => `<div class="fs${i === ui.feat ? ' on' : ''}" data-i="${i}">
              <p class="fs-d">${nl(i === 0 && f.text ? f.text : p.desc)}</p>
              <div class="feat-meta"><b>${rupiah(p.price)}</b><span>${esc(p.name)} · ${esc(p.category)}</span></div>
              <button class="btn" data-act="open" data-id="${esc(p.id)}">Lihat detail <span class="ar">→</span></button></div>`).join('')}</div>
            <div class="feat-nav" role="tablist">${items.map((p, i) => `<button class="fn${i === ui.feat ? ' on' : ''}" data-act="fslide" data-i="${i}" role="tab"><span class="no">${pad(i)}</span><span class="nm">${esc(p.name)}</span><i></i></button>`).join('')}</div>
          </div>
        </div></div></div>
      </section>`;
  }
  let featTimer = 0;
  function setFeat(i) {
    const items = featItems(); if (!items.length) return;
    ui.feat = (i + items.length) % items.length;
    document.querySelectorAll('.feat-stage .slide, .fs, .fn').forEach((el) => {
      const on = +el.dataset.i === ui.feat; el.classList.toggle('on', on);
    });
    const tg = $('#featTag'), no = $('#featNo');
    if (tg) tg.textContent = items[ui.feat].badge || 'Pilihan';
    if (no) no.textContent = pad(ui.feat);
    // ulang animasi progres
    const cur = $('.fn.on'); if (cur) { cur.classList.remove('on'); void cur.offsetWidth; cur.classList.add('on'); }
  }
  function startFeat() {
    clearInterval(featTimer);
    if (isPreview || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    featTimer = setInterval(() => {
      const sec = $('.featured'); if (!sec || sec.matches(':hover')) return;
      const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      setFeat(ui.feat + 1);
    }, 6500);
  }

  function tplCatalog() {
    const c = S.catalog, vis = visibleProducts();
    const count = (cat) => vis.filter((p) => p.category === cat).length;
    const cats = ['Semua', ...c.categories.filter((k) => count(k) > 0)];
    if (!cats.includes(ui.cat)) ui.cat = 'Semua';
    return `
      <section class="section catalog-sec" id="koleksi" ${section('catalog')}>
        <div class="wrap">
          <div class="section-head rv">
            <div><p class="eyebrow">${esc(c.eyebrow)}</p><h2 class="h2">${nl(c.title)}</h2></div>
            <p class="lead">${nl(c.text)}</p>
          </div>
          <div class="tools rv">
            <div class="chips" role="group" aria-label="Kategori">
              ${cats.map((k) => `<button class="chip" data-act="cat" data-cat="${esc(k)}" aria-pressed="${k === ui.cat}">${esc(k)}<span class="n">${k === 'Semua' ? vis.length : count(k)}</span></button>`).join('')}
            </div>
            <div class="tools-right">
              <span class="count" id="count">${countText()}</span>
              <label class="sr" for="q">Cari produk</label>
              <input class="field" id="q" type="search" placeholder="Cari produk…" value="${esc(ui.q)}" autocomplete="off">
              <label class="sr" for="sort">Urutkan</label>
              <select class="field" id="sort">
                <option value="default"${ui.sort === 'default' ? ' selected' : ''}>Urutan toko</option>
                <option value="low"${ui.sort === 'low' ? ' selected' : ''}>Harga terendah</option>
                <option value="high"${ui.sort === 'high' ? ' selected' : ''}>Harga tertinggi</option>
              </select>
            </div>
          </div>
          <div class="${gridClass()}" id="grid">${tplGrid()}</div>
        </div>
      </section>`;
  }

  const gridClass = () => 'grid' + (isLg() ? ' has-lg' : '');

  function filtered() {
    let items = visibleProducts();
    if (ui.cat !== 'Semua') items = items.filter((p) => p.category === ui.cat);
    const q = ui.q.trim().toLowerCase();
    if (q) items = items.filter((p) => (p.name + ' ' + p.category + ' ' + p.colors).toLowerCase().includes(q));
    if (ui.sort === 'low') items = [...items].sort((a, b) => a.price - b.price);
    if (ui.sort === 'high') items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }
  const countText = () => `${filtered().length} produk${ui.cat !== 'Semua' ? ' · ' + ui.cat : ''}`;

  function tplGrid() {
    const items = filtered();
    if (!items.length) return `<p class="empty">Belum ada produk yang cocok. Coba kata kunci atau kategori lain.</p>`;
    return items.map((p) => {
      const [a, b] = p.images || [];
      const off = p.compare > p.price ? Math.round((1 - p.price / p.compare) * 100) : 0;
      const sizes = list(p.sizes);
      return `
      <article class="card${p.soldout ? ' is-sold' : ''}">
        <button class="card-media" data-act="open" data-id="${esc(p.id)}" aria-label="Lihat ${esc(p.name)}">
          <div class="pic">${media(a, p.tone, kindOf(p))}${b ? `<img class="alt" src="${esc(b)}" alt="">` : ''}</div>
          ${p.soldout ? '<span class="tag sold">Habis</span>' : p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ''}
          ${off && !p.soldout ? `<span class="off">-${off}%</span>` : ''}
          <span class="quick">${p.soldout ? 'Kabari saya saat restock' : 'Lihat &amp; pesan'} <i>→</i></span>
        </button>
        <div class="card-info">
          <p class="cat">${esc(p.category)}${p.colors ? ' · ' + list(p.colors).length + ' warna' : ''}</p>
          <h3>${esc(p.name)}</h3>
          <p class="price"><b>${rupiah(p.price)}</b>${p.compare > p.price ? `<s>${rupiah(p.compare)}</s>` : ''}</p>
          ${sizes.length ? `<p class="szs">${sizes.slice(0, 6).map((x) => `<span>${esc(x.replace(/\s*\(.*\)/, ''))}</span>`).join('')}</p>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  function tplAbout() {
    const a = S.about;
    return `
      <section class="section" id="tentang" ${section('about')} style="padding-top:0">
        <div class="wrap about-grid">
          <figure class="about-art"><div class="fw"><div class="frame rv">${media(a.image, a.tone, 'gamis')}</div></div><figcaption class="cap">${esc(S.brand.tagline)} — ${esc(S.brand.city)}</figcaption></figure>
          <div class="about-copy rv d1">
            <p class="eyebrow">${esc(a.eyebrow)}</p>
            <h2 class="h2">${nl(a.title)}</h2>
            ${String(a.text).split(/\n\s*\n/).map((p) => `<p>${nl(p)}</p>`).join('')}
            <div class="stats">${a.stats.map((s) => `<div><b>${esc(s.n)}</b><span>${esc(s.l)}</span></div>`).join('')}</div>
          </div>
        </div>
      </section>`;
  }

  function tplSteps() {
    const s = S.steps;
    return `
      <section class="section steps" id="cara-pesan" ${section('steps')}>
        <div class="wrap"><div class="steps-wrap rv">
          <div><p class="eyebrow">Mudah</p><h2 class="h2">${nl(s.title)}</h2></div>
          <div class="steps-list">${s.items.map((i) => `<div class="step"><h3>${esc(i.title)}</h3><p>${nl(i.text)}</p></div>`).join('')}</div>
        </div></div>
      </section>`;
  }

  function tplTestimonials() {
    const t = S.testimonials;
    if (!t.items.length) return '';
    return `
      <section class="section" id="testimoni" ${section('testimonials')}>
        <div class="wrap">
          <div class="section-head rv"><h2 class="h2">${nl(t.title)}</h2></div>
          <div class="quotes rv">
            ${t.items.map((q) => `<blockquote class="quote"><p>${nl(q.text)}</p><footer><b>${esc(q.name)}</b>${q.city ? ' · ' + esc(q.city) : ''}</footer></blockquote>`).join('')}
          </div>
        </div>
      </section>`;
  }

  function tplFaq() {
    const f = S.faq;
    if (!f.items.length) return '';
    return `
      <section class="section" id="faq" ${section('faq')} style="padding-top:0">
        <div class="wrap faq-grid">
          <h2 class="h2 rv">${nl(f.title)}</h2>
          <div class="faq-list rv">
            ${f.items.map((i) => `<details class="faq-item"><summary>${esc(i.q)}</summary><p>${nl(i.a)}</p></details>`).join('')}
          </div>
        </div>
      </section>`;
  }

  function tplFooter() {
    const f = S.footer, b = S.brand;
    const ig = String(b.instagram || '').replace(/^@/, '');
    return `
      <footer class="footer" id="kontak" ${section('footer')}>
        <div class="wrap">
          <div class="footer-cta">
            <div><h2>${accentBang(f.title)}</h2><p>${nl(f.text)}</p></div>
            <a class="btn" ${cAttr()}>${esc(f.cta)} <span class="ar">→</span></a>
          </div>
          <div class="footer-cols">
            <div><h4>Kontak</h4>
              <a href="${waLink()}" target="_blank" rel="noopener">WhatsApp +${esc(String(b.whatsapp).replace(/\D/g, ''))}</a>
              ${b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ''}
              ${ig ? `<a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">Instagram @${esc(ig)}</a>` : ''}
            </div>
            <div><h4>Toko</h4><p>${esc(b.city)}</p><p>${esc(b.hours)}</p></div>
            <div><h4>Jelajahi</h4><a href="#koleksi">Koleksi</a><a href="#tentang">Tentang</a><a href="#cara-pesan">Cara pesan</a><a href="#faq">FAQ</a></div>
          </div>
        </div>
        <div class="wrap"><div class="mega" aria-hidden="true">${wordmark()}</div></div>
        <div class="wrap"><div class="copy"><span>© ${new Date().getFullYear()} ${esc(b.name)}. ${esc(f.copyright)}</span><span>${esc(b.tagline)}</span></div></div>
      </footer>
      <a class="fab" ${cAttr()} aria-label="${esc(contact().label)}">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4Z"/></svg>
        <span>${contact().label === 'WhatsApp' ? 'Chat' : 'Belanja'}</span>
      </a>`;
  }

  /* ---------- render utama ---------- */
  function applyTheme() {
    const r = document.documentElement.style;
    r.setProperty('--accent', S.theme.accent);
    r.setProperty('--primary', S.theme.primary || '#1D4B3E');
    r.setProperty('--bg', S.theme.bg);
    document.title = `${S.brand.name}! — ${S.brand.tagline}`;
  }

  function render() {
    applyTheme();
    const y = window.scrollY;
    $('#app').innerHTML =
      `<div id="top"></div>` + tplNav() + tplHero() + tplTicker() + tplCategories() + tplPromo() + tplFeatured() + tplCatalog() + tplLookbook() + tplValues() +
      tplAbout() + tplSteps() + tplTestimonials() + tplFaq() + tplFooter();
    startFeat(); startDeck(); tickPromo();
    const heroEl = $('.hero');
    if (rendered) {
      if (heroEl) heroEl.classList.add('go', 'na');
      // render ulang (preview admin): tampilkan langsung & pertahankan posisi scroll
      document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
      window.scrollTo(0, y);
      if (ui.openId) renderModal();
    } else {
      observe();
      rendered = true;
    }
  }

  function observe() {
    const els = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px 140px 0px', threshold: 0.01 });
    els.forEach((e) => io.observe(e));
    // hero langsung tampil saat halaman dimuat
    requestAnimationFrame(() => requestAnimationFrame(() => { document.querySelectorAll('.hero .rv').forEach((e) => e.classList.add('in')); const hh = $('.hero'); if (hh) hh.classList.add('go'); }));
  }

  function refreshGrid() {
    const g = $('#grid'); g.className = gridClass(); g.innerHTML = tplGrid();
    const ct = $('#count'); if (ct) ct.textContent = countText();
    document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === ui.cat)));
  }

  /* ---------- modal produk ---------- */
  const product = () => S.catalog.products.find((p) => p.id === ui.openId);

  function orderText(p) {
    const lines = [`Halo ${S.brand.name}, saya mau pesan:`, `• ${p.name}`];
    if (ui.size) lines.push(`• Ukuran: ${ui.size}`);
    if (ui.color) lines.push(`• Warna: ${ui.color}`);
    lines.push(`• Harga: ${rupiah(p.price)}`);
    if (promoOn() && S.promo.code) lines.push(`• Kode promo: ${S.promo.code}`);
    lines.push('', 'Apakah stoknya tersedia?');
    return lines.join('\n');
  }

  function renderModal() {
    const p = product();
    const m = $('#modal');
    if (!p) { closeModal(); return; }
    const sizes = list(p.sizes), colors = list(p.colors), imgs = p.images || [];
    if (ui.size && !sizes.includes(ui.size)) ui.size = '';
    if (ui.color && !colors.includes(ui.color)) ui.color = '';
    if (ui.img >= imgs.length) ui.img = 0;
    m.hidden = false;
    document.body.classList.add('lock');
    m.innerHTML = `
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(p.name)}">
        <button class="close" data-act="close" aria-label="Tutup">×</button>
        <div class="sheet-media${imgs.length > 1 ? '' : ' single'}">
          ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button data-act="img" data-i="${i}" aria-current="${i === ui.img}" aria-label="Foto ${i + 1}"><img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:cover"></button>`).join('')}</div>` : ''}
          <div class="sheet-main"><div class="frame">${media(imgs[ui.img], p.tone, kindOf(p))}</div></div>
        </div>
        <div class="sheet-info">
          <p class="cat">${esc(p.category)}${p.badge ? ' · ' + esc(p.badge) : ''}</p>
          <h3>${esc(p.name)}</h3>
          <p class="price">${rupiah(p.price)}${p.compare > p.price ? `<s>${rupiah(p.compare)}</s>` : ''}</p>
          <p class="desc">${nl(p.desc)}</p>
          ${sizes.length ? `<div class="opt"><h4>Ukuran<b>${esc(ui.size)}</b></h4><div class="opts">${sizes.map((s) => `<button class="pill" data-act="size" data-v="${esc(s)}" aria-pressed="${s === ui.size}">${esc(s)}</button>`).join('')}</div></div>` : ''}
          ${colors.length ? `<div class="opt"><h4>Warna<b>${esc(ui.color)}</b></h4><div class="opts">${colors.map((s) => `<button class="pill" data-act="color" data-v="${esc(s)}" aria-pressed="${s === ui.color}">${esc(s)}</button>`).join('')}</div></div>` : ''}
          ${tplChannels(p)}
        </div>
      </div>`;
  }

  function tplChannels(p) {
    const rows = [];
    const add = (key, href, label, note) => rows.push(
      `<a class="chn ${key}" href="${esc(href)}" target="_blank" rel="noopener"><span class="ico">${key === 'whatsapp' ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${WA_PATH}"/></svg>` : key === 'shopee' ? 'S' : 'L'}</span><span class="tx"><b>${esc(label)}</b><small>${esc(note)}</small></span><span class="go">→</span></a>`);
    if (p.soldout) {
      if (waOn()) add('whatsapp', waLink(`Halo ${S.brand.name}, kabari saya kalau ${p.name} restock ya.`), 'Kabari saya saat restock', 'Anda dapat giliran pertama');
    } else {
      const shop = chOf('shopee').enabled && (String(p.shopee || '').trim() || String(chOf('shopee').url || '').trim());
      const lynk = chOf('lynk').enabled && (String(p.lynk || '').trim() || String(chOf('lynk').url || '').trim());
      if (shop) add('shopee', shop, chOf('shopee').label || 'Beli di Shopee', chOf('shopee').note || '');
      if (lynk) add('lynk', lynk, chOf('lynk').label || 'Beli via Lynk.id', chOf('lynk').note || '');
      if (waOn()) add('whatsapp', waLink(orderText(p)), chOf('whatsapp').label || 'Pesan via WhatsApp', chOf('whatsapp').note || '');
    }
    const needSize = !p.soldout && list(p.sizes).length && !ui.size;
    return `<div class="opt"><h4>${esc((S.checkout && S.checkout.title) || 'Pesan lewat')}</h4>
      ${needSize ? '<p class="hint">Pilih ukuran dulu agar pesanan Anda tepat.</p>' : ''}
      <div class="chans">${rows.length ? rows.join('') : '<p class="hint">Belum ada kanal pesan yang aktif.</p>'}</div></div>
      <p class="note">${esc((S.checkout && S.checkout.footnote) || '')}</p>`;
  }

  function openModal(id) {
    ui.openId = id; ui.size = ''; ui.color = ''; ui.img = 0;
    $('#modal').classList.add('enter');
    renderModal();
    const c = $('#modal .close'); if (c) c.focus({ preventScroll: true });
  }
  function closeModal() {
    ui.openId = null;
    const m = $('#modal'); m.hidden = true; m.innerHTML = ''; m.classList.remove('enter');
    document.body.classList.remove('lock');
  }

  /* ---------- interaksi ---------- */
  document.addEventListener('click', (e) => {
    // di preview admin: klik tautan tidak boleh keluar dari halaman
    const link = e.target.closest('a[href]');
    if (isPreview && link) {
      e.preventDefault();
      const h = link.getAttribute('href');
      if (h && h[0] === '#') { const t = $(h); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
    }
    const el = e.target.closest('[data-act]');
    if (el) {
      const act = el.dataset.act;
      if (act === 'menu') { const n = $('#nav'); const o = n.classList.toggle('open'); el.setAttribute('aria-expanded', o); }
      if (act === 'cat') { ui.cat = el.dataset.cat; refreshGrid(); }
      if (act === 'dnext') { setDeck(ui.deck + 1, 1); startDeck(); }
      if (act === 'dprev') { setDeck(ui.deck - 1, -1); startDeck(); }
      if (act === 'ddot') { const t = +el.dataset.i; setDeck(t, t >= ui.deck ? 1 : -1); startDeck(); }
      if (act === 'copy') {
        const code = el.dataset.code, done = () => { const sm = el.querySelector('small'); if (sm) { sm.textContent = 'Tersalin ✓'; setTimeout(() => (sm.textContent = 'Kode'), 1800); } };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
        else { const t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); }
      }
      if (act === 'fslide') { setFeat(+el.dataset.i); startFeat(); }
      if (act === 'panel') { const hov = matchMedia('(hover: hover)').matches; if (!hov && !el.classList.contains('active')) { document.querySelectorAll('.panel').forEach((x) => x.classList.toggle('active', x === el)); return; } el.dataset.cat && (ui.cat = el.dataset.cat); ui.q = ''; ui.sort = 'default'; const q = $('#q'); if (q) q.value = ''; refreshGrid(); const t = $('#koleksi'); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
      if (act === 'tile') { ui.cat = el.dataset.cat; ui.q = ''; ui.sort = 'default'; const q = $('#q'); if (q) q.value = ''; refreshGrid(); const t = $('#koleksi'); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
      if (act === 'tscroll') { const t = $('.tiles'); if (t) t.scrollBy({ left: +el.dataset.d * Math.min(innerWidth * .7, 720), behavior: 'smooth' }); }
      if (act === 'open') openModal(el.dataset.id);
      if (act === 'close') closeModal();
      if (act === 'img') { ui.img = +el.dataset.i; renderModal(); }
      if (act === 'size' || act === 'color') { const v = el.dataset.v; ui[act] = ui[act] === v ? '' : v; renderModal(); }
      return;
    }
    if (e.target.id === 'modal') closeModal();
    if (link && link.closest('.menu')) $('#nav').classList.remove('open');
    // preview: klik bagian halaman → buka editornya di admin
    if (isPreview && !link) {
      const sec = e.target.closest('[data-section]');
      if (sec) parent.postMessage({ type: 'tandaseru:select', section: sec.dataset.section }, '*');
    }
  });
  document.addEventListener('mouseover', (e) => {
    const p = e.target.closest && e.target.closest('.panel');
    if (p && !p.classList.contains('active') && matchMedia('(hover: hover)').matches) document.querySelectorAll('.panel').forEach((x) => x.classList.toggle('active', x === p));
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'q') { ui.q = e.target.value; refreshGrid(); } });
  document.addEventListener('change', (e) => { if (e.target.id === 'sort') { ui.sort = e.target.value; refreshGrid(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.openId) closeModal(); });

  /* ---------- preview dari admin ---------- */
  const imgStore = {};
  if (isPreview) {
    window.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.type === 'tandaseru:state') {
        if (d.imgs) Object.assign(imgStore, d.imgs);
        const un = (v) => (typeof v === 'string' ? (v.startsWith('@img') && imgStore[v]) || v : Array.isArray(v) ? v.map(un) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, un(x)])) : v);
        S = TSStore.merge(TSStore.DEFAULTS, un(d.state)); render();
      }
      if (d.type === 'tandaseru:scroll') {
        const t = document.querySelector(`[data-section="${d.section}"]`) || (d.section === 'general' ? $('#top') : null);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (d.type === 'tandaseru:product') { if (d.id) openModal(d.id); else closeModal(); }
    });
    parent.postMessage({ type: 'tandaseru:ready' }, '*');
  }

  /* ---------- efek: progres, nav, parallax, kursor ---------- */
  function initFx() {
    const prog = $('#prog');
    let last = scrollY, tick = false;
    const onScroll = () => {
      const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
      if (prog) prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      const nav = $('#nav');
      if (nav) {
        const hide = y > last + 4 && y > 500 && !nav.classList.contains('open');
        if (y < last - 4 || y < 500) nav.classList.remove('hide');
        if (hide) nav.classList.add('hide');
        nav.classList.toggle('scrolled', y > 10);
        document.body.classList.toggle('nav-hidden', nav.classList.contains('hide'));
      }
      last = y;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { onScroll(); tick = false; }); } }, { passive: true });
    onScroll();

    // kursor khusus (hanya perangkat dengan mouse, bukan di preview admin)
    const c = $('#cursor');
    if (!c || isPreview || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let x = 0, y2 = 0, tx = 0, ty = 0, on = false, raf = 0;
    const loop = () => {
      x += (tx - x) * .24; y2 += (ty - y2) * .24;
      c.style.transform = `translate3d(${x}px, ${y2}px, 0)`;
      raf = (Math.abs(tx - x) > .3 || Math.abs(ty - y2) > .3) ? requestAnimationFrame(loop) : 0;
    };
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; x = tx; y2 = ty; c.classList.add('on'); }
      const t = e.target.closest && e.target.closest('[data-act=open], .look-item, .tile, .panel, .dcard.front');
      const l = e.target.closest && e.target.closest('a, button, summary, .chip, .field');
      c.classList.toggle('view', !!t);
      c.classList.toggle('link', !t && !!l);
      if (t) c.dataset.label = t.matches('.tile, .panel') ? 'Buka' : 'Lihat';
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('mouseleave', () => { on = false; c.classList.remove('on'); });
  }

  initDeck();
  render();
  initFx();
  setInterval(tickPromo, 1000); tickPromo();
})();
