<template>
  <UiModal
    :is-open="isOpen"
    title="Информация о группе"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="group" class="space-y-6">
      <!-- Header with code and status -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
              {{ group.code }}
            </span>
            <span 
              v-if="group.acceptsRequests && group.availableSlots > 0"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success"
            >
              Принимает заявки
            </span>
            <span 
              v-else
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {{ group.availableSlots === 0 ? 'Мест нет' : 'Заявки закрыты' }}
            </span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ group.courseName }}
          </h3>
        </div>
        
        <!-- Capacity -->
        <div class="text-right">
          <p class="text-3xl font-bold" :class="availableSlotsColor">
            {{ group.availableSlots }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            из {{ group.maxCapacity }} мест
          </p>
        </div>
      </div>

      <!-- Info grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Даты обучения</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Продолжительность</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ durationDays }} дней</p>
          </div>
        </div>

        <div v-if="group.classroom" class="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Место проведения</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ group.classroom }}</p>
          </div>
        </div>

        <div v-if="group.requestDeadline" class="flex items-center gap-3 p-4 rounded-lg" :class="isDeadlineSoon ? 'bg-danger/10' : 'bg-gray-50 dark:bg-gray-800'">
          <div :class="['h-10 w-10 rounded-lg flex items-center justify-center', isDeadlineSoon ? 'bg-danger/20' : 'bg-primary/10']">
            <svg :class="['h-5 w-5', isDeadlineSoon ? 'text-danger' : 'text-primary']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p class="text-sm" :class="isDeadlineSoon ? 'text-danger' : 'text-gray-500 dark:text-gray-400'">
              Приём заявок до
            </p>
            <p class="font-medium" :class="isDeadlineSoon ? 'text-danger' : 'text-gray-900 dark:text-white'">
              {{ formatDate(group.requestDeadline) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Capacity progress -->
      <div class="p-4 rounded-lg border border-stroke dark:border-strokedark">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Заполненность группы</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ Math.round(capacityPercentage) }}%</span>
        </div>
        <div class="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-500 rounded-full"
            :class="capacityBarColor"
            :style="{ width: `${capacityPercentage}%` }"
          />
        </div>
        <div class="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{{ group.maxCapacity - group.availableSlots }} занято</span>
          <span>{{ group.availableSlots }} свободно</span>
        </div>
      </div>

      <!-- Announcement text -->
      <div v-if="group.announcementText" class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 class="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Описание программы
        </h4>
        <p class="text-sm text-blue-600 dark:text-blue-400">{{ group.announcementText }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Закрыть
        </button>
        <button
          v-if="group?.acceptsRequests && group?.availableSlots > 0"
          @click="$emit('apply', group)"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Подать заявку
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'apply'])

// Computed
const capacityPercentage = computed(() => {
  if (!props.group?.maxCapacity) return 0
  const used = props.group.maxCapacity - props.group.availableSlots
  return Math.min(100, (used / props.group.maxCapacity) * 100)
})

const capacityBarColor = computed(() => {
  const pct = capacityPercentage.value
  if (pct >= 90) return 'bg-danger'
  if (pct >= 70) return 'bg-warning'
  return 'bg-success'
})

const availableSlotsColor = computed(() => {
  const slots = props.group?.availableSlots || 0
  if (slots === 0) return 'text-gray-400'
  if (slots <= 3) return 'text-danger'
  if (slots <= 5) return 'text-warning'
  return 'text-success'
})

const durationDays = computed(() => {
  if (!props.group?.startDate || !props.group?.endDate) return 0
  const start = new Date(props.group.startDate)
  const end = new Date(props.group.endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isDeadlineSoon = computed(() => {
  if (!props.group?.requestDeadline) return false
  const now = new Date()
  const deadline = new Date(props.group.requestDeadline)
  const diff = deadline.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days <= 3 && days >= 0
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
</script>
