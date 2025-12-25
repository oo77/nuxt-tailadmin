// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Настройка dev-сервера для доступа извне
  devServer: {
    host: '0.0.0.0', // Слушает все сетевые интерфейсы
    port: 3000,      // Порт можно изменить при необходимости
  },
  
  css: ['~/assets/css/main.css'],
  
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    }
  },
  
  app: {
    head: {
      title: 'АТЦ - Учебный центр',
      meta: [
        { name: 'description', content: 'Платформа управления учебно-тренировочным центром АТЦ' }
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
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
