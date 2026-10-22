/** @type {import('tailwindcss').Config} */
export default {
  // File yang di-scan Tailwind untuk class names
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

  // Aktifkan dark mode dengan class (bukan media query)
  darkMode: 'class',

  theme: {
    extend: {
      // ===== WARNA BRAND MANGKOKKECIL =====
      colors: {
        brand: {
          // Background utama - putih bersih
          bg: '#F8F9FA',
          // Card/Container - hijau muda lembut
          card: '#E8F5E9',
          // CTA Button - kuning cerah (warna utama brand)
          cta: '#FFB703',
          // Highlight - biru-hijau pastel
          highlight: '#A8DADC',
          // Text utama - hampir hitam
          text: '#2B2D42',
        },
        // Warna tambahan untuk variasi
        cream: {
          50: '#FFFDF5',
          100: '#FFF8E1',
          200: '#FFE9A3',
        },
        sage: {
          50: '#F1F8F2',
          100: '#E8F5E9',
          200: '#C8E6C9',
          300: '#A5D6A7',
          400: '#66BB6A',
          500: '#4CAF50',
        },
      },

      // ===== FONT =====
      fontFamily: {
        // Font utama untuk body text
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        // Font untuk heading yang lebih playful
        display: ['Nunito', 'Plus Jakarta Sans', 'sans-serif'],
        // Font untuk konten artikel (lebih readable)
        prose: ['Lora', 'Georgia', 'serif'],
      },

      // ===== SPACING CUSTOM =====
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ===== BORDER RADIUS =====
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ===== SHADOW =====
      boxShadow: {
        // Shadow lembut untuk card
        'card': '0 2px 20px rgba(43, 45, 66, 0.08)',
        'card-hover': '0 8px 40px rgba(43, 45, 66, 0.16)',
        'cta': '0 4px 20px rgba(255, 183, 3, 0.4)',
      },

      // ===== ANIMASI =====
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },

      // ===== PROSE (untuk konten artikel) =====
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.brand.text'),
            maxWidth: 'none',
            h1: {
              fontFamily: theme('fontFamily.display').join(', '),
              color: theme('colors.brand.text'),
            },
            h2: {
              fontFamily: theme('fontFamily.display').join(', '),
              color: theme('colors.brand.text'),
            },
            h3: {
              fontFamily: theme('fontFamily.display').join(', '),
              color: theme('colors.brand.text'),
            },
            a: {
              color: theme('colors.brand.cta'),
              '&:hover': {
                color: theme('colors.brand.highlight'),
              },
            },
            blockquote: {
              borderLeftColor: theme('colors.brand.highlight'),
              color: theme('colors.brand.text'),
              fontStyle: 'italic',
            },
            code: {
              color: theme('colors.brand.text'),
              backgroundColor: theme('colors.sage.50'),
              borderRadius: '0.25rem',
              padding: '0.125rem 0.375rem',
            },
          },
        },
      }),
    },
  },

  plugins: [
    // Plugin untuk typography (artikel blog)
    // require('@tailwindcss/typography'), // uncomment jika install @tailwindcss/typography
  ],
};
