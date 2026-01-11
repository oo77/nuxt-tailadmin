<template>
  <div class="space-y-4">
    <!-- Заголовок и действия -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-black dark:text-white">
          Объявления
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Всего: {{ total }}
        </p>
      </div>
      <slot name="actions"></slot>
    </div>

    <!-- Список -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-5 animate-pulse"
      >
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>

    <div v-else-if="announcements.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        Объявлений не найдено
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ emptyMessage }}
      </p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AnnouncementCard
        v-for="announcement in announcements"
        :key="announcement.id"
        :announcement="announcement"
        :can-edit="canEdit"
        :can-delete="canDelete"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Показано {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, total) }} из {{ total }}
      </div>
      
      <div class="flex items-center gap-2">
        <button
          @click="$emit('page-change', currentPage - 1)"
          :disabled="currentPage === 1"
          :class="[
            'inline-flex items-center justify-center h-10 w-10 rounded-lg border transition-colors',
            currentPage === 1
              ? 'border-stroke dark:border-strokedark text-gray-400 cursor-not-allowed'
              : 'border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          ]"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="page !== '...' && $emit('page-change', page)"
            :class="[
              'inline-flex items-center justify-center h-10 min-w-10 px-2 rounded-lg border transition-colors',
              page === currentPage
                ? 'border-primary bg-primary text-white'
                : page === '...'
                ? 'border-transparent text-gray-400 cursor-default'
                : 'border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="$emit('page-change', currentPage + 1)"
          :disabled="currentPage === totalPages"
          :class="[
            'inline-flex items-center justify-center h-10 w-10 rounded-lg border transition-colors',
            currentPage === totalPages
              ? 'border-stroke dark:border-strokedark text-gray-400 cursor-not-allowed'
              : 'border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          ]"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AnnouncementCard from './AnnouncementCard.vue'

const props = defineProps({
  announcements: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  canEdit: {
    type: Boolean,
    default: true
  },
  canDelete: {
    type: Boolean,
    default: true
  },
  emptyMessage: {
    type: String,
    default: 'Попробуйте изменить фильтры или создать новое объявление'
  }
})

defineEmits(['view', 'edit', 'delete', 'page-change'])

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const visiblePages = computed(() => {
  const pages = []
  const current = props.currentPage
  const total = totalPages.value

  if (total <= 7) {
    // Показываем все страницы
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Показываем первую, последнюю и страницы вокруг текущей
    if (current <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 3; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})
</script>
