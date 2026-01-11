<template>
  <div 
    class="group relative bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30"
  >
    <!-- Status indicator bar -->
    <div 
      :class="[
        'h-1 w-full',
        announcement.status === 'published' ? 'bg-success' : 'bg-gray-300'
      ]"
    />
    
    <div class="p-5">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span 
              v-if="announcement.announcementType"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary"
            >
              {{ typeLabel }}
            </span>
            <span 
              v-if="!announcement.acceptsRequests"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              Заявки закрыты
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
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

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-xl font-bold text-primary">
            {{ announcement.groupsCount || 0 }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ pluralize(announcement.groupsCount || 0, 'группа', 'группы', 'групп') }}
          </div>
        </div>

        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-xl font-bold text-success">
            {{ availableSlots }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Доступно мест
          </div>
        </div>

        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-xl font-bold" :class="capacityColor">
            {{ capacityPercentage }}%
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Заполнено
          </div>
        </div>
      </div>

      <!-- Deadline warning -->
      <div 
        v-if="announcement.requestDeadline && isDeadlineSoon"
        class="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 text-warning text-sm"
      >
        <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="font-medium">
          Приём заявок до {{ formatDate(announcement.requestDeadline) }} ({{ daysUntilDeadline }}д)
        </span>
      </div>

      <!-- Additional info -->
      <div 
        v-if="announcement.additionalInfo" 
        class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
      >
        <p class="line-clamp-3">{{ announcement.additionalInfo }}</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          v-if="announcement.acceptsRequests && availableSlots > 0"
          @click="$emit('apply', announcement)"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Подать заявку
        </button>
        
        <button
          v-else-if="availableSlots === 0"
          disabled
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium text-sm cursor-not-allowed"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Мест нет
        </button>
        
        <button
          v-else
          disabled
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium text-sm cursor-not-allowed"
        >
          Заявки закрыты
        </button>

        <button
          @click="$emit('details', announcement)"
          class="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title="Подробнее"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  announcement: {
    type: Object,
    required: true
  }
})

defineEmits(['apply', 'details'])

const typeLabel = computed(() => {
  const labels = {
    single_group: 'Одна группа',
    multiple_groups: 'Несколько групп',
    program: 'Программа'
  }
  return labels[props.announcement.announcementType] || props.announcement.announcementType
})

const availableSlots = computed(() => {
  const total = props.announcement.totalCapacity || 0
  const reserved = props.announcement.totalReserved || 0
  return Math.max(0, total - reserved)
})

const capacityPercentage = computed(() => {
  if (!props.announcement.totalCapacity) return 0
  const reserved = props.announcement.totalReserved || 0
  return Math.min(100, Math.round((reserved / props.announcement.totalCapacity) * 100))
})

const capacityColor = computed(() => {
  const percentage = capacityPercentage.value
  if (percentage >= 90) return 'text-danger'
  if (percentage >= 70) return 'text-warning'
  return 'text-success'
})

const daysUntilDeadline = computed(() => {
  if (!props.announcement.requestDeadline) return null
  const now = new Date()
  const deadline = new Date(props.announcement.requestDeadline)
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isDeadlineSoon = computed(() => {
  return daysUntilDeadline.value !== null && daysUntilDeadline.value <= 7 && daysUntilDeadline.value >= 0
})

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
