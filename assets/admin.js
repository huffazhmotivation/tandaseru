/* tandaseru — panel admin dengan preview langsung */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rupiah = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(Number(n) || 0);
  const clone = TSStore.clone;

  /* ---------- state ---------- */
  const draft = TSStore.loadDraft();
  let S = draft || TSStore.load();
  let dirty = !!draft;
  let tab = 'general';
  let editing = null; // indeks produk yang sedang diedit
  let device = 'desktop';
  let previewReady = false;

  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => {
    const ks = p.split('.'); const last = ks.pop();
    const t = ks.reduce((a, k) => a[k], o);
    t[last] = v;
  };

  const TABS = [
    ['general', 'Umum'], ['hero', 'Hero'], ['values', 'Keunggulan'], ['catalog', 'Katalog'], ['promo', 'Promo'], ['checkout', 'Checkout'], ['lookbook', 'Lookbook'],
    ['about', 'Tentang'], ['steps', 'Cara pesan'], ['testimonials', 'Testimoni'], ['faq', 'FAQ'], ['footer', 'Footer']
  ];

  const NEW = {
    value: () => ({ title: 'Judul baru', text: 'Deskripsi singkat.' }),
    stat: () => ({ n: '0', l: 'keterangan' }),
    step: () => ({ title: 'Langkah baru', text: 'Penjelasan singkat.' }),
    look: () => ({ label: 'Suasana baru', text: 'Keterangan singkat.', image: '' }),
    quote: () => ({ name: 'Nama', city: 'Kota', text: 'Isi testimoni.' }),
    faq: () => ({ q: 'Pertanyaan baru?', a: 'Jawaban.' }),
    category: () => 'Kategori baru',
    product: () => ({ id: 'p' + Date.now().toString(36), name: 'Produk baru', category: S.catalog.categories[0] || '', price: 199000, compare: 0, badge: '', fig: '', shopee: '', lynk: '', tone: '#CFC7B8', images: [], sizes: 'S, M, L, XL', colors: '', desc: '', soldout: false, hidden: false })
  };

  /* ---------- komponen form ---------- */
  const fText = (label, path, o = {}) => {
    const v = getPath(S, path) ?? '';
    const type = o.type || 'text';
    const attrs = `data-bind="${path}"${o.num ? ' data-type="num"' : ''}${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}`;
    const input = o.area
      ? `<textarea rows="${o.rows || 3}" ${attrs}>${esc(v)}</textarea>`
      : `<input type="${type}" ${attrs} value="${esc(v)}">`;
    return `<label class="fld"><span>${label}</span>${input}${o.hint ? `<em>${o.hint}</em>` : ''}</label>`;
  };
  const fLines = (label, path, o = {}) =>
    `<label class="fld"><span>${label}</span><textarea rows="${o.rows || 4}" data-bind="${path}" data-type="lines">${esc((getPath(S, path) || []).join('\n'))}</textarea>${o.hint ? `<em>${o.hint}</em>` : ''}</label>`;
  const fCheck = (label, path) =>
    `<label class="chk"><input type="checkbox" data-bind="${path}" ${getPath(S, path) ? 'checked' : ''}>${label}</label>`;
  const fColor = (label, path) =>
    `<div class="color"><input type="color" data-bind="${path}" value="${esc(getPath(S, path))}" aria-label="${label}"><div><span>${label}</span><br><code>${esc(getPath(S, path))}</code></div></div>`;
  const fSelect = (label, path, opts) => {
    const v = getPath(S, path);
    const list = opts.includes(v) || v === '' ? opts : [...opts, v];
    return `<label class="fld"><span>${label}</span><select data-bind="${path}">${list.map((x) => `<option value="${esc(x)}"${x === v ? ' selected' : ''}>${esc(x || '— tidak ada —')}</option>`).join('')}</select></label>`;
  };
  const fSelectKV = (label, path, pairs) => {
    const v = getPath(S, path) ?? '';
    return `<label class="fld"><span>${label}</span><select data-bind="${path}">${pairs.map(([k, n]) => `<option value="${esc(k)}"${k === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
  };
  const FIGS = [['', 'Otomatis (dari kategori)'], ['koko', 'Baju koko'], ['gamis', 'Gamis / jubah'], ['kemeja', 'Kemeja / kaos'], ['celana', 'Celana'], ['sarung', 'Sarung'], ['outer', 'Jaket / outer'], ['peci', 'Peci / aksesori']];
  const fImage = (label, path, tonePath) => {
    const src = getPath(S, path);
    const tone = tonePath ? getPath(S, tonePath) : '#ddd';
    return `
      <div class="imgf">
        <div class="thumb" style="--tone:${esc(tone)}">${src ? `<img src="${esc(src)}" alt="">` : ''}</div>
        <div><p class="t">${label}</p>
          <div class="btns"><button class="mini solid" data-act="pick" data-path="${path}">${src ? 'Ganti foto' : 'Unggah foto'}</button>${src ? `<button class="mini danger" data-act="clear" data-path="${path}">Hapus</button>` : ''}</div>
        </div>
      </div>
      ${tonePath ? fColor('Warna ilustrasi (bila belum ada foto)', tonePath) : ''}`;
  };

  // editor daftar generik; render(item, base) mengembalikan field
  const listEditor = (path, label, tplKey, addLabel, render, min = 0) => {
    const arr = getPath(S, path);
    return `
      ${arr.map((it, i) => `
        <div class="item">
          <div class="item-h"><span>${label} ${i + 1}</span>
            <span class="ops">
              <button class="ic" data-act="move" data-path="${path}" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naik">↑</button>
              <button class="ic" data-act="move" data-path="${path}" data-i="${i}" data-d="1" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Turun">↓</button>
              <button class="ic danger" data-act="del" data-path="${path}" data-i="${i}" ${arr.length <= min ? 'disabled' : ''} aria-label="Hapus">✕</button>
            </span></div>
          ${render(it, `${path}.${i}`, i)}
        </div>`).join('')}
      <button class="add-btn" data-act="add" data-path="${path}" data-tpl="${tplKey}">+ ${addLabel}</button>`;
  };

  const head = (t, s) => `<h2>${t}</h2><p class="sub">${s}</p>`;
  const group = (t, body, extra = '') => `<div class="group"><h3>${t}${extra}</h3>${body}</div>`;

  /* ---------- panel ---------- */
  const PANELS = {
    general: () => head('Umum', 'Identitas toko, kontak, dan tampilan dasar.') +
      group('Brand',
        fText('Nama brand', 'brand.name') + fText('Tagline', 'brand.tagline') +
        fText('Nomor WhatsApp', 'brand.whatsapp', { hint: 'Format internasional tanpa + atau spasi. Contoh: 6281234567890' }) +
        `<div class="row2">${fText('Instagram', 'brand.instagram', { ph: 'tandaseru.id' })}${fText('Email', 'brand.email', { type: 'email' })}</div>` +
        fText('Kota', 'brand.city') + fText('Jam layanan', 'brand.hours')) +
      group('Bar pengumuman', fCheck('Tampilkan bar di paling atas', 'announcement.enabled') + fText('Teks', 'announcement.text')) +
      group('Warna',
        `<div class="swatches" role="group" aria-label="Preset warna aksen">${['#C0A062', '#B08D57', '#A9B7A0', '#D8C3A5', '#E8E1D3'].map((c) => `<button class="sw" style="background:${c}" data-act="set" data-path="theme.accent" data-v="${c}" aria-pressed="${S.theme.accent.toLowerCase() === c.toLowerCase()}" aria-label="Aksen ${c}"></button>`).join('')}</div>` +
        fColor('Warna aksen (emas)', 'theme.accent') +
        `<div class="swatches" role="group" aria-label="Preset warna utama">${['#1D4B3E', '#1B2A4A', '#4A1F2B', '#3A2A20', '#23262B'].map((c) => `<button class="sw" style="background:${c}" data-act="set" data-path="theme.primary" data-v="${c}" aria-pressed="${(S.theme.primary || '').toLowerCase() === c.toLowerCase()}" aria-label="Utama ${c}"></button>`).join('')}</div>` +
        fColor('Warna utama (panel besar)', 'theme.primary') +
        `<div class="swatches" role="group" aria-label="Preset latar">${['#F3EEE4', '#FAF8F4', '#EDEAE3', '#E9E4DA', '#FFFFFF'].map((c) => `<button class="sw" style="background:${c}" data-act="set" data-path="theme.bg" data-v="${c}" aria-pressed="${S.theme.bg.toLowerCase() === c.toLowerCase()}" aria-label="Latar ${c}"></button>`).join('')}</div>` +
        fColor('Warna latar halaman', 'theme.bg')),

    hero: () => head('Hero', 'Bagian pertama yang dilihat pengunjung.') +
      group('Teks',
        fText('Label kecil', 'hero.eyebrow') +
        fText('Judul besar', 'hero.title', { area: true, rows: 2, hint: 'Enter = pindah baris. Akhiri dengan ! untuk aksen warna.' }) +
        fText('Deskripsi', 'hero.text', { area: true, rows: 3 }) +
        fText('Teks bukti sosial', 'hero.proof') + fLines('Tiga fitur singkat (satu per baris)', 'hero.features', { rows: 3 }) +
        fText('Catatan kecil', 'hero.note', { area: true, rows: 2, hint: 'Poin keyakinan singkat, mis. garansi & pengiriman.' }) +
        `<div class="row2">${fText('Tombol utama', 'hero.cta')}${fText('Tombol kedua (WA)', 'hero.cta2')}</div>`) +
      group('Foto', fImage('Foto hero (rasio 4:5)', 'hero.image', 'hero.tone') + fText('Keterangan foto', 'hero.caption')),

    values: () => head('Keunggulan', 'Teks berjalan dan tiga poin nilai toko.') +
      group('Teks berjalan', fLines('Satu baris = satu kalimat', 'marquee', { rows: 5 })) +
      group('Poin keunggulan', fText('Judul bagian', 'values.title', { area: true, rows: 2 }) +
        listEditor('values.items', 'Poin', 'value', 'Tambah poin', (it, b) => fText('Judul', b + '.title') + fText('Deskripsi', b + '.text', { area: true, rows: 3 }), 1)),

    lookbook: () => head('Lookbook', 'Galeri foto bergaya majalah. Pakai foto potret (tinggi) untuk hasil terbaik.') +
      group('Judul', fText('Label kecil', 'lookbook.eyebrow') + fText('Judul', 'lookbook.title', { area: true, rows: 2 })) +
      group('Foto', listEditor('lookbook.items', 'Foto', 'look', 'Tambah foto', (it, b) => fImage('Foto', b + '.image') + fText('Judul', b + '.label') + fText('Keterangan', b + '.text'), 1)),

    promo: () => head('Promo', 'Banner promo yang tampil tepat setelah bagian “Jelajahi”.') +
      group('Tampilan', fCheck('Tampilkan banner promo', 'promo.enabled') + fText('Label badge', 'promo.badge') +
        fText('Judul', 'promo.title', { area: true, rows: 3, hint: 'Baris pertama biasa, baris berikutnya disorot kotak emas.' }) +
        fText('Deskripsi', 'promo.text', { area: true, rows: 2 })) +
      group('Angka diskon', `<div class="row2">${fText('Label', 'promo.percentLabel')}${fText('Angka besar', 'promo.percent', { ph: '30%' })}</div>`) +
      group('Tombol & kupon', fText('Teks tombol', 'promo.cta') + fText('Link tombol', 'promo.ctaLink', { ph: 'https://…', hint: 'Kosong = menuju katalog. Boleh isi link Shopee, Lynk.id, atau WhatsApp.' }) +
        fText('Kode kupon', 'promo.code', { hint: 'Kosongkan bila tanpa kode. Kode otomatis ikut tertulis di pesan WhatsApp pembeli.' })) +
      group('Waktu', fCheck('Tampilkan hitung mundur', 'promo.showCountdown') +
        fText('Berakhir pada', 'promo.endsAt', { type: 'datetime-local', hint: 'Setelah waktunya lewat, banner hilang otomatis. Kosongkan = tanpa batas waktu.' })),

    checkout: () => head('Checkout', 'Pilih kanal pesan yang ingin ditampilkan di jendela produk. Nonaktifkan yang tidak dipakai.') +
      group('Umum', fText('Judul pilihan', 'checkout.title') + fText('Catatan di bawah tombol', 'checkout.footnote', { hint: 'Contoh: stok terbatas, garansi tukar ukuran.' })) +
      group('Shopee', fCheck('Aktifkan Shopee', 'checkout.shopee.enabled') + fText('Link toko Shopee', 'checkout.shopee.url', { ph: 'https://shopee.co.id/nama-toko', hint: 'Dipakai bila produk tidak punya link sendiri. Link khusus tiap produk diisi di tab Katalog.' }) + fText('Teks tombol', 'checkout.shopee.label') + fText('Keterangan kecil', 'checkout.shopee.note')) +
      group('Lynk.id', fCheck('Aktifkan Lynk.id', 'checkout.lynk.enabled') + fText('Link Lynk.id', 'checkout.lynk.url', { ph: 'https://lynk.id/nama-anda', hint: 'Dipakai bila produk tidak punya link sendiri.' }) + fText('Teks tombol', 'checkout.lynk.label') + fText('Keterangan kecil', 'checkout.lynk.note')) +
      group('WhatsApp', fCheck('Aktifkan WhatsApp', 'checkout.whatsapp.enabled') + fText('Teks tombol', 'checkout.whatsapp.label') + fText('Keterangan kecil', 'checkout.whatsapp.note') + `<p class="sub" style="margin-top:-6px">Nomor WhatsApp diatur di tab Umum. Pesan otomatis berisi produk, ukuran, dan warna pilihan pembeli.</p>`),

    catalog: () => editing !== null && S.catalog.products[editing] ? productEditor(editing) : catalogPanel(),

    about: () => head('Tentang', 'Cerita singkat tentang brand Anda.') +
      group('Teks',
        fText('Label kecil', 'about.eyebrow') + fText('Judul', 'about.title', { area: true, rows: 2 }) +
        fText('Cerita', 'about.text', { area: true, rows: 7, hint: 'Beri baris kosong untuk memisah paragraf.' })) +
      group('Foto', fImage('Foto (rasio 4:5)', 'about.image', 'about.tone')) +
      group('Angka ringkas', listEditor('about.stats', 'Angka', 'stat', 'Tambah angka', (it, b) => `<div class="row2">${fText('Angka', b + '.n')}${fText('Keterangan', b + '.l')}</div>`, 1)),

    steps: () => head('Cara pesan', 'Langkah pemesanan yang tampil di blok gelap.') +
      group('Judul', fText('Judul bagian', 'steps.title')) +
      group('Langkah', listEditor('steps.items', 'Langkah', 'step', 'Tambah langkah', (it, b) => fText('Judul', b + '.title') + fText('Deskripsi', b + '.text', { area: true, rows: 2 }), 1)),

    testimonials: () => head('Testimoni', 'Kutipan pelanggan. Kosongkan semua untuk menyembunyikan bagian ini.') +
      group('Judul', fText('Judul bagian', 'testimonials.title')) +
      group('Daftar', listEditor('testimonials.items', 'Testimoni', 'quote', 'Tambah testimoni', (it, b) => `<div class="row2">${fText('Nama', b + '.name')}${fText('Kota', b + '.city')}</div>` + fText('Isi', b + '.text', { area: true, rows: 3 }))),

    faq: () => head('FAQ', 'Pertanyaan yang sering muncul. Kosongkan semua untuk menyembunyikan bagian ini.') +
      group('Judul', fText('Judul bagian', 'faq.title')) +
      group('Daftar', listEditor('faq.items', 'Pertanyaan', 'faq', 'Tambah pertanyaan', (it, b) => fText('Pertanyaan', b + '.q') + fText('Jawaban', b + '.a', { area: true, rows: 3 }))),

    footer: () => head('Footer', 'Ajakan terakhir dan informasi kontak (diambil dari tab Umum).') +
      group('Teks', fText('Judul', 'footer.title') + fText('Deskripsi', 'footer.text', { area: true, rows: 2 }) + fText('Teks tombol', 'footer.cta') + fText('Hak cipta', 'footer.copyright'))
  };

  function catalogPanel() {
    const ps = S.catalog.products;
    return head('Katalog', 'Atur produk, kategori, dan foto.') +
      group('Produk',
        ps.map((p, i) => `
          <div class="prow">
            <div class="thumb" style="--tone:${esc(p.tone)}">${p.images && p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : ''}</div>
            <button class="nm" data-act="editp" data-i="${i}"><b>${esc(p.name || 'Tanpa nama')}</b><span>${esc(p.category)} · ${rupiah(p.price)}</span></button>
            <div class="flags">${p.hidden ? '<span class="flag">Disembunyikan</span>' : ''}${p.soldout ? '<span class="flag s">Habis</span>' : ''}</div>
            <span class="ops">
              <button class="ic" data-act="move" data-path="catalog.products" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naik">↑</button>
              <button class="ic" data-act="move" data-path="catalog.products" data-i="${i}" data-d="1" ${i === ps.length - 1 ? 'disabled' : ''} aria-label="Turun">↓</button>
            </span>
          </div>`).join('') +
        `<button class="add-btn" data-act="addp">+ Tambah produk</button>`,
        `<span style="font-weight:500;letter-spacing:0;text-transform:none">${ps.length} item</span>`) +
      group('Kategori', S.catalog.categories.map((c, i) => `
          <div class="catrow">
            <input type="text" data-bind="catalog.categories.${i}" data-cat="${i}" data-old="${esc(c)}" value="${esc(c)}" aria-label="Kategori ${i + 1}">
            <button class="ic danger" data-act="delcat" data-i="${i}" aria-label="Hapus kategori">✕</button>
          </div>`).join('') + `<button class="add-btn" data-act="add" data-path="catalog.categories" data-tpl="category">+ Tambah kategori</button>`) +
      group('Produk unggulan (blok gelap)',
        fSelectKV('Produk yang disorot', 'featured.id', S.catalog.products.map((p) => [p.id, p.name])) +
        fText('Label kecil', 'featured.eyebrow') + fText('Judul', 'featured.title', { area: true, rows: 2 }) +
        fText('Teks (kosong = pakai deskripsi produk)', 'featured.text', { area: true, rows: 2 })) +
      group('Judul bagian kategori', fText('Label kecil', 'catalog.tilesEyebrow') + fText('Judul', 'catalog.tilesTitle')) +
      group('Judul bagian',
        fText('Label kecil', 'catalog.eyebrow') + fText('Judul', 'catalog.title') + fText('Deskripsi', 'catalog.text', { area: true, rows: 2 }));
  }

  function productEditor(i) {
    const p = S.catalog.products[i], b = `catalog.products.${i}`;
    const imgs = p.images || [];
    return `
      <button class="back" data-act="backp">← Semua produk</button>
      <div class="pe-h"><h2>${esc(p.name || 'Produk')}</h2>
        <div class="btns"><button class="mini" data-act="dupp" data-i="${i}">Duplikat</button><button class="mini danger" data-act="delp" data-i="${i}">Hapus</button></div></div>
      ${group('Foto produk', `
        <div class="gal">
          ${imgs.map((src, k) => `<div class="cell"><div class="thumb"><img src="${esc(src)}" alt=""></div>
            <button class="x" data-act="imgdel" data-path="${b}.images" data-i="${k}" aria-label="Hapus foto">×</button>
            ${k === 0 ? '<span class="main">Utama</span>' : `<button class="set" data-act="imgmain" data-path="${b}.images" data-i="${k}">Jadikan utama</button>`}</div>`).join('')}
          ${imgs.length < 4 ? `<button class="add" data-act="picks" data-path="${b}.images">+ Foto<br>(maks. 4)</button>` : ''}
        </div>` + fColor('Warna ilustrasi (bila belum ada foto)', b + '.tone'))}
      ${group('Informasi',
        fText('Nama produk', b + '.name') +
        fSelectKV('Bentuk ilustrasi (bila belum ada foto)', b + '.fig', FIGS) +
        `<div class="row2">${fSelect('Kategori', b + '.category', S.catalog.categories)}${fSelect('Label', b + '.badge', ['', 'Baru', 'Best seller', 'Diskon', 'Terbatas'])}</div>` +
        `<div class="row2">${fText('Harga (Rp)', b + '.price', { num: true, type: 'number' })}${fText('Harga coret (opsional)', b + '.compare', { num: true, type: 'number' })}</div>` +
        fText('Deskripsi', b + '.desc', { area: true, rows: 4 }) +
        fText('Ukuran', b + '.sizes', { hint: 'Pisahkan dengan koma. Contoh: S, M, L, XL' }) +
        fText('Warna', b + '.colors', { hint: 'Pisahkan dengan koma. Contoh: Mocca, Hitam, Sage' }))}
      ${group('Link marketplace produk ini (opsional)',
        fText('Link Shopee produk', b + '.shopee', { ph: 'https://shopee.co.id/...', hint: 'Kosong = pakai link toko di tab Checkout.' }) +
        fText('Link Lynk.id produk', b + '.lynk', { ph: 'https://lynk.id/...' }))}
      ${group('Status', fCheck('Stok habis (tetap tampil, tombol jadi “tanya restock”)', b + '.soldout') + fCheck('Sembunyikan dari katalog', b + '.hidden'))}`;
  }

  /* ---------- render ---------- */
  function renderTabs() {
    const used = JSON.stringify(S).length;
    const mb = used / 1024 / 1024, pct = Math.min(100, (mb / 5) * 100);
    $('#tabs').innerHTML = TABS.map(([id, name], i) =>
      `<button class="tab" data-act="tab" data-id="${id}" aria-current="${id === tab}"><small>${String(i + 1).padStart(2, '0')}</small>${name}</button>`).join('') +
      `<div class="meter">Penyimpanan ${mb.toFixed(1)} / ±5 MB<div class="bar"><i class="${pct > 85 ? 'warn' : ''}" style="width:${pct}%"></i></div></div>`;
  }
  function renderEditor(keepScroll = true) {
    const ed = $('#editor'); const y = keepScroll ? ed.scrollTop : 0;
    ed.innerHTML = PANELS[tab]();
    ed.scrollTop = y;
  }
  function applyAdminTheme() {
    const r = document.documentElement.style;
    r.setProperty('--accent', S.theme.accent); r.setProperty('--primary', S.theme.primary || '#1D4B3E'); r.setProperty('--bg', S.theme.bg);
  }
  function renderAll() { applyAdminTheme(); renderTabs(); renderEditor(); }

  /* ---------- status & preview ---------- */
  function setStatus() {
    const s = $('#status');
    s.textContent = dirty ? 'Belum diterbitkan' : 'Tersimpan';
    s.classList.toggle('dirty', dirty);
    $('#publish').disabled = !dirty;
  }
  let raf = 0, draftTimer = 0;
  // foto base64 dikirim ke preview sekali saja (diganti token) agar mengetik tidak lag
  const imgTok = new Map(), sentTok = new Set(), tokData = {};
  let tokN = 0;
  function slim(v, need) {
    if (typeof v === 'string') {
      if (v.length > 4000 && v.startsWith('data:')) {
        let t = imgTok.get(v);
        if (!t) { t = '@img' + (++tokN); imgTok.set(v, t); tokData[t] = v; }
        if (!sentTok.has(t)) { need[t] = v; sentTok.add(t); }
        return t;
      }
      return v;
    }
    if (Array.isArray(v)) return v.map((x) => slim(x, need));
    if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = slim(v[k], need); return o; }
    return v;
  }
  function pushPreview() {
    clearTimeout(raf);
    raf = setTimeout(() => {
      const w = $('#frame').contentWindow;
      if (!w || !previewReady) return;
      const need = {}, state = slim(S, need);
      w.postMessage({ type: 'tandaseru:state', state, imgs: need }, '*');
    }, 50);
  }
  function changed() {
    dirty = true; setStatus(); pushPreview(); applyAdminTheme();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { TSStore.saveDraft(S); renderTabsMeter(); }, 400);
  }
  function renderTabsMeter() {
    const m = $('.meter'); if (!m) return;
    const mb = JSON.stringify(S).length / 1024 / 1024, pct = Math.min(100, (mb / 5) * 100);
    m.firstChild.textContent = `Penyimpanan ${mb.toFixed(1)} / ±5 MB`;
    const bar = $('.bar i', m); bar.style.width = pct + '%'; bar.classList.toggle('warn', pct > 85);
  }
  const toPreview = (msg) => { const w = $('#frame').contentWindow; if (w && previewReady) w.postMessage(msg, '*'); };

  function fit() {
    const stage = $('#stage'), screen = $('#screen'), frame = $('#frame');
    const W = stage.clientWidth - 40, H = stage.clientHeight - 20;
    if (W <= 0 || H <= 0) return;
    let vw, vh, s;
    if (device === 'desktop') { vw = 1360; s = Math.min(1, W / vw); vh = H / s; screen.style.width = W + 'px'; screen.style.height = H + 'px'; }
    else { vw = 390; vh = 844; s = Math.min(1, (H - 24) / vh); screen.style.width = vw * s + 'px'; screen.style.height = vh * s + 'px'; }
    screen.classList.toggle('mobile', device === 'mobile');
    frame.style.width = vw + 'px'; frame.style.height = vh + 'px'; frame.style.transform = `scale(${s})`;
    if (device === 'desktop') screen.style.width = Math.min(W, vw * s) + 'px';
  }

  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false; t.classList.toggle('err', !!err);
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), err ? 5000 : 3600);
  }

  /* ---------- gambar ---------- */
  /* ---- kompresi foto: WebP, dimensi maks 1600px, kualitas adaptif ---- */
  const WEBP_OK = (() => { try { return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp'); } catch (e) { return false; } })();
  const fmtKB = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  async function loadBitmap(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* lanjut ke Image */ } }
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gagal membaca gambar: ' + file.name)); };
      img.src = url;
    });
  }
  async function compress(file, max = 1600, target = 230 * 1024) {
    if (!/^image\//.test(file.type)) throw new Error('Bukan file gambar: ' + file.name);
    const bmp = await loadBitmap(file);
    const w = bmp.width, h = bmp.height, r = Math.min(1, max / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * r)), th = Math.max(1, Math.round(h * r));
    // perkecil bertahap (÷2) supaya hasil tetap tajam, bukan sekali lompat
    let src = bmp, cw = w, ch = h;
    while (cw / 2 > tw) {
      cw = Math.round(cw / 2); ch = Math.round(ch / 2);
      const t = document.createElement('canvas'); t.width = cw; t.height = ch;
      const tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(src, 0, 0, cw, ch); src = t;
    }
    const c = document.createElement('canvas'); c.width = tw; c.height = th;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    const mime = WEBP_OK ? 'image/webp' : 'image/jpeg';
    if (!WEBP_OK) { x.fillStyle = '#fff'; x.fillRect(0, 0, tw, th); } // JPEG tidak mendukung transparansi
    x.drawImage(src, 0, 0, tw, th);
    if (bmp.close) bmp.close();
    // turunkan kualitas bertahap hanya bila ukuran masih di atas target
    let q = 0.88, url = c.toDataURL(mime, q);
    const bytes = (u) => Math.round((u.length - u.indexOf(',') - 1) * 0.75);
    while (bytes(url) > target && q > 0.6) { q -= 0.06; url = c.toDataURL(mime, q); }
    return { url, before: file.size, after: bytes(url), w: tw, h: th, webp: WEBP_OK };
  }
  function pickImages(multi) {
    return new Promise((res) => {
      const inp = $('#imgInput'); inp.multiple = !!multi; inp.value = '';
      inp.onchange = async () => {
        const files = [...inp.files]; if (!files.length) return res([]);
        toast(`Mengompres ${files.length} foto…`);
        try {
          const out = [];
          for (const f of files) out.push(await compress(f)); // berurutan agar memori hemat
          const b = out.reduce((a, o) => a + o.before, 0), a = out.reduce((n, o) => n + o.after, 0);
          toast(`${out.length} foto → ${out[0].webp ? 'WebP' : 'JPEG'} · ${fmtKB(b)} jadi ${fmtKB(a)} (hemat ${Math.max(0, Math.round((1 - a / b) * 100))}%)`);
          res(out.map((o) => o.url));
        } catch (e) { toast(e.message, true); res([]); }
      };
      inp.click();
    });
  }

  /* ---------- aksi ---------- */
  const actions = {
    tab(el) {
      tab = el.dataset.id; editing = null; renderAll();
      toPreview({ type: 'tandaseru:product', id: null });
      const first = S.catalog.products.find((p) => !p.hidden);
      toPreview({ type: 'tandaseru:product', id: tab === 'checkout' && first ? first.id : null });
      if (tab !== 'checkout') toPreview({ type: 'tandaseru:scroll', section: tab });
      $('#editor').scrollTop = 0;
    },
    async pick(el) {
      const [src] = await pickImages(false); if (!src) return;
      setPath(S, el.dataset.path, src); changed(); renderEditor();
    },
    clear(el) { setPath(S, el.dataset.path, ''); changed(); renderEditor(); },
    async picks(el) {
      const arr = getPath(S, el.dataset.path);
      const srcs = await pickImages(true);
      srcs.slice(0, 4 - arr.length).forEach((s) => arr.push(s));
      changed(); renderEditor();
    },
    imgdel(el) { getPath(S, el.dataset.path).splice(+el.dataset.i, 1); changed(); renderEditor(); },
    imgmain(el) { const a = getPath(S, el.dataset.path); a.unshift(a.splice(+el.dataset.i, 1)[0]); changed(); renderEditor(); },
    set(el) { setPath(S, el.dataset.path, el.dataset.v); changed(); renderEditor(); },
    add(el) { getPath(S, el.dataset.path).push(NEW[el.dataset.tpl]()); changed(); renderAll(); },
    del(el) { getPath(S, el.dataset.path).splice(+el.dataset.i, 1); changed(); renderAll(); },
    move(el) {
      const a = getPath(S, el.dataset.path), i = +el.dataset.i, j = i + +el.dataset.d;
      if (j < 0 || j >= a.length) return;
      [a[i], a[j]] = [a[j], a[i]]; changed(); renderEditor();
    },
    delcat(el) {
      const i = +el.dataset.i, name = S.catalog.categories[i];
      const used = S.catalog.products.filter((p) => p.category === name).length;
      if (used && !confirm(`Kategori “${name}” dipakai ${used} produk. Hapus tetap? Produk tersebut jadi tanpa kategori.`)) return;
      S.catalog.categories.splice(i, 1);
      S.catalog.products.forEach((p) => { if (p.category === name) p.category = ''; });
      changed(); renderAll();
    },
    editp(el) {
      editing = +el.dataset.i; renderEditor(false);
      toPreview({ type: 'tandaseru:scroll', section: 'catalog' });
      toPreview({ type: 'tandaseru:product', id: S.catalog.products[editing].id });
    },
    backp() { editing = null; renderEditor(false); toPreview({ type: 'tandaseru:product', id: null }); },
    addp() {
      S.catalog.products.unshift(NEW.product()); editing = 0; changed(); renderAll();
      toPreview({ type: 'tandaseru:product', id: S.catalog.products[0].id });
    },
    dupp(el) {
      const c = clone(S.catalog.products[+el.dataset.i]); c.id = NEW.product().id; c.name += ' (salinan)';
      S.catalog.products.splice(+el.dataset.i + 1, 0, c); editing = +el.dataset.i + 1; changed(); renderAll();
    },
    delp(el) {
      const p = S.catalog.products[+el.dataset.i];
      if (!confirm(`Hapus “${p.name}” dari katalog?`)) return;
      S.catalog.products.splice(+el.dataset.i, 1); editing = null; changed(); renderAll();
      toPreview({ type: 'tandaseru:product', id: null });
    },
    publish() {
      try { TSStore.publish(S); } catch (e) {
        toast('Penyimpanan penuh. Hapus beberapa foto atau gunakan foto lebih kecil.', true); return;
      }
      TSStore.clearDraft(); dirty = false; setStatus(); toast('Tersimpan — situs sudah diperbarui');
    },
    'menu-more'() { const m = $('#moreMenu'); m.hidden = !m.hidden; },
    'export-site'() {
      const blob = new Blob(['window.TANDASERU_DATA = ' + JSON.stringify(S, null, 2) + ';\n'], { type: 'text/javascript' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'data.js'; a.click(); URL.revokeObjectURL(a.href);
      toast('data.js terunduh — timpa file assets/data.js lalu deploy ulang');
    },
    export() {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `tandaseru-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href);
    },
    import() { $('#jsonInput').value = ''; $('#jsonInput').click(); },
    reset() {
      if (!confirm('Kembalikan semua konten ke bawaan? Perubahan yang sudah diterbitkan juga akan terhapus.')) return;
      TSStore.reset(); S = clone(TSStore.DEFAULTS); dirty = false; editing = null; renderAll(); setStatus(); pushPreview();
      toast('Konten dikembalikan ke bawaan');
    },
    view(el) {
      $('#app').dataset.view = el.dataset.v;
      $$('.view-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      requestAnimationFrame(fit);
    },
    device(el) {
      device = el.dataset.v;
      $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      fit();
    }
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!e.target.closest('#moreMenu') && !e.target.closest('#more')) $('#moreMenu').hidden = true;
    if (!el) return;
    const fn = actions[el.dataset.act];
    if (fn) { if (el.closest('#moreMenu')) $('#moreMenu').hidden = true; fn(el); }
  });

  // binding generik: setiap input dengan data-bind langsung menulis ke state
  document.addEventListener('input', (e) => {
    const el = e.target; const path = el.dataset && el.dataset.bind;
    if (!path) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.type === 'num') v = Math.max(0, Number(v) || 0);
    if (el.dataset.type === 'lines') v = v.split('\n');
    // ganti nama kategori → ikut perbarui produk
    if (el.dataset.cat !== undefined) {
      const old = el.dataset.old;
      S.catalog.products.forEach((p) => { if (p.category === old) p.category = v; });
      el.dataset.old = v;
    }
    setPath(S, path, v);
    if (el.type === 'color') { const c = el.parentElement.querySelector('code'); if (c) c.textContent = v; }
    changed();
    // judul produk pada header editor
    if (/^catalog\.products\.\d+\.name$/.test(path)) { const h = $('.pe-h h2'); if (h) h.textContent = v || 'Produk'; }
  });
  // checkbox & select yang mengubah tampilan panel
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.bind && el.dataset.cat !== undefined) renderEditor();
  });

  $('#jsonInput').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      S = TSStore.merge(TSStore.DEFAULTS, JSON.parse(await f.text()));
      editing = null; changed(); renderAll(); toast('Data diimpor — periksa lalu terbitkan');
    } catch (err) { toast('File tidak valid', true); }
  });

  // pesan dari iframe preview
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === 'tandaseru:ready') {
      previewReady = true; sentTok.clear(); pushPreview();
      if (tab !== 'general') toPreview({ type: 'tandaseru:scroll', section: tab });
    }
    if (d.type === 'tandaseru:select' && TABS.some(([id]) => id === d.section) && d.section !== tab) {
      tab = d.section; editing = null; renderAll();
    }
  });

  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('resize', fit);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (dirty) actions.publish(); }
  });

  // sinkronkan preview begitu iframe siap — tidak bergantung pada urutan pesan "ready"
  const frameEl = $('#frame');
  const syncFrame = () => { previewReady = true; sentTok.clear(); pushPreview(); if (tab !== 'general') toPreview({ type: 'tandaseru:scroll', section: tab }); };
  frameEl.addEventListener('load', syncFrame);
  try { if (frameEl.contentDocument && frameEl.contentDocument.readyState === 'complete' && frameEl.contentDocument.location.href !== 'about:blank') syncFrame(); } catch (e) { /* abaikan */ }
  renderAll(); setStatus(); fit();
  if (draft) toast('Draf yang belum diterbitkan dipulihkan');
})();
