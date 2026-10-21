# tandaseru! — landing page + katalog + admin

Jalankan (wajib lewat server lokal agar admin & situs berbagi data):

    python3 -m http.server 8080

- Situs:  http://localhost:8080/index.html
- Admin:  http://localhost:8080/admin.html

Data & foto disimpan di IndexedDB browser (kapasitas ratusan MB–GB, bukan lagi batas 5 MB localStorage; data lama dimigrasikan otomatis). Hanya untuk demo/uji.
Untuk produksi, ganti assets/store.js dengan API/database + login admin.

## Kategori custom (Admin → Katalog → Kategori)

- Tambah, ganti nama, urutkan (↑↓), dan hapus kategori sesuka hati.
- Ganti nama otomatis ikut mengubah produk di kategori itu; nama kosong/kembar ditolak.
- Hapus kategori → produknya jadi "tanpa kategori" (konfirmasi dulu).
- Tiap kategori punya teks pendek, foto sampul, dan bentuk ilustrasi untuk kartu di situs.
- Kategori tanpa produk tidak tampil di situs.
- Data lama (kategori berupa teks biasa) otomatis dikonversi.
