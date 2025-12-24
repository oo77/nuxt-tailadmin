// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  css: ['~/assets/css/main.css'],
  
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    }
  },
  
  app: {
    head: {
      title: 'TailAdmin - Nuxt Dashboard',
      meta: [
        { name: 'description', content: 'Admin Dashboard Template built with Nuxt 4' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  
  typescript: {
    strict: true
  },
  
  components: [
    {
      path: '~/components',
    },
    {
      path: '~/components/icons',
      pathPrefix: false, // Иконки доступны без префикса (EyeIcon вместо IconsEyeIcon)
    },
  ],
  
  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    rollupConfig: {
      output: {
        format: 'esm'
      }
    },
    // Исключаем xlsx и sharp из бандлинга через rollup external для избежания проблем с ESM на Windows
    externals: {
      external: ['xlsx', 'sharp']
    }
  }
})
