// astro.config.mjs - Konfigurasi utama project MangkokKecil
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Ganti dengan domain kamu setelah deploy ke Vercel
  site: 'https://mangkokkecil.vercel.app',

  integrations: [
    // Tailwind CSS untuk styling
    tailwind({
      // Mengaktifkan file global.css sebagai base styles
      applyBaseStyles: false,
    }),

    // Sitemap otomatis untuk SEO
    sitemap({
      // Filter halaman yang masuk sitemap
      filter: (page) => !page.includes('/draft/'),
      // Frekuensi update sitemap
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  // Konfigurasi build untuk performa optimal
  build: {
    // Inlining CSS kecil untuk performa
    inlineStylesheets: 'auto',
  },

  // Optimasi gambar Astro
  image: {
    // Mengizinkan gambar dari domain Notion
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.notion.so',
      },
      {
        protocol: 'https',
        hostname: 's3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
    ],
  },

  // Konfigurasi Vite
  vite: {
    ssr: {
      external: ['@notionhq/client'],
    },
  },
});
