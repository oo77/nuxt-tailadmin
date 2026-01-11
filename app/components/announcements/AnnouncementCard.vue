<template>
  <div 
    class="group relative bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30"
  >
    <!-- Status indicator bar -->
    <div 
      :class="[
        'h-1 w-full',
        announcement.status === 'published' ? 'bg-success' :
        announcement.status === 'closed' ? 'bg-warning' :
        announcement.status === 'archived' ? 'bg-gray-400' :
        'bg-gray-300'
      ]"
    />
    
    <div class="p-5">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-2">
            <AnnouncementStatusBadge :status="announcement.status" />
            <span 
              v-if="announcement.announcementType"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
            >
              {{ typeLabel }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
            {{ announcement.title }}
          </h3>
          <p 
            v-if="announcement.description" 
            class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
          >
            {{ announcement.description }}
          </p>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <!-- Groups count -->
        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-2xl font-bold text-primary">
            {{ announcement.groupsCount || 0 }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ pluralize(announcement.groupsCount || 0, 'группа', 'группы', 'групп') }}
          </div>
        </div>

        <!-- Total capacity -->
        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-2xl font-bold text-success">
            {{ announcement.totalCapacity || 0 }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Всего мест
          </div>
        </div>

        <!-- Requests count -->
        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-2xl font-bold text-warning">
            {{ announcement.requestsCount || 0 }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ pluralize(announcement.requestsCount || 0, 'заявка', 'заявки', 'заявок') }}
          </div>
        </div>
      </div>

      <!-- Dates info -->
      <div class="space-y-2 mb-4">
        <div 
          v-if="announcement.publishedAt"
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <svg class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Опубликовано: {{ formatDate(announcement.publishedAt) }}</span>
        </div>

        <div 
          v-if="announcement.requestDeadline"
          class="flex items-center gap-2 text-sm"
          :class="isDeadlineSoon ? 'text-danger' : 'text-gray-600 dark:text-gray-400'"
        >
          <svg class="h-4 w-4 shrink-0" :class="isDeadlineSoon ? 'text-danger' : 'text-primary'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            Приём заявок до: {{ formatDate(announcement.requestDeadline) }}
            <span v-if="isDeadlineSoon" class="font-medium">({{ daysUntilDeadline }}д)</span>
          </span>
        </div>

        <div 
          v-if="announcement.closedAt"
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <svg class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Закрыто: {{ formatDate(announcement.closedAt) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          @click="$emit('view', announcement)"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Просмотр
        </button>

        <button
          v-if="canEdit"
          @click="$emit('edit', announcement)"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Редактировать
        </button>

        <button
          v-if="canDelete"
          @click="$emit('delete', announcement)"
          class="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg border border-danger text-danger hover:bg-danger/10 transition-colors"
          title="Удалить"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AnnouncementStatusBadge from './AnnouncementStatusBadge.vue'

const props = defineProps({
  announcement: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: true
  },
  canDelete: {
    type: Boolean,
    default: true
  }
})

defineEmits(['view', 'edit', 'delete'])

// Computed
const typeLabel = computed(() => {
  const labels = {
    single_group: 'Одна группа',
    multiple_groups: 'Несколько групп',
    program: 'Программа'
  }
  return labels[props.announcement.announcementType] || props.announcement.announcementType
})

const daysUntilDeadline = computed(() => {
  if (!props.announcement.requestDeadline) return null
  const now = new Date()
  const deadline = new Date(props.announcement.requestDeadline)
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isDeadlineSoon = computed(() => {
  return daysUntilDeadline.value !== null && daysUntilDeadline.value <= 3 && daysUntilDeadline.value >= 0
})

// Methods
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const pluralize = (count, one, few, many) => {
  const mod10 = count % 10
  const mod100 = count % 100
  
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
</script>
