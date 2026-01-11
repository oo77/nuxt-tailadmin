<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <RequestsRequestsManagementPanel />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: ['auth']
})
</script>
