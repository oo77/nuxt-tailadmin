<template>
  <div class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark">
    <div class="px-5 py-4 border-b border-stroke dark:border-strokedark">
      <h3 class="text-lg font-semibold text-black dark:text-white">
        Учебные группы
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ groups.length }} {{ pluralize(groups.length, 'группа', 'группы', 'групп') }}
      </p>
    </div>

    <div class="p-5">
      <div v-if="groups.length === 0" class="text-center py-8">
        <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Группы не добавлены
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.id"
          class="p-4 rounded-lg border border-stroke dark:border-strokedark hover:border-primary/30 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- Заголовок -->
              <div class="flex items-center gap-2 mb-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {{ group.code }}
                </span>
                <span 
                  v-if="!group.isActive"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  Неактивна
                </span>
              </div>
              
              <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {{ group.courseName }}
              </h4>

              <!-- Информация -->
              <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}</span>
                </div>

                <div 
                  v-if="group.classroom"
                  class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <svg class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ group.classroom }}</span>
                </div>
              </div>

              <!-- Capacity info -->
              <div v-if="group.maxCapacity" class="mt-3">
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Заполненность</span>
                  <span>{{ group.currentReserved || 0 }} / {{ group.maxCapacity }}</span>
                </div>
                <div class="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-500 rounded-full"
                    :class="getCapacityColor(group)"
                    :style="{ width: `${getCapacityPercentage(group)}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div v-if="showStats" class="shrink-0 text-right">
              <div class="text-2xl font-bold" :class="getAvailableSlotsColor(group)">
                {{ getAvailableSlots(group) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ group.maxCapacity ? 'доступно' : 'мест' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  groups: {
    type: Array,
    required: true
  },
  showStats: {
    type: Boolean,
    default: true
  }
})

const getCapacityPercentage = (group) => {
  if (!group.maxCapacity) return 0
  const reserved = group.currentReserved || 0
  return Math.min(100, (reserved / group.maxCapacity) * 100)
}

const getCapacityColor = (group) => {
  const percentage = getCapacityPercentage(group)
  if (percentage >= 90) return 'bg-danger'
  if (percentage >= 70) return 'bg-warning'
  return 'bg-success'
}

const getAvailableSlots = (group) => {
  if (!group.maxCapacity) return group.currentReserved || 0
  return Math.max(0, group.maxCapacity - (group.currentReserved || 0))
}

const getAvailableSlotsColor = (group) => {
  const slots = getAvailableSlots(group)
  if (!group.maxCapacity) return 'text-gray-600 dark:text-gray-400'
  if (slots === 0) return 'text-gray-400'
  if (slots <= 3) return 'text-danger'
  if (slots <= 5) return 'text-warning'
  return 'text-success'
}

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
