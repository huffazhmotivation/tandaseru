# tandaseru! — landing page + katalog + admin (Cloudflare Pages + KV)

Perubahan dari admin disimpan di **Cloudflare KV**, jadi semua pengunjung (HP, browser lain) melihat data yang sama.

## Struktur
- `_worker.js`  → API kecil (`/api/content`, `/api/img`) yang membaca/menulis KV
- `_routes.json` → hanya `/api/*` yang melewati worker, file statis tetap cepat
- `admin.html`, `index.html`, `assets/`, `foto/` → situs & admin

## Setup sekali (dashboard Cloudflare)
1. **Storage & databases → KV → Create** namespace, mis. `tandaseru-kv`.
2. Project Pages → **Settings → Bindings → Add → KV namespace**
   - Variable name: `TANDASERU_KV`  · pilih namespace tadi.
3. **Settings → Variables and Secrets → Add** → `ADMIN_PASSWORD` (tipe Secret) = kata sandi admin pilihan Anda.
4. Deploy ulang folder ini (drag & drop zip/folder, atau `npx wrangler pages deploy .`).
   Binding & variabel baru hanya berlaku pada deployment berikutnya.

## Cara pakai
- Buka `/admin`, ubah katalog, klik **Simpan & terbitkan**. Pertama kali akan diminta kata sandi admin (disimpan di browser itu).
- Foto dikompres di browser lalu diunggah ke KV saat terbit; data teks disimpan di `site:published`.
- Perubahan terlihat di semua perangkat dalam ±1 menit (KV bersifat eventual consistency).
- Data lama yang tersimpan di browser admin (sebelum pakai KV) otomatis dimuat sekali; tinggal klik terbitkan.

## Lokal
`npx wrangler pages dev . --kv=TANDASERU_KV --binding ADMIN_PASSWORD=rahasia`

## Keamanan admin
- `/admin` sekarang dilindungi login: tanpa kata sandi yang benar (`ADMIN_PASSWORD`) pengunjung hanya melihat form masuk; `admin.html`, `admin.js`, `admin.css` tidak dikirim sama sekali.
- Sesi disimpan sebagai cookie HttpOnly 30 hari. Keluar: buka `/api/logout`. Mengganti `ADMIN_PASSWORD` otomatis mengeluarkan semua sesi.
- Penulisan data (`PUT/POST/DELETE /api/*`) tetap wajib kata sandi.

## Keranjang
- Pembeli bisa menambah beberapa produk (ukuran/warna berbeda, jumlah diatur) lalu klik **Pesan semua via WhatsApp** — satu pesan berisi daftar produk, jumlah, harga, total, dan kode promo.
- Keranjang tersimpan di browser pembeli; nama, harga, foto, dan stok selalu dibaca dari katalog terbaru (produk habis/dihapus ditandai dan tidak ikut dipesan).
- Admin → tab Checkout → grup **Keranjang** untuk mengaktifkan/menonaktifkan. Butuh WhatsApp aktif.
