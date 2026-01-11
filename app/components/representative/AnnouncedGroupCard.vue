<template>
  <div 
    class="group relative bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30"
  >
    <!-- Top gradient bar based on capacity -->
    <div 
      :class="[
        'h-1 w-full',
        capacityPercentage >= 90 ? 'bg-danger' :
        capacityPercentage >= 70 ? 'bg-warning' :
        'bg-success'
      ]"
    />
    
    <div class="p-5">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {{ group.code }}
            </span>
            <span 
              v-if="!group.acceptsRequests" 
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              Заявки закрыты
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {{ group.courseName }}
          </h3>
        </div>
        
        <!-- Capacity indicator -->
        <div class="shrink-0 text-right">
          <div class="text-2xl font-bold" :class="availableSlotsColor">
            {{ group.availableSlots }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            из {{ group.maxCapacity }} мест
          </div>
        </div>
      </div>

      <!-- Info grid -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- Dates -->
        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}</span>
        </div>

        <!-- Duration -->
        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ durationDays }} дней</span>
        </div>

        <!-- Request deadline -->
        <div 
          v-if="group.requestDeadline" 
          class="flex items-center gap-2 text-sm"
          :class="isDeadlineSoon ? 'text-danger' : 'text-gray-600 dark:text-gray-400'"
        >
          <svg class="h-4 w-4 shrink-0" :class="isDeadlineSoon ? 'text-danger' : 'text-primary'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            Приём до: {{ formatDate(group.requestDeadline) }}
            <span v-if="isDeadlineSoon" class="font-medium">({{ daysUntilDeadline }}д)</span>
          </span>
        </div>

        <!-- Classroom -->
        <div v-if="group.classroom" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{{ group.classroom }}</span>
        </div>
      </div>

      <!-- Capacity progress bar -->
      <div class="mb-4">
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Заполненность</span>
          <span>{{ Math.round(capacityPercentage) }}%</span>
        </div>
        <div class="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-500 rounded-full"
            :class="[
              capacityPercentage >= 90 ? 'bg-danger' :
              capacityPercentage >= 70 ? 'bg-warning' :
              'bg-success'
            ]"
            :style="{ width: `${capacityPercentage}%` }"
          />
        </div>
      </div>

      <!-- Low slots warning -->
      <div 
        v-if="group.availableSlots > 0 && group.availableSlots <= 5" 
        class="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 text-warning text-sm"
      >
        <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="font-medium">Осталось мало мест!</span>
      </div>

      <!-- Announcement text -->
      <div 
        v-if="group.announcementText" 
        class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
      >
        <p class="line-clamp-3">{{ group.announcementText }}</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          v-if="group.acceptsRequests && group.availableSlots > 0"
          @click="$emit('apply', group)"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Подать заявку
        </button>
        
        <button
          v-else-if="group.availableSlots === 0"
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
          @click="$emit('details', group)"
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
  group: {
    type: Object,
    required: true
  }
})

defineEmits(['apply', 'details'])

// Computed
const capacityPercentage = computed(() => {
  if (!props.group.maxCapacity) return 0
  const used = props.group.maxCapacity - props.group.availableSlots
  return Math.min(100, (used / props.group.maxCapacity) * 100)
})

const availableSlotsColor = computed(() => {
  const slots = props.group.availableSlots
  if (slots === 0) return 'text-gray-400'
  if (slots <= 3) return 'text-danger'
  if (slots <= 5) return 'text-warning'
  return 'text-success'
})

const durationDays = computed(() => {
  if (!props.group.startDate || !props.group.endDate) return 0
  const start = new Date(props.group.startDate)
  const end = new Date(props.group.endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const daysUntilDeadline = computed(() => {
  if (!props.group.requestDeadline) return null
  const now = new Date()
  const deadline = new Date(props.group.requestDeadline)
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
</script>
