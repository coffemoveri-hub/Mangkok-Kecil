// src/lib/notion.ts
// ============================================================
// Modul koneksi ke Notion API untuk MangkokKecil
// Berisi semua fungsi untuk mengambil data dari Notion CMS
// ============================================================

import { Client } from '@notionhq/client';

// ============================================================
// KONFIGURASI NOTION CLIENT
// Pastikan NOTION_TOKEN sudah ada di file .env
// ============================================================
const NOTION_TOKEN = import.meta.env.NOTION_TOKEN;
const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

export function isNotionConfigured(): boolean {
  return Boolean(
    NOTION_TOKEN &&
    NOTION_TOKEN.trim() !== '' &&
    NOTION_TOKEN !== 'your_notion_token_here' &&
    DATABASE_ID &&
    DATABASE_ID.trim() !== '' &&
    DATABASE_ID !== 'your_database_id_here'
  );
}

const notion = isNotionConfigured()
  ? new Client({ auth: NOTION_TOKEN })
  : (null as unknown as Client);

// ============================================================
// TYPE DEFINITIONS
// Mendefinisikan tipe data untuk post blog
// ============================================================
export interface BlogPost {
  id: string;           // ID unik Notion
  title: string;        // Judul artikel
  slug: string;         // URL-friendly slug
  excerpt: string;      // Deskripsi singkat
  date: string;         // Tanggal publish
  dateFormatted: string; // Tanggal dalam format Indonesia
  tags: string[];       // Array tag
  cover: string | null; // URL gambar cover
  status: string;       // 'Published' atau 'Draft'
  author: string;       // Nama penulis
  readingTime: number;  // Estimasi waktu baca (menit)
}

export interface NotionBlock {
  type: string;         // Jenis block (paragraph, heading, dll)
  content: string;      // Konten text
  level?: number;       // Level heading (1, 2, 3)
  language?: string;    // Bahasa untuk code block
  caption?: string;     // Caption untuk gambar
  url?: string;         // URL untuk gambar atau link
  items?: string[];     // Items untuk list
  checked?: boolean;    // Untuk to-do list
}

// ============================================================
// FUNGSI HELPER
// ============================================================

/**
 * Mengubah teks menjadi slug yang SEO-friendly
 * Contoh: "Resep MPASI 6 Bulan" → "resep-mpasi-6-bulan"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Ganti karakter Indonesia yang umum
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    // Hapus karakter spesial
    .replace(/[^a-z0-9\s-]/g, '')
    // Ganti spasi dengan dash
    .replace(/\s+/g, '-')
    // Hapus multiple dash
    .replace(/-+/g, '-')
    // Hapus dash di awal/akhir
    .replace(/^-|-$/g, '');
}

/**
 * Memformat tanggal ke format Indonesia
 * Contoh: "2024-01-15" → "15 Januari 2024"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Menghitung estimasi waktu baca artikel
 * Rata-rata orang membaca 200-250 kata per menit
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 225;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Mengambil nilai text dari properti Notion
 */
function getRichTextValue(richText: any[]): string {
  if (!richText || richText.length === 0) return '';
  return richText.map((t) => t.plain_text).join('');
}

// ============================================================
// FUNGSI UTAMA - MENGAMBIL DATA DARI NOTION
// ============================================================

/**
 * Mengambil semua post yang berstatus "Published" dari database Notion
 * Diurutkan dari yang terbaru
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  if (!isNotionConfigured()) {
    return getMockPosts();
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published',
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    });

    const posts = response.results.map((page: any) => {
      return extractPostData(page);
    });

    return posts.filter((post) => post.slug);
  } catch (error) {
    console.error('Error mengambil posts dari Notion (menggunakan data mock):', error);
    return getMockPosts();
  }
}

/**
 * Mengambil 3 post terbaru untuk section blog di homepage
 */
export async function getLatestPosts(count: number = 3): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.slice(0, count);
}

/**
 * Mengambil satu post berdasarkan slug untuk halaman detail
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isNotionConfigured()) {
    const mock = getMockPosts().find((p) => p.slug === slug);
    return mock || null;
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Slug',
            rich_text: {
              equals: slug,
            },
          },
          {
            property: 'Status',
            select: {
              equals: 'Published',
            },
          },
        ],
      },
    });

    if (response.results.length === 0) {
      const mock = getMockPosts().find((p) => p.slug === slug);
      return mock || null;
    }

    return extractPostData(response.results[0] as any);
  } catch (error) {
    console.error('Error mengambil post dari Notion (menggunakan fallback):', error);
    const mock = getMockPosts().find((p) => p.slug === slug);
    return mock || null;
  }
}

/**
 * Mengambil artikel terkait berdasarkan tags yang sama
 */
export async function getRelatedPosts(
  currentSlug: string,
  tags: string[],
  count: number = 3
): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  
  return allPosts
    .filter((post) => {
      if (post.slug === currentSlug) return false;
      return post.tags.some((tag) => tags.includes(tag));
    })
    .slice(0, count);
}

/**
 * Mengambil konten/blocks dari halaman Notion
 */
export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
  if (!isNotionConfigured() || pageId.length < 10) {
    return getMockBlocks(pageId);
  }

  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    const blocks: NotionBlock[] = [];

    for (const block of response.results as any[]) {
      const processedBlock = processBlock(block);
      if (processedBlock) blocks.push(processedBlock);
    }

    if (blocks.length === 0) {
      return getMockBlocks(pageId);
    }

    return blocks;
  } catch (error) {
    console.error('Error mengambil blocks dari Notion (menggunakan mock blocks):', error);
    return getMockBlocks(pageId);
  }
}

// ============================================================
// FUNGSI HELPER INTERNAL
// ============================================================

/**
 * Mengekstrak data post dari response Notion
 */
function extractPostData(page: any): BlogPost {
  const properties = page.properties;

  // Ambil judul
  const title = getRichTextValue(properties.Title?.title) || 'Untitled';
  
  // Ambil slug (jika kosong, buat dari judul)
  const slugRaw = getRichTextValue(properties.Slug?.rich_text);
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  
  // Ambil excerpt/deskripsi singkat
  const excerpt = getRichTextValue(properties.Excerpt?.rich_text) || '';
  
  // Ambil tanggal
  const dateRaw = properties.Date?.date?.start || '';
  const dateFormatted = formatDate(dateRaw);
  
  // Ambil tags
  const tags: string[] = (properties.Tags?.multi_select || []).map(
    (tag: any) => tag.name
  );
  
  // Ambil status
  const status = properties.Status?.select?.name || 'Draft';
  
  // Ambil author
  const author = getRichTextValue(properties.Author?.rich_text) || 'Tim MangkokKecil';
  
  // Ambil cover image
  let cover: string | null = null;
  if (page.cover) {
    if (page.cover.type === 'external') {
      cover = page.cover.external.url;
    } else if (page.cover.type === 'file') {
      cover = page.cover.file.url;
    }
  }
  // Cek juga properti Cover di database
  if (!cover && properties.Cover?.files?.[0]) {
    const coverFile = properties.Cover.files[0];
    cover = coverFile.type === 'external' 
      ? coverFile.external.url 
      : coverFile.file.url;
  }

  return {
    id: page.id,
    title,
    slug,
    excerpt: excerpt.slice(0, 160), // Max 160 karakter untuk SEO
    date: dateRaw,
    dateFormatted,
    tags,
    cover,
    status,
    author,
    readingTime: calculateReadingTime(excerpt + title),
  };
}

/**
 * Memproses satu block Notion menjadi format yang bisa dirender
 */
function processBlock(block: any): NotionBlock | null {
  const { type } = block;

  switch (type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        content: getRichTextValue(block.paragraph?.rich_text),
      };

    case 'heading_1':
      return {
        type: 'heading',
        level: 1,
        content: getRichTextValue(block.heading_1?.rich_text),
      };

    case 'heading_2':
      return {
        type: 'heading',
        level: 2,
        content: getRichTextValue(block.heading_2?.rich_text),
      };

    case 'heading_3':
      return {
        type: 'heading',
        level: 3,
        content: getRichTextValue(block.heading_3?.rich_text),
      };

    case 'bulleted_list_item':
      return {
        type: 'list_item',
        content: getRichTextValue(block.bulleted_list_item?.rich_text),
      };

    case 'numbered_list_item':
      return {
        type: 'numbered_item',
        content: getRichTextValue(block.numbered_list_item?.rich_text),
      };

    case 'quote':
      return {
        type: 'quote',
        content: getRichTextValue(block.quote?.rich_text),
      };

    case 'code':
      return {
        type: 'code',
        content: getRichTextValue(block.code?.rich_text),
        language: block.code?.language || 'plain text',
      };

    case 'image': {
      const imgUrl =
        block.image?.type === 'external'
          ? block.image.external.url
          : block.image?.file?.url || '';
      const caption = getRichTextValue(block.image?.caption);
      return {
        type: 'image',
        url: imgUrl,
        caption,
        content: caption,
      };
    }

    case 'divider':
      return {
        type: 'divider',
        content: '',
      };

    case 'callout':
      return {
        type: 'callout',
        content: getRichTextValue(block.callout?.rich_text),
      };

    case 'to_do':
      return {
        type: 'todo',
        content: getRichTextValue(block.to_do?.rich_text),
        checked: block.to_do?.checked || false,
      };

    default:
      // Block yang tidak dikenali, skip
      return null;
  }
}

// ============================================================
// DATA DUMMY - Dipakai saat Notion belum dikonfigurasi
// Berguna untuk development awal sebelum setup Notion
// ============================================================
function getMockPosts(): BlogPost[] {
  return [
    {
      id: '1',
      title: 'Panduan Lengkap MPASI Pertama untuk Bayi 6 Bulan',
      slug: 'panduan-mpasi-pertama-bayi-6-bulan',
      excerpt: 'Memulai MPASI adalah momen penting dalam tumbuh kembang bayi. Pelajari cara yang tepat dan aman sesuai standar WHO untuk memulai perjalanan MPASI si Kecil.',
      date: '2024-01-15',
      dateFormatted: '15 Januari 2024',
      tags: ['MPASI 6 Bulan', 'Panduan Pemula', 'Gizi Bayi'],
      cover: null,
      status: 'Published',
      author: 'Tim MangkokKecil',
      readingTime: 8,
    },
    {
      id: '2',
      title: 'Resep Puree Alpukat & Pisang untuk Bayi 6-8 Bulan',
      slug: 'resep-puree-alpukat-pisang-bayi',
      excerpt: 'Alpukat dan pisang adalah duo sempurna untuk MPASI pertama. Kaya lemak sehat dan kalium, resep puree mudah ini cocok untuk bayi yang baru memulai MPASI.',
      date: '2024-01-20',
      dateFormatted: '20 Januari 2024',
      tags: ['Resep MPASI', 'Puree', 'MPASI 6 Bulan'],
      cover: null,
      status: 'Published',
      author: 'Tim MangkokKecil',
      readingTime: 5,
    },
    {
      id: '3',
      title: 'BLW vs Spoon-Feeding: Mana yang Tepat untuk Bayi Kamu?',
      slug: 'blw-vs-spoon-feeding-mana-yang-tepat',
      excerpt: 'Memilih metode makan bayi bisa membingungkan. Mari kita bandingkan Baby-Led Weaning dan spoon-feeding dari sisi keamanan, perkembangan, dan kemudahan untuk orang tua.',
      date: '2024-01-25',
      dateFormatted: '25 Januari 2024',
      tags: ['BLW', 'Pola Makan', 'Tips Praktis'],
      cover: null,
      status: 'Published',
      author: 'Tim MangkokKecil',
      readingTime: 10,
    },
    {
      id: '4',
      title: 'Mengatasi GTM (Gerakan Tutup Mulut) pada Bayi',
      slug: 'mengatasi-gtm-gerakan-tutup-mulut-bayi',
      excerpt: 'GTM membuat banyak orang tua frustasi. Temukan penyebab dan strategi efektif yang telah terbukti membantu bayi mau makan kembali dengan happy.',
      date: '2024-02-01',
      dateFormatted: '1 Februari 2024',
      tags: ['GTM', 'Pola Makan', 'Feeding Rules'],
      cover: null,
      status: 'Published',
      author: 'Tim MangkokKecil',
      readingTime: 12,
    },
    {
      id: '5',
      title: 'Meal Prep MPASI Seminggu: Hemat Waktu untuk Ibu Bekerja',
      slug: 'meal-prep-mpasi-seminggu-ibu-bekerja',
      excerpt: 'Menyiapkan MPASI tidak harus menyita waktu setiap hari. Pelajari teknik meal prep yang efisien agar nutrisi bayi tetap terjaga meski jadwal Ibu padat.',
      date: '2024-02-05',
      dateFormatted: '5 Februari 2024',
      tags: ['Meal Prep', 'Tips Praktis', 'Ibu Bekerja'],
      cover: null,
      status: 'Published',
      author: 'Tim MangkokKecil',
      readingTime: 9,
    },
    {
      id: '6',
      title: 'Panduan Memilih High Chair Terbaik 2024: Review Berbagai Harga',
      slug: 'panduan-memilih-high-chair-terbaik',
      excerpt: 'High chair yang tepat mendukung postur makan bayi dan keselamatan. Kami review high chair dari yang terjangkau hingga premium untuk membantu pilihan terbaik kamu.',
      date: '2024-02-10',
      dateFormatted: '10 Februari 2024',
      tags: ['Perlengkapan MPASI', 'Review Produk', 'High Chair'],
      cover: null,
      status: 'Published',
      author: 'Tim MangkokKecil',
      readingTime: 7,
    },
  ];
}

/**
 * Data mock blocks untuk konten artikel lengkap
 */
function getMockBlocks(pageIdOrSlug: string): NotionBlock[] {
  // Post 1: Panduan MPASI Pertama
  if (pageIdOrSlug === '1' || pageIdOrSlug.includes('panduan-mpasi-pertama')) {
    return [
      {
        type: 'heading',
        level: 2,
        content: 'Mengapa Usia 6 Bulan Adalah Golden Standard?',
      },
      {
        type: 'paragraph',
        content: 'Memasuki usia 6 bulan (180 hari), sistem pencernaan bayi telah matang dan cadangan zat besi alami bawaan sejak lahir mulai menipis drastis. Pada titik inilah ASI perlu didampingi oleh Makanan Pendamping ASI (MPASI) yang kaya zat gizi mikro dan makro untuk mencegah stunting dan anemia defisiensi besi.',
      },
      {
        type: 'callout',
        content: '💡 Rekomendasi IDAI & WHO: MPASI harus tepat waktu (usia 6 bulan), adekuat (memenuhi kebutuhan gizi makro & mikro), aman dan higienis, serta diberikan dengan cara yang responsif (responsive feeding).',
      },
      {
        type: 'heading',
        level: 2,
        content: '4 Tanda Bayi Siap Memulai MPASI',
      },
      {
        type: 'list_item',
        content: 'Mampu duduk tegak dengan sedikit atau tanpa bantuan, serta leher dan kepala sudah stabil.',
      },
      {
        type: 'list_item',
        content: 'Refleks menjulurkan lidah (extrusion reflex) berkurang drastis sehingga makanan tidak otomatis didorong keluar mulut.',
      },
      {
        type: 'list_item',
        content: 'Menunjukkan ketertarikan tinggi saat melihat orang lain makan (mencoba meraih piring, membuka mulut, atau mengunyah tiruan).',
      },
      {
        type: 'list_item',
        content: 'Koordinasi mata, tangan, dan mulut mulai berkembang untuk memasukkan benda ke mulut dengan terarah.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Komposisi Menu Lengkap: Prioritaskan Menu 4 Bintang',
      },
      {
        type: 'paragraph',
        content: 'Dulu sering ada saran memberikan menu tunggal buah atau sayur selama 14 hari pertama. Namun panduan medis terbaru IDAI menegaskan pentingnya memberikan MENU LENGKAP sejak hari pertama MPASI.',
      },
      {
        type: 'quote',
        content: 'Zat besi dari protein hewani (heme iron) seperti hati ayam, daging sapi, dan telur diserap tubuh bayi hingga 3 kali lipat lebih efektif dibandingkan zat besi nabati.',
      },
      {
        type: 'list_item',
        content: 'Karbohidrat: Beras putih/merah, kentang, ubi jalar, jagung, atau oat halus.',
      },
      {
        type: 'list_item',
        content: 'Protein Hewani (Wajib Ada): Hati ayam, daging sapi cincang, telur utuh, ikan kembung/salmon, atau ayam kampung.',
      },
      {
        type: 'list_item',
        content: 'Lemak Tambahan: Minyak kelapa, santan matang, unsalted butter, atau minyak kanola untuk mendongkrak kalori.',
      },
      {
        type: 'list_item',
        content: 'Sayuran & Buah: Wortel, brokoli, labu kuning, atau bayam sebagai perkenalan rasa dan mikronutrien.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Tekstur dan Frekuensi di Awal MPASI',
      },
      {
        type: 'paragraph',
        content: 'Untuk bayi 6 bulan, mulailah dengan tekstur puree halus atau bubur saring semi-kental (tidak encer menetes saat sendok dimiringkan). Berikan 2-3 kali makan utama sehari dengan takaran awal 2-3 sendok makan dewasa per kali makan, lalu tingkatkan bertahap sesuai respon bayi.',
      },
    ];
  }

  // Post 2: Resep Puree Alpukat & Pisang
  if (pageIdOrSlug === '2' || pageIdOrSlug.includes('resep-puree-alpukat')) {
    return [
      {
        type: 'heading',
        level: 2,
        content: 'Kombinasi Superfood Lembut untuk Pencernaan Bayi',
      },
      {
        type: 'paragraph',
        content: 'Alpukat adalah salah satu buah terbaik untuk MPASI awal karena kaya akan lemak tak jenuh tunggal yang esensial untuk perkembangan otak dan sistem saraf bayi. Dipadukan dengan manis alami pisang ambon matang, resep ini menjadi menu transisi yang sangat ramah pencernaan.',
      },
      {
        type: 'callout',
        content: '⏱️ Waktu Persiapan: 5 Menit | Tekstur: Puree Lembut | Usia: 6 Bulan ke Atas | Porsi: 1 Kali Makan',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Bahan-Bahan yang Dibutuhkan',
      },
      {
        type: 'list_item',
        content: '1/2 buah alpukat mentega matang (daging buah pulen tanpa serat hitam)',
      },
      {
        type: 'list_item',
        content: '1/2 buah pisang ambon atau cavendish matang alami',
      },
      {
        type: 'list_item',
        content: '2-3 sendok makan ASI perah (ASIP) atau susu formula hangat untuk mengatur konsistensi',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Langkah-Langkah Pembuatan',
      },
      {
        type: 'list_item',
        content: '1. Belah alpukat, buang bijinya, dan kerok daging buahnya dengan sendok bersih ke dalam mangkok.',
      },
      {
        type: 'list_item',
        content: '2. Kupas pisang, potong kecil-kecil, lalu masukkan bersama potongan alpukat.',
      },
      {
        type: 'list_item',
        content: '3. Lumatkan kedua bahan menggunakan garpu hingga halus atau blender sebentar untuk hasil super lembut.',
      },
      {
        type: 'list_item',
        content: '4. Tuang ASI atau susu formula sedikit demi sedikit sambil diaduk rata sampai kekentalan yang pas.',
      },
      {
        type: 'list_item',
        content: '5. Sajikan segera kepada si Kecil dalam kondisi segar agar tidak teroksidasi berubah warna.',
      },
    ];
  }

  // Post 3: BLW vs Spoon-Feeding
  if (pageIdOrSlug === '3' || pageIdOrSlug.includes('blw-vs-spoon')) {
    return [
      {
        type: 'heading',
        level: 2,
        content: 'Memahami Dua Filosofi Pemberian Makan Bayi',
      },
      {
        type: 'paragraph',
        content: 'Sebagai orang tua baru, salah satu keputusan paling sering didiskusikan adalah memilih metode makan. Apakah memberikan kebebasan eksplorasi dengan Baby-Led Weaning (BLW), atau menggunakan metode konvensional sendok (Spoon-Feeding) dengan tekstur bertahap?',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Kelebihan dan Tantangan Baby-Led Weaning (BLW)',
      },
      {
        type: 'paragraph',
        content: 'Pada metode BLW, bayi langsung diperkenalkan dengan finger food seukuran jari telunjuk orang dewasa dengan tekstur lunak yang mudah dihancurkan dengan gusi tanpa suapan sendok.',
      },
      {
        type: 'list_item',
        content: 'Kelebihan: Melatih motorik halus (pincer grasp), refleks mengunyah lebih cepat, dan mendorong self-regulation (bayi tahu kapan kenyang).',
      },
      {
        type: 'list_item',
        content: 'Tantangan: Area makan sangat berantakan (messy), risiko asupan kalori awal lebih sedikit, dan orang tua harus memahami perbedaan antara muntah tersedak (choking) dan refleks muntah normal (gagging).',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Kelebihan dan Tantangan Spoon-Feeding Konvensional',
      },
      {
        type: 'paragraph',
        content: 'Metode sendok dimulai dari tekstur saring halus (puree) lalu bertahap naik ke tekstur cincang halus, cincang kasar, hingga makanan keluarga.',
      },
      {
        type: 'list_item',
        content: 'Kelebihan: Orang tua dapat memastikan takaran gizi, protein hewani, dan kalori masuk dengan terukur, serta lebih minim cemas.',
      },
      {
        type: 'list_item',
        content: 'Tantangan: Risiko ketergantungan disuapi dan potensi terlambat naik tekstur jika orang tua ragu menaikkan kekasaran makanan.',
      },
      {
        type: 'callout',
        content: '✨ Metode Kombinasi (Mixed Feeding): Anda tidak harus memilih satu metode secara kaku! Dokter anak banyak menyarankan kombinasi: berikan makanan utama berkalori tinggi dengan sendok, sambil menyajikan finger food lunak untuk dieksplorasi si Kecil.',
      },
    ];
  }

  // Post 4: Mengatasi GTM
  if (pageIdOrSlug === '4' || pageIdOrSlug.includes('mengatasi-gtm')) {
    return [
      {
        type: 'heading',
        level: 2,
        content: 'Mengapa Bayi Melakukan GTM (Gerakan Tutup Mulut)?',
      },
      {
        type: 'paragraph',
        content: 'Melihat anak menolak makan, memalingkan muka, menangis histeris, atau mengunci rapat mulutnya adalah mimpi buruk setiap ibu. Langkah pertama mengatasinya adalah mengidentifikasi akar penyebabnya tanpa memaksa anak.',
      },
      {
        type: 'heading',
        level: 2,
        content: '5 Penyebab Paling Sering Terjadi',
      },
      {
        type: 'list_item',
        content: '1. Tumbuh Gigi (Teething): Gusi ngilu dan bengkak membuat sentuhan sendok atau makanan terasa sakit.',
      },
      {
        type: 'list_item',
        content: '2. Terlalu Lama di Tekstur Halus: Bayi bosan dengan bubur saring saat sensoriknya sudah ingin mengunyah tekstur cincang.',
      },
      {
        type: 'list_item',
        content: '3. Jadwal Minum Susu Terlalu Dekat: Bayi masih kenyang saat jam makan utama karena baru minum susu 30 menit sebelumnya.',
      },
      {
        type: 'list_item',
        content: '4. Trauma Feeding Force: Dipaksa makan, dicekoki, atau suasana makan penuh omelan dan ketegangan.',
      },
      {
        type: 'list_item',
        content: '5. Makanan Kurang Gurih Alami: Tidak menggunakan bumbu aromatik (bawang putih, daun salam, kaldu hewani murni).',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Penerapan Feeding Rules Rekomendasi IDAI',
      },
      {
        type: 'list_item',
        content: 'Aturan Jadwal: Buat jadwal makan teratur dan patuhi interval 2-3 jam tanpa susu atau camilan sebelum waktu makan.',
      },
      {
        type: 'list_item',
        content: 'Batasi Waktu: Maksimal 30 menit per sesi makan. Jika anak menolak setelah 10-15 menit upaya sabar, akhiri makan tanpa hukuman.',
      },
      {
        type: 'list_item',
        content: 'Bebas Distraksi: Matikan gadget, TV, dan jangan makan sambil diajak jalan-jalan keliling komplek.',
      },
      {
        type: 'callout',
        content: '❤️ Kunci Utama: Sabar dan konsisten. Pemberian makan adalah proses belajar, bukan perlombaan piring bersih.',
      },
    ];
  }

  // Post 5: Meal Prep MPASI Seminggu
  if (pageIdOrSlug === '5' || pageIdOrSlug.includes('meal-prep')) {
    return [
      {
        type: 'heading',
        level: 2,
        content: 'Solusi Cerdas MPASI Padat Gizi untuk Ibu Bekerja',
      },
      {
        type: 'paragraph',
        content: 'Bagi ibu yang bekerja atau memiliki waktu terbatas, menyiapkan MPASI segar 3 kali sehari dari nol bisa sangat melelahkan. Dengan teknik food prep dan penyimpanan yang higienis, Anda tetap bisa menyajikan makanan homemade berkualitas tinggi setiap hari.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Teknik Pembagian Porsi (Batch Cooking & Freezing)',
      },
      {
        type: 'list_item',
        content: 'Stok Kaldu Tulang Sapi / Ceker Ayam: Rebus perlahan, saring lemak berlebih, lalu bekukan dalam cetakan es batu silikon bertutup food-grade.',
      },
      {
        type: 'list_item',
        content: 'Puree Protein Hewani: Rebus hati ayam atau daging cincang bersama daun salam dan bawang putih, lumatkan, lalu simpan dalam wadah kaca porsi sekali makan di freezer.',
      },
      {
        type: 'list_item',
        content: 'Potongan Sayuran Siap Rebus: Cuci bersih wortel, brokoli, atau labu, potong dadu, keringkan sempurna, lalu simpan dalam chiller kulkas (tahan 3-4 hari).',
      },
      {
        type: 'callout',
        content: '❄️ Standar Suhu Freezer: Simpan pada suhu -18°C (tahan 1-2 bulan). Jangan pernah membekukan kembali makanan yang sudah dicairkan (thawed)!',
      },
    ];
  }

  // Post 6: Panduan Memilih High Chair
  return [
    {
      type: 'heading',
      level: 2,
      content: 'Mengapa High Chair Sangat Krusial untuk Keselamatan Bayi?',
    },
    {
      type: 'paragraph',
      content: 'Kursi makan bayi (high chair) bukan sekadar perabot tambahan. Postur duduk 90-90-90 (pinggul 90°, lutut 90°, dan telapak kaki menapak 90° di footrest) terbukti secara medis menurunkan risiko tersedak (choking) dan meningkatkan konsentrasi bayi saat proses makan.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Checklist Wajib Sebelum Membeli High Chair',
    },
    {
      type: 'list_item',
      content: '1. Pijakan Kaki (Footrest) Kokoh & Adjustable: Menopang kaki agar sirkulasi darah lancar dan diafragma pernapasan stabil.',
    },
    {
      type: 'list_item',
      content: '2. Sabuk Pengaman (5-Point Harness): Mengunci bayi dengan aman agar tidak tergelincir atau berdiri tiba-tiba.',
    },
    {
      type: 'list_item',
      content: '3. Meja Makan (Tray) yang Mudah Dicuci: Bahan food-grade BPA-free tanpa celah sempit yang memerangkap sisa makanan basi.',
    },
    {
      type: 'list_item',
      content: '4. Struktur Kaki Kursi Segitiga Stabil: Anti-guling saat bayi bergerak aktif di kursi.',
    },
    {
      type: 'callout',
      content: '💡 Tips Hemat: Kursi makan plastik sederhana tetap sangat fungsional asalkan dipasangi footrest modifikasi jika belum memiliki pijakan kaki bawaan pabrik.',
    },
  ];
}
