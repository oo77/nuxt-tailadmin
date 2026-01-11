<template>
  <UiModal
    :is-open="isOpen"
    title="Детали заявки"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="request" class="space-y-6">
      <!-- Status and dates -->
      <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-3">
          <RequestStatusBadge :status="request.status" />
          <span 
            v-if="request.requestType === 'reservation'"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info/10 text-info"
          >
            Резервация мест
          </span>
          <span 
            v-else
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary"
          >
            С сотрудниками
          </span>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Подана: {{ formatDateTime(request.createdAt) }}
        </div>
      </div>

      <!-- Organization & Representative -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Организация</h4>
          <p class="font-semibold text-gray-900 dark:text-white">{{ request.organizationName }}</p>
          <p v-if="request.organizationShortName" class="text-sm text-gray-600 dark:text-gray-400">
            {{ request.organizationShortName }}
          </p>
        </div>
        
        <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Представитель</h4>
          <p class="font-semibold text-gray-900 dark:text-white">{{ request.representativeName }}</p>
          <p v-if="request.representativePhone" class="text-sm text-gray-600 dark:text-gray-400">
            {{ request.representativePhone }}
          </p>
        </div>
      </div>

      <!-- Announcement info -->
      <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Объявление</h4>
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-900 dark:text-white">{{ request.announcementTitle }}</p>
            <p v-if="request.announcementDescription" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ request.announcementDescription }}
            </p>
          </div>
        </div>
      </div>

      <!-- Groups -->
      <div v-if="request.groups && request.groups.length > 0" class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Выбранные группы ({{ request.groups.length }})
        </h4>
        <div class="space-y-2">
          <div
            v-for="group in request.groups"
            :key="group.id"
            class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                {{ group.code }}
              </span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ group.courseName }}
              </span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}
              <span v-if="group.requestedSlots" class="ml-2">
                • Запрошено мест: {{ group.requestedSlots }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Employees -->
      <div v-if="request.requestType === 'with_employees'" class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Сотрудники ({{ request.employees?.length || 0 }})
          </h4>
        </div>
        
        <div v-if="request.employees && request.employees.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="employee in request.employees"
            :key="employee.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {{ getInitials(employee.studentName || '') }}
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white text-sm">
                  {{ employee.studentName }}
                </p>
                <p v-if="employee.studentPinfl" class="text-xs text-gray-500 dark:text-gray-400">
                  ПИНФЛ: {{ employee.studentPinfl }}
                </p>
              </div>
            </div>
            <span 
              v-if="employee.groupCode"
              class="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary"
            >
              {{ employee.groupCode }}
            </span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
          Список сотрудников недоступен
        </p>
      </div>

      <!-- Reservation info -->
      <div v-if="request.requestType === 'reservation'" class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Резервация</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Запрошено мест</p>
            <p class="text-2xl font-bold text-primary mt-1">{{ request.totalRequestedSlots || 0 }}</p>
          </div>
          <div v-if="request.status === 'approved'">
            <p class="text-sm text-gray-600 dark:text-gray-400">Одобрено мест</p>
            <p class="text-2xl font-bold text-success mt-1">{{ request.approvedSlots || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- PDF file -->
      <div v-if="request.pdfFileId" class="rounded-lg border border-stroke dark:border-strokedark p-4">
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

      <!-- Notes -->
      <div v-if="request.notes" class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Примечания</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm">{{ request.notes }}</p>
      </div>

      <!-- Review info -->
      <div v-if="request.status === 'approved' || request.status === 'rejected'" class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Рассмотрение</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Рассмотрел:</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ request.reviewerName }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Дата:</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(request.reviewedAt) }}</span>
          </div>
          <div v-if="request.reviewNotes" class="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ request.reviewNotes }}</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            v-if="request?.status === 'pending' && canApprove"
            @click="$emit('approve', request)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success/90 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Одобрить
          </button>

          <button
            v-if="(request?.status === 'pending' || request?.status === 'draft') && canReject"
            @click="$emit('reject', request)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger/10 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Отклонить
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
import RequestStatusBadge from '../representative/RequestStatusBadge.vue'

defineProps({
  request: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  canApprove: {
    type: Boolean,
    default: true
  },
  canReject: {
    type: Boolean,
    default: true
  }
})

defineEmits(['close', 'approve', 'reject'])

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
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
