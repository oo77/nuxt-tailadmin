<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Инициализация темы на клиенте
useTheme()

useHead({
  titleTemplate: (title) => title 
    ? `${title} | TailAdmin - Nuxt Dashboard` 
    : 'TailAdmin - Nuxt Dashboard',
  htmlAttrs: {
    lang: 'ru'
  },
  bodyAttrs: {
    class: 'relative font-normal font-outfit z-1 bg-gray-50 dark:bg-gray-900'
  }
})
</script>
