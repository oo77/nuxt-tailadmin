<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Всего групп -->
    <StatCard
      label="Учебных групп"
      :value="stats.totalGroups || 0"
      variant="blue"
      :icon="resolveComponent('IconUsers')"
    />

    <!-- Всего мест -->
    <StatCard
      label="Всего мест"
      :value="stats.totalCapacity || 0"
      variant="green"
      :icon="resolveComponent('IconChair')"
    />

    <!-- Зарезервировано -->
    <StatCard
      label="Зарезервировано"
      :value="stats.totalReserved || 0"
      variant="orange"
      :icon="resolveComponent('IconBookmark')"
    />

    <!-- Заявок -->
    <StatCard
      label="Заявок"
      :value="stats.totalRequests || 0"
      variant="purple"
      :icon="resolveComponent('IconFileText')"
    />
  </div>

  <!-- Детальная статистика -->
  <div v-if="showDetails" class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Статистика по статусам заявок -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-5">
      <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
        Заявки по статусам
      </h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-warning"></span>
            <span class="text-sm text-gray-600 dark:text-gray-400">На рассмотрении</span>
          </div>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ stats.requestsByStatus?.pending || 0 }}
          </span>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-success"></span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Одобрено</span>
          </div>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ stats.requestsByStatus?.approved || 0 }}
          </span>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-danger"></span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Отклонено</span>
          </div>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ stats.requestsByStatus?.rejected || 0 }}
          </span>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-gray-400"></span>
            <span class="text-sm text-gray-600 dark:text-gray-400">Черновик</span>
          </div>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ stats.requestsByStatus?.draft || 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Заполненность -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-5">
      <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
        Заполненность мест
      </h3>
      
      <div class="mb-4">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-gray-600 dark:text-gray-400">Общая заполненность</span>
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ capacityPercentage }}%
          </span>
        </div>
        <div class="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-500 rounded-full"
            :class="capacityColor"
            :style="{ width: `${capacityPercentage}%` }"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-stroke dark:border-strokedark">
        <div>
          <div class="text-2xl font-bold text-success">
            {{ availableSlots }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Доступно мест
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-primary">
            {{ stats.totalReserved || 0 }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Зарезервировано
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, resolveComponent } from 'vue'
import StatCard from '../common/StatCard.vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  },
  showDetails: {
    type: Boolean,
    default: true
  }
})

const capacityPercentage = computed(() => {
  if (!props.stats.totalCapacity) return 0
  const reserved = props.stats.totalReserved || 0
  return Math.min(100, Math.round((reserved / props.stats.totalCapacity) * 100))
})

const availableSlots = computed(() => {
  const total = props.stats.totalCapacity || 0
  const reserved = props.stats.totalReserved || 0
  return Math.max(0, total - reserved)
})

const capacityColor = computed(() => {
  const percentage = capacityPercentage.value
  if (percentage >= 90) return 'bg-danger'
  if (percentage >= 70) return 'bg-warning'
  return 'bg-success'
})
</script>
