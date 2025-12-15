<template>
  <div class="mx-auto max-w-7xl">
    <PageBreadcrumb pageName="User Profile" />
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
        User Profile
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        User profile page content will be here.
      </p>
    </div>
  </div>
</template>

<script setup>
import PageBreadcrumb from '~/components/common/PageBreadcrumb.vue'

useHead({
  title: 'User Profile | TailAdmin - Nuxt Tailwind CSS Dashboard',
})
</script>
