/* tandaseru — data & penyimpanan bersama (dipakai situs & admin) */
(function (global) {
  const KEY = 'tandaseru:v9';
  const DRAFT = 'tandaseru:draft9';

  const DEFAULTS = {
    theme: { accent: '#C0A062', primary: '#1D4B3E', bg: '#F3EEE4' },
    brand: {
      name: 'tandaseru',
      tagline: 'Busana muslim pria modern',
      whatsapp: '6281234567890',
      instagram: 'tandaseru.id',
      email: 'halo@tandaseru.id',
      city: 'Bandung, Indonesia',
      hours: 'Senin–Sabtu, 09.00–17.00 WIB'
    },
    // kanal checkout: aktifkan/nonaktifkan dan isi link toko dari admin
    checkout: {
      title: 'Pesan lewat',
      footnote: 'Stok terbatas per batch · Tukar ukuran gratis 7 hari',
      shopee: { enabled: true, label: 'Beli di Shopee', note: 'Garansi platform & bisa pakai voucher', url: 'https://shopee.co.id/' },
      lynk: { enabled: true, label: 'Beli via Lynk.id', note: 'Bayar cepat, tanpa ribet daftar', url: 'https://lynk.id/' },
      whatsapp: { enabled: true, label: 'Pesan via WhatsApp', note: 'Konsultasi ukuran gratis, dibalas cepat' }
    },
    announcement: { enabled: true, text: 'Batch ini terbatas — model yang habis harus menunggu produksi berikutnya. Gratis ongkir Jabodetabek di atas Rp350.000' },
    hero: {
      eyebrow: 'Koleksi baru',
      title: 'Sekali pakai,\nlangsung dilirik!',
      proof: 'Dipilih pria yang ingin tampil rapi tanpa ribet',
      features: ['Bahan Premium', 'Nyaman Salat', 'Stok Terbatas'],
      text: 'Bosan tampil biasa saja di kajian, kantor, dan acara keluarga? Koko dan busana muslim pria kami dipotong rapi, adem seharian, dan lega dipakai salat — jadi Anda percaya diri dari subuh sampai isya.',
      cta: 'Pilih gayamu sekarang',
      cta2: 'Konsultasi ukuran gratis',
      note: '✓ Tukar ukuran gratis 7 hari   ✓ Bahan adem, tidak menerawang   ✓ Dikirim 1–2 hari kerja',
      image: 'foto/gamis-zayd-1.jpg',
      tone: '#CDBDA6',
      caption: 'Koleksi musim ini'
    },
    marquee: ['Tukar ukuran gratis 7 hari', 'Adem & nyaman untuk salat', 'Stok terbatas tiap batch', 'Dikirim 1–2 hari kerja'],
    featured: {
      eyebrow: 'Paling banyak diburu',
      title: 'Koko yang bikin Anda dipuji sebelum sempat bicara.',
      text: 'Kerah shanghai yang tegas, placket tersembunyi, bahan jatuh yang tidak mudah kusut. Pantas untuk salat Jumat, akad nikah saudara, sampai rapat pagi. Stok batch ini terbatas — begitu ukuran Anda habis, harus menunggu produksi berikutnya.',
      id: 'p1'
    },
    lookbook: {
      eyebrow: 'Lookbook',
      title: 'Satu lemari, empat suasana.',
      items: [
        { label: 'Kajian & salat', text: 'Tenang, rapi, dan lega saat sujud.', image: 'foto/look-kajian.jpg' },
        { label: 'Bersama rekan & keluarga', text: 'Seragam yang tidak terasa seragam.', image: 'foto/look-bersama.jpg' },
        { label: 'Hari raya', text: 'Warna hangat untuk hari yang dinanti.', image: 'foto/look-hariraya.jpg' },
        { label: 'Santai akhir pekan', text: 'Bordir halus, tetap sopan, tetap kece.', image: 'foto/look-santai.jpg' }
      ]
    },
    promo: {
      enabled: true,
      badge: 'Promo berjalan',
      title: 'Flash Sale\nKoleksi Pilihan',
      text: 'Diskon spesial untuk model-model pilihan. Berlaku selama stok batch ini tersedia.',
      percentLabel: 'Hemat hingga',
      percent: '30%',
      cta: 'Ambil promo',
      ctaLink: '',
      code: 'TANDA30',
      showCountdown: true,
      endsAt: '2026-12-31T23:59'
    },
    values: {
      title: 'Lelaki yang sudah mencoba, jarang kembali ke baju lamanya.',
      items: [
        { title: 'Adem, bukan gerah', text: 'Katun toyobo dan linen blend yang bernapas. Dipakai dari subuh sampai isya, punggung tetap kering dan bahan tidak menerawang.' },
        { title: 'Pas di bahu, lega saat sujud', text: 'Regular fit yang rapi saat berdiri dan tetap lega saat rukuk dan sujud. Tidak kedodoran, tidak menyiksa.' },
        { title: 'Satu lemari, semua cocok', text: 'Sand, sage, navy, arang. Dipadu dengan apa pun tetap serasi, jadi tidak perlu lama mikir tiap pagi.' }
      ]
    },
    catalog: {
      tilesEyebrow: 'Jelajahi',
      tilesTitle: 'Cari yang pas untuk harimu',
      eyebrow: 'Katalog',
      title: 'Pilih yang paling Anda banget',
      text: 'Klik produk, pilih ukuran dan warna, lalu pesan lewat Shopee, Lynk.id, atau WhatsApp. Stok tiap model dibatasi — yang Anda taksir hari ini bisa habis besok.',
      // tiap kategori: nama (dipakai produk), teks pendek, foto sampul, bentuk ilustrasi — semua bisa diubah dari admin
      categories: ['Koko', 'Gamis', 'Kemeja', 'Celana', 'Sarung', 'Outer', 'Aksesori'].map((name) => ({ name, text: '', image: '', fig: '' })),
      products: [
        { id: 'p1', name: 'Koko Arkan', category: 'Koko', price: 289000, compare: 0, badge: 'Baru', fig: '', tone: '#D2C7B2', images: ['foto/koko-arkan.jpg'], sizes: 'S, M, L, XL, XXL', colors: 'Sand, Hitam, Sage', desc: 'Rapi saat berdiri di saf depan, adem saat khutbah panjang. Katun toyobo, kerah shanghai, saku dada, placket tersembunyi. Bukan sekadar koko — ini koko yang bikin orang bertanya, “beli di mana?”', shopee: '', lynk: '', soldout: false, hidden: false },
        { id: 'p2', name: 'Gamis Zayd', category: 'Gamis', price: 459000, compare: 0, badge: 'Best seller', fig: '', tone: '#E6E0D2', images: ['foto/gamis-zayd-1.jpg', 'foto/gamis-zayd-2.jpg'], sizes: 'M, L, XL, XXL', colors: 'Putih tulang, Hitam, Navy', desc: 'Wibawa tanpa usaha. Gamis rayon twill yang jatuh sempurna sampai mata kaki — pas untuk Jumatan, Idulfitri, dan foto keluarga yang akan dikenang bertahun-tahun.', shopee: '', lynk: '', soldout: false, hidden: false },
        { id: 'p3', name: 'Kemeja Linen Fahri', category: 'Kemeja', price: 319000, compare: 0, badge: '', fig: '', tone: '#8E967C', images: ['foto/kemeja-fahri-1.jpg', 'foto/kemeja-fahri-2.jpg'], sizes: 'S, M, L, XL, XXL', colors: 'Sage, Krem, Biru muda', desc: 'Dari kantor ke majelis taklim tanpa ganti baju. Linen blend dengan dua saku dada; makin sering dipakai, makin enak teksturnya.', shopee: '', lynk: '', soldout: false, hidden: false },
        { id: 'p4', name: 'Celana Chino Raka', category: 'Celana', price: 349000, compare: 399000, badge: 'Diskon', fig: '', tone: '#2A2824', images: ['foto/celana-raka.jpg'], sizes: '28, 30, 32, 34, 36', colors: 'Hitam, Arang, Khaki', desc: 'Celana yang tidak ngatung dan tidak bikin ribet saat rukuk dan sujud. Potongan chino lurus, pinggang nyaman, saku fungsional. Harga diskon berlaku selama stok batch ini ada.', shopee: '', lynk: '', soldout: false, hidden: false },
        { id: 'p5', name: 'Sarung Tenun Ghifar', category: 'Sarung', price: 239000, compare: 0, badge: '', fig: '', tone: '#2F3B4A', images: ['foto/sarung-ghifar-1.jpg', 'foto/sarung-ghifar-2.jpg'], sizes: 'All size (115 × 200 cm)', colors: 'Navy, Hijau lumut, Cokelat', desc: 'Tenun halus yang tidak luntur dan tidak melorot saat salat. Satu sarung, dipakai bertahun-tahun.', shopee: '', lynk: '', soldout: false, hidden: false },
        { id: 'p6', name: 'Jubah Hoodie Daffa', category: 'Outer', price: 399000, compare: 0, badge: '', fig: '', tone: '#2E2D2A', images: ['foto/jubah-hoodie-daffa.jpg'], sizes: 'M, L, XL, XXL', colors: 'Putih, Hitam', desc: 'Jubah berkerudung dengan list merah marun yang tegas. Ringan, jatuh, dan jadi pusat perhatian di mana pun. Sedang habis — tinggalkan nomor Anda, kami kabari lebih dulu saat restock.', shopee: '', lynk: '', soldout: true, hidden: false },
        { id: 'p7', name: 'Peci Rajut Hanif', category: 'Aksesori', price: 89000, compare: 0, badge: '', fig: '', tone: '#1F1E1C', images: ['foto/peci-hanif-1.jpg', 'foto/peci-hanif-2.jpg'], sizes: 'All size (56–60 cm)', colors: 'Hitam, Arang, Putih', desc: 'Pas di kepala, tidak panas, tidak melar. Pelengkap kecil yang bikin tampilan Anda jauh lebih utuh.', shopee: '', lynk: '', soldout: false, hidden: false },
        { id: 'p8', name: 'Setelan Koko Ilham', category: 'Koko', price: 429000, compare: 0, badge: 'Terbatas', fig: '', tone: '#A79A82', images: ['foto/setelan-ilham.jpg'], sizes: 'S, M, L, XL, XXL', colors: 'Mocca, Hitam', desc: 'Koko dan celana senada, tinggal pakai. Jawaban untuk hari raya dan acara keluarga tanpa pusing mix & match.', shopee: '', lynk: '', soldout: false, hidden: false }
      ]
    },
    about: {
      eyebrow: 'Cerita kami',
      title: 'Kami capek melihat baju muslim pria yang cuma “asal ada”.',
      text: 'tandaseru lahir dari kegelisahan sederhana: kenapa lelaki yang ingin berpakaian sopan harus puas dengan bahan panas, potongan kaku, dan tampilan biasa saja?\n\nKami merancang dalam jumlah kecil, menguji bahan sendiri sebelum dijual, dan menjahit bersama penjahit rumahan di Bandung. Setiap potong harus lulus satu pertanyaan: nyaman untuk salat, pantas untuk dilihat. Kalau belum, tidak kami jual.\n\nTanda serunya? Itu reaksi yang kami harap muncul saat Anda berkaca.',
      image: 'foto/about.jpg',
      tone: '#9AA08A',
      stats: [
        { n: '8', l: 'model per batch' },
        { n: '7 hari', l: 'tukar ukuran gratis' },
        { n: 'S–XXXL', l: 'ukuran tersedia' }
      ]
    },
    steps: {
      title: 'Tiga langkah, selesai.',
      items: [
        { title: 'Pilih & klik', text: 'Pilih model, ukuran, dan warna. Bingung soal ukuran? Kami bantu pilihkan, gratis.' },
        { title: 'Pesan lewat jalur favorit', text: 'Checkout via Shopee, Lynk.id, atau WhatsApp — mana yang paling nyaman untuk Anda.' },
        { title: 'Terima & pakai', text: 'Dikemas 1–2 hari kerja. Kalau tidak pas, tukar ukuran dalam 7 hari.' }
      ]
    },
    testimonials: {
      title: 'Mereka sudah membuktikan.',
      items: [
        { name: 'Rizky', city: 'Jakarta', text: 'Kokonya adem banget, dipakai seharian di kantor tidak gerah. Orang kantor sampai nanya belinya di mana.' },
        { name: 'Fajar', city: 'Bandung', text: 'Ukurannya akurat dan adminnya sabar bantu pilih ukuran. Sudah dua kali repeat order.' },
        { name: 'Dimas', city: 'Surabaya', text: 'Bahannya tidak menerawang dan lega dipakai sujud. Pengiriman cepat, packing rapi.' }
      ]
    },
    faq: {
      title: 'Masih ragu? Wajar. Ini jawabannya.',
      items: [
        { q: 'Takut ukurannya tidak pas?', a: 'Kirim tinggi, berat badan, dan lingkar dada lewat WhatsApp, kami rekomendasikan ukuran yang paling pas. Kalau tetap tidak cocok, tukar ukuran gratis dalam 7 hari.' },
        { q: 'Bahannya panas atau menerawang?', a: 'Tidak. Kami hanya memakai katun toyobo, linen blend, dan rayon twill yang bernapas dan cukup tebal untuk tidak menerawang, tapi tetap adem.' },
        { q: 'Aman belanja di sini?', a: 'Pilih kanal yang paling Anda percaya: Shopee dengan garansi platform, Lynk.id, atau WhatsApp langsung. Stok kami konfirmasi sebelum Anda membayar.' },
        { q: 'Berapa lama sampai?', a: 'Pesanan dikemas 1–2 hari kerja. Estimasi tiba 2–4 hari untuk Pulau Jawa dan 4–7 hari untuk luar Jawa.' }
      ]
    },
    footer: {
      title: 'Satu klik lagi, tampilan baru Anda!',
      text: 'Stok tiap model terbatas. Amankan ukuran Anda sekarang, atau tanya dulu — kami balas cepat di jam kerja.',
      cta: 'Pesan sekarang',
      copyright: 'Hak cipta dilindungi.'
    }
  };

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const clone = (v) => JSON.parse(JSON.stringify(v));

  // gabungkan data tersimpan dengan default: objek digabung dalam, array diganti utuh
  function mergeDeep(base, over) {
    if (!isObj(base) || !isObj(over)) return over === undefined ? clone(base) : over;
    const out = {};
    for (const k of Object.keys(base)) out[k] = k in over ? mergeDeep(base[k], over[k]) : clone(base[k]);
    for (const k of Object.keys(over)) if (!(k in out)) out[k] = over[k];
    return out;
  }

  // kategori lama berupa teks ("Koko") otomatis diubah jadi objek; nama kosong/kembar dibuang
  function normCats(s) {
    const c = s && s.catalog; if (!c) return s;
    const seen = new Set();
    c.categories = (Array.isArray(c.categories) ? c.categories : [])
      .map((x) => (typeof x === 'string' ? { name: x } : x))
      .filter((x) => x && typeof x.name === 'string' && x.name.trim())
      .map((x) => ({ name: x.name.trim(), text: x.text || '', image: x.image || '', fig: x.fig || '' }))
      .filter((x) => { const k = x.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    return s;
  }
  const merge = (base, over) => normCats(mergeDeep(base, over));

  /* ---------- penyimpanan ----------
     TERBIT → Cloudflare KV lewat /api/content (dibaca semua pengunjung, semua perangkat)
     DRAF   → IndexedDB di browser admin (hanya draf yang belum diterbitkan)           */
  const API = '/api/content', IMG_API = '/api/img', TOKEN_KEY = 'tandaseru:token';
  const IDB_NAME = KEY.split(':')[0] + '-store', IDB_TABLE = 'kv', FLAG = KEY + ':idb';
  const mem = {};            // salinan draf/data lama di memori agar load() tetap sinkron
  let remote = null;         // data terbit dari KV
  let db = null, dbP = null;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) {} };
  const lsFlag = () => lsSet(FLAG, '1');

  function openDB() {
    if (dbP) return dbP;
    dbP = new Promise((res) => {
      try {
        if (!global.indexedDB) return res(null);
        const r = indexedDB.open(IDB_NAME, 1);
        r.onupgradeneeded = () => { r.result.createObjectStore(IDB_TABLE); };
        r.onsuccess = () => res(r.result);
        r.onerror = r.onblocked = () => res(null);
      } catch (e) { res(null); }
    }).then((d) => (db = d));
    return dbP;
  }
  const idb = (mode, fn) => new Promise((res, rej) => {
    try {
      const tx = db.transaction(IDB_TABLE, mode), out = fn(tx.objectStore(IDB_TABLE));
      tx.oncomplete = () => res(out && out.result);
      tx.onerror = tx.onabort = () => rej(tx.error || new Error('IndexedDB gagal'));
    } catch (e) { rej(e); }
  });

  // muat draf (dan data lama versi sebelum KV) dari IndexedDB; migrasi dari localStorage bila perlu
  async function init() {
    await openDB();
    if (!db) return;
    for (const k of [KEY, DRAFT]) {
      const ls = lsGet(k);
      let v = null;
      try { v = await idb('readonly', (s) => s.get(k)); } catch (e) {}
      if (v == null && ls != null) {
        try { await idb('readwrite', (s) => s.put(ls, k)); lsDel(k); lsFlag(); v = ls; } catch (e) { v = ls; }
      } else if (v != null && ls != null) { lsDel(k); }
      if (v != null) mem[k] = v;
    }
  }

  // ambil data terbit dari server (KV). Gagal/lambat → pakai assets/data.js / bawaan
  async function fetchRemote() {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 6000);
    try {
      const r = await fetch(API, { signal: ctl && ctl.signal });
      if (r.ok && r.status !== 204) { const j = await r.json(); if (isObj(j) && Object.keys(j).length) remote = j; }
    } catch (e) { /* offline / API belum aktif */ }
    clearTimeout(timer);
  }

  // pengunjung biasa tidak punya draf di browser → tidak perlu menunggu IndexedDB
  const needInit = lsGet(FLAG) === '1' || lsGet(KEY) != null || lsGet(DRAFT) != null ||
    /admin|[?&]preview/i.test(location.pathname + location.search);
  const ready = Promise.all([fetchRemote(), needInit ? init() : null]).catch(() => {});

  async function put(k, json) {   // khusus draf (lokal)
    await openDB();
    if (db) {
      await idb('readwrite', (s) => s.put(json, k));
      mem[k] = json; lsDel(k); lsFlag();
    } else { localStorage.setItem(k, json); }
  }
  async function del(k) {
    mem[k] = null;
    await openDB();
    if (db) { try { await idb('readwrite', (s) => s.delete(k)); } catch (e) {} }
    lsDel(k);
  }
  const raw = (k) => (k in mem ? mem[k] : lsGet(k));
  function read(key) {
    try { const r = raw(key); return r ? merge(DEFAULTS, JSON.parse(r)) : null; }
    catch (e) { return null; }
  }

  /* ---------- panggilan API (admin) ---------- */
  const getToken = () => lsGet(TOKEN_KEY) || '';
  const setToken = (t) => (t ? lsSet(TOKEN_KEY, t) : lsDel(TOKEN_KEY));
  async function api(url, opt) {
    opt = opt || {}; opt.headers = Object.assign({}, opt.headers, { Authorization: 'Bearer ' + getToken() });
    let r;
    try { r = await fetch(url, opt); } catch (e) { const er = new Error('Tidak bisa terhubung ke server. Periksa internet.'); er.code = 'NET'; throw er; }
    if (r.ok) return r;
    let msg = ''; try { msg = (await r.json()).error; } catch (e) {}
    const er = new Error(msg || ('Server menjawab ' + r.status));
    er.code = r.status === 401 ? 'AUTH' : 'HTTP'; throw er;
  }
  const walk = (v, fn) => {   // ganti string di mana pun dalam objek
    if (typeof v === 'string') return fn(v);
    if (Array.isArray(v)) return v.map((x) => walk(x, fn));
    if (isObj(v)) { const o = {}; for (const k in v) o[k] = walk(v[k], fn); return o; }
    return v;
  };

  const Store = {
    DEFAULTS,
    clone,
    ready,
    // data terbit: dari KV bila ada, jika tidak assets/data.js, jika tidak bawaan
    load: () => merge(DEFAULTS, remote || global.TANDASERU_DATA || {}),
    // data "terbit" lama yang tersimpan di browser ini (sebelum pindah ke KV) — dipakai admin untuk migrasi
    localPublished: () => read(KEY),
    loadDraft: () => read(DRAFT),
    hasPublished: () => !!remote,
    saveDraft(s) { return put(DRAFT, JSON.stringify(s)).catch(() => { /* gagal simpan draf: abaikan */ }); },
    clearDraft() { return del(DRAFT); },
    getToken, setToken,
    // unggah foto baru (data:) ke KV, lalu simpan data terbit. Mengembalikan data dengan URL foto final.
    async publish(s, onStep) {
      const urls = new Set();
      walk(s, (t) => { if (t.startsWith('data:image/')) urls.add(t); return t; });
      const map = new Map(); let n = 0;
      for (const u of urls) {
        if (onStep) onStep(`Mengunggah foto ${++n}/${urls.size}…`);
        const blob = await (await fetch(u)).blob();
        const r = await api(IMG_API, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/webp' }, body: blob });
        map.set(u, (await r.json()).url);
      }
      const out = walk(s, (t) => (map.has(t) ? map.get(t) : t));
      if (onStep) onStep('Menyimpan…');
      await api(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) });
      remote = out;
      return out;
    },
    async reset() {
      await api(API, { method: 'DELETE' });
      remote = null;
      await Promise.all([del(KEY), del(DRAFT)]); lsDel(FLAG);
    },
    // ukuran maksimum yang dipakai meter di admin (draf lokal). Foto disimpan di KV saat terbit.
    async limit() {
      await openDB();
      if (!db) return 5 * 1048576;
      try {
        const e = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
        if (e && e.quota) return e.quota;
      } catch (e) {}
      return 200 * 1048576;
    },
    merge
  };

  global.TSStore = Store;
})(window);
