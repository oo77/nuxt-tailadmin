<template>
  <UiModal
    :is-open="isOpen"
    :title="'Детали заявки'"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="request" class="space-y-6">
      <!-- Status banner -->
      <div 
        :class="[
          'flex items-center justify-between p-4 rounded-lg',
          statusBannerClass
        ]"
      >
        <div class="flex items-center gap-3">
          <RepresentativeRequestStatusBadge 
            :status="request.status" 
            :expires-at="request.reservationExpiresAt"
          />
          <span v-if="request.status === 'reserved'" class="text-sm">
            Ожидает загрузки PDF до {{ formatDateTime(request.reservationExpiresAt) }}
          </span>
        </div>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Подана: {{ formatDateTime(request.createdAt) }}
        </span>
      </div>

      <!-- Group info -->
      <div class="rounded-lg border border-stroke dark:border-strokedark p-5">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Информация о группе
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Код группы</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ request.group?.code }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Курс</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ request.group?.courseName }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Даты обучения</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(request.group?.startDate) }} - {{ formatDate(request.group?.endDate) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Количество сотрудников</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ request.employeesCount }}</p>
          </div>
        </div>
      </div>

      <!-- Employees list -->
      <div v-if="request.employees && request.employees.length > 0" class="rounded-lg border border-stroke dark:border-strokedark p-5">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Сотрудники ({{ request.employees.length }})
        </h4>

        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="employee in request.employees"
            :key="employee.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {{ getInitials(employee.student?.fullName || '') }}
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ employee.student?.fullName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ employee.student?.position || 'Должность не указана' }}
                </p>
              </div>
            </div>
            <span 
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-medium',
                employee.enrollmentStatus === 'enrolled' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              ]"
            >
              {{ employee.enrollmentStatus === 'enrolled' ? 'Зачислен' : 'Ожидает' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="request.representativeNotes" class="rounded-lg border border-stroke dark:border-strokedark p-5">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Примечания</h4>
        <p class="text-gray-700 dark:text-gray-300">{{ request.representativeNotes }}</p>
      </div>

      <!-- Rejection reason -->
      <div 
        v-if="request.status === 'rejected' && request.rejectionReason" 
        class="rounded-lg bg-danger/10 border border-danger/20 p-5"
      >
        <h4 class="font-semibold text-danger mb-3 flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Причина отклонения
        </h4>
        <p class="text-gray-700 dark:text-gray-300">{{ request.rejectionReason }}</p>
      </div>

      <!-- PDF status -->
      <div v-if="request.pdfFileId" class="rounded-lg border border-stroke dark:border-strokedark p-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">PDF-файл заявки</p>
              <p class="text-sm text-success">Загружен</p>
            </div>
          </div>
          <a
            :href="request.pdfFileUrl"
            target="_blank"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Скачать
          </a>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div>
          <button
            v-if="request?.status === 'pending'"
            @click="$emit('withdraw', request)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger/10 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Отозвать заявку
          </button>
          <button
            v-if="request?.status === 'reserved'"
            @click="$emit('upload-pdf', request)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-info text-white hover:bg-info/90 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Загрузить PDF
          </button>
        </div>
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Закрыть
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'withdraw', 'upload-pdf'])

// Computed
const statusBannerClass = computed(() => {
  switch (props.request?.status) {
    case 'pending': return 'bg-warning/10 border border-warning/20'
    case 'reserved': return 'bg-info/10 border border-info/20'
    case 'approved': return 'bg-success/10 border border-success/20'
    case 'rejected': return 'bg-danger/10 border border-danger/20'
    default: return 'bg-gray-100 dark:bg-gray-800'
  }
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

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}
</script>
