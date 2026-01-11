<template>
  <UiModal
    :is-open="isOpen"
    @close="$emit('close')"
    title="Детали объявления"
    size="xl"
  >
    <div v-if="announcement" class="space-y-6">
      <!-- Заголовок и статус -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary"
          >
            {{ typeLabel }}
          </span>
          <span 
            v-if="announcement.status === 'published'"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success"
          >
            Опубликовано
          </span>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ announcement.title }}
        </h2>
      </div>

      <!-- Описание -->
      <div v-if="announcement.description">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Описание</h3>
        <p class="text-gray-600 dark:text-gray-400">{{ announcement.description }}</p>
      </div>

      <!-- Основная информация -->
      <div class="grid grid-cols-2 gap-4">
        <div v-if="announcement.startDate">
          <label class="text-sm text-gray-500 dark:text-gray-400">Дата начала обучения</label>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(announcement.startDate) }}</p>
        </div>
        
        <div v-if="announcement.endDate">
          <label class="text-sm text-gray-500 dark:text-gray-400">Дата окончания обучения</label>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(announcement.endDate) }}</p>
        </div>
        
        <div v-if="announcement.requestDeadline">
          <label class="text-sm text-gray-500 dark:text-gray-400">Дедлайн подачи заявок</label>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(announcement.requestDeadline) }}</p>
        </div>
        
        <div>
          <label class="text-sm text-gray-500 dark:text-gray-400">Приём заявок</label>
          <p class="text-gray-900 dark:text-white font-medium">
            {{ announcement.acceptsRequests ? 'Открыт' : 'Закрыт' }}
          </p>
        </div>
      </div>

      <!-- Статистика -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-2xl font-bold text-primary">
            {{ announcement.groupsCount || 0 }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ pluralize(announcement.groupsCount || 0, 'группа', 'группы', 'групп') }}
          </div>
        </div>

        <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-2xl font-bold text-success">
            {{ availableSlots }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Доступно мест
          </div>
        </div>

        <div class="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-2xl font-bold" :class="capacityColor">
            {{ capacityPercentage }}%
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Заполнено
          </div>
        </div>
      </div>

      <!-- Требования -->
      <div v-if="announcement.requirements">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Требования</h3>
        <p class="text-gray-600 dark:text-gray-400">{{ announcement.requirements }}</p>
      </div>

      <!-- Контактная информация -->
      <div v-if="announcement.contactInfo">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Контактная информация</h3>
        <p class="text-gray-600 dark:text-gray-400">{{ announcement.contactInfo }}</p>
      </div>

      <!-- Дополнительная информация -->
      <div v-if="announcement.additionalInfo">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Дополнительная информация</h3>
        <p class="text-gray-600 dark:text-gray-400">{{ announcement.additionalInfo }}</p>
      </div>

      <!-- Учебные группы -->
      <div v-if="announcement.groups && announcement.groups.length > 0">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Учебные группы</h3>
        <div class="space-y-2">
          <div
            v-for="group in announcement.groups"
            :key="group.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ group.code }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ group.courseName }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ group.availableSlots || 0 }} / {{ group.maxCapacity || 0 }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">мест</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <UiButton variant="outline" @click="$emit('close')">
          Закрыть
        </UiButton>
        <UiButton
          v-if="announcement?.acceptsRequests && availableSlots > 0"
          variant="primary"
          @click="$emit('apply', announcement)"
        >
          <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Подать заявку
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  announcement: {
    type: Object,
    default: null
  }
})

defineEmits(['close', 'apply'])

const typeLabel = computed(() => {
  if (!props.announcement) return ''
  
  const labels = {
    single_group: 'Одна группа',
    multiple_groups: 'Несколько групп',
    program: 'Программа обучения'
  }
  return labels[props.announcement.announcementType] || props.announcement.announcementType
})

const availableSlots = computed(() => {
  if (!props.announcement) return 0
  const total = props.announcement.totalCapacity || 0
  const reserved = props.announcement.totalReserved || 0
  return Math.max(0, total - reserved)
})

const capacityPercentage = computed(() => {
  if (!props.announcement || !props.announcement.totalCapacity) return 0
  const reserved = props.announcement.totalReserved || 0
  return Math.min(100, Math.round((reserved / props.announcement.totalCapacity) * 100))
})

const capacityColor = computed(() => {
  const percentage = capacityPercentage.value
  if (percentage >= 90) return 'text-danger'
  if (percentage >= 70) return 'text-warning'
  return 'text-success'
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
