# 🥣 MangkokKecil - Blog Edukasi MPASI & Nutrisi Bayi

Selamat datang di **MangkokKecil**! Website blog modern dan edukatif yang didedikasikan untuk membantu para orang tua dalam mendampingi perjalanan MPASI (Makanan Pendamping ASI) si Kecil dari usia 6 bulan hingga balita.

Proyek ini dibangun menggunakan **Astro**, **Tailwind CSS**, dan terintegrasi dengan **Notion API** sebagai Headless CMS yang sangat mudah dikelola bahkan tanpa latar belakang IT.

---

## ✨ Fitur Unggulan

- 🎨 **Desain Modern & Ramah Keluarga**: Palet warna lembut yang menenangkan (`#F8F9FA`, `#E8F5E9`, `#FFB703`, `#A8DADC`, `#2B2D42`).
- 🌓 **Dark Mode Support**: Mode gelap yang nyaman di mata saat membaca artikel di malam hari.
- 📱 **100% Responsif**: Tampilan optimal di smartphone, tablet, maupun laptop.
- ⚡ **Super Cepat & SEO Friendly**: Skor performa tinggi, schema structured data (Article & Breadcrumbs), Open Graph, Twitter Cards, dan sitemap otomatis.
- 📝 **Headless CMS Notion**: Menulis dan mempublikasikan artikel langsung dari aplikasi Notion di HP/laptop tanpa perlu menyentuh kode.
- 🛡️ **Zero-Crash Mock Data**: Website tetap berfungsi normal dan menampilkan artikel contoh berkualitas tinggi meskipun Notion belum dihubungkan.
- 📖 **Halaman Lengkap**:
  - `Beranda (/)`: Hero banner, filter kategori artikel, highlight resep & edukasi gizi, newsletter CTA.
  - `Panduan MPASI (/panduan)`: Tahapan tekstur per usia, tanda kesiapan bayi, perbandingan BLW vs Spoon-Feeding, solusi Gerakan Tutup Mulut (GTM).
  - `Blog & Detail Artikel (/blog & /blog/[slug])`: Daftar artikel, pencarian tag, estimasi waktu baca, artikel terkait, dan blok konten Notion.
  - `Tentang Kami (/tentang)`: Visi misi, komitmen standar IDAI/WHO, profil redaksi.
  - `Kontak (/kontak)`: Formulir pesan interaktif dan tautan media sosial.

---

## 🚀 Cara Menjalankan di Komputer Lokal

1. **Buka Terminal di folder proyek**
2. **Install Dependensi** (hanya perlu sekali):
   ```bash
   npm install
   ```
3. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
4. Buka browser dan kunjungi:
   👉 **http://localhost:4321**

---

## 📑 Panduan Menghubungkan ke Notion CMS

Anda tidak perlu menyentuh kode rumit untuk mengunggah artikel baru. Cukup gunakan Notion!

### Langkah 1: Buat Integrasi Notion
1. Buka [notion.so/my-integrations](https://www.notion.so/my-integrations) di browser dan login.
2. Klik tombol **"+ New integration"**.
3. Beri nama integrasi (contoh: `MangkokKecil Blog`), lalu pilih workspace Notion Anda.
4. Klik **Submit**, lalu salin **Internal Integration Secret** (kodenya diawali `secret_...`).

### Langkah 2: Buat Database di Notion
Buat halaman baru di Notion berjenis **Table Database** dengan struktur properti (kolom) sebagai berikut:

| Nama Kolom | Jenis Properti di Notion | Keterangan |
| :--- | :--- | :--- |
| **Title** | `Title` (Bawaan) | Judul artikel |
| **Slug** | `Text` | URL artikel (contoh: `resep-puree-alpukat`) |
| **Excerpt** | `Text` | Ringkasan singkat artikel (1-2 kalimat) |
| **Date** | `Date` | Tanggal publikasi |
| **Tags** | `Multi-select` | Kategori (contoh: `MPASI 6 Bulan`, `Resep`, `GTM`) |
| **Status** | `Select` | Buat opsi: `Published` dan `Draft` |
| **Cover** | `Files & media` | Gambar sampul artikel (opsional) |
| **Author** | `Text` | Nama penulis (contoh: `dr. Sarah, Sp.A` / `Tim MangkokKecil`) |

### Langkah 3: Beri Akses Integrasi ke Database
1. Buka database yang baru Anda buat di Notion.
2. Klik ikon titik tiga `•••` di pojok kanan atas.
3. Gulir ke bawah ke menu **Connections** > **Connect to** > pilih nama integrasi Anda (`MangkokKecil Blog`).

### Langkah 4: Ambil Database ID
Salin ID Database dari link/URL Notion Anda.  
Format URL Notion: `https://www.notion.so/{workspace_name}/{DATABASE_ID}?v=...`  
*(Bagian 32 karakter setelah nama workspace sebelum tanda tanya `?` adalah DATABASE_ID)*

### Langkah 5: Simpan di File `.env`
Buka file [.env](file:///d:/B2B%20mpasi/.env) di editor, lalu masukkan kredensial Anda:

```env
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Setelah disimpan, restart server development (`npm run dev`) dan artikel dari Notion akan langsung tampil di website!

---

## 🌐 Cara Deploy Gratis ke Vercel

1. Buat akun di [Vercel.com](https://vercel.com) (login menggunakan akun GitHub).
2. Upload kode proyek ini ke repository GitHub Anda.
3. Di dashboard Vercel, klik **"Add New Project"** dan pilih repository GitHub Anda.
4. Pada bagian **Environment Variables**, tambahkan:
   - `NOTION_TOKEN` = *(kode secret notion Anda)*
   - `NOTION_DATABASE_ID` = *(kode database id notion Anda)*
5. Klik **"Deploy"**. Website Anda akan aktif dan online dalam hitungan menit!

---

## 🛠️ Perintah Berguna

- `npm run dev` : Menjalankan server lokal untuk melihat tampilan website.
- `npm run build` : Menguji kompilasi dan membuat file statis produksi di folder `dist/`.
- `npm run preview` : Meninjau hasil build produksi secara lokal.
