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
          <RepresentativeRequestStatusBadge 
            :status="request.status" 
            :expires-at="request.reservationExpiresAt"
          />
          <span v-if="request.status === 'reserved'" class="text-sm text-gray-500 dark:text-gray-400">
            Ожидает PDF до {{ formatDateTime(request.reservationExpiresAt) }}
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
          <p class="font-semibold text-gray-900 dark:text-white">{{ request.organization?.name }}</p>
          <p v-if="request.organization?.shortName" class="text-sm text-gray-600 dark:text-gray-400">
            {{ request.organization.shortName }}
          </p>
        </div>
        
        <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Представитель</h4>
          <p class="font-semibold text-gray-900 dark:text-white">{{ request.representative?.fullName }}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ request.representative?.phone }}</p>
        </div>
      </div>

      <!-- Group info -->
      <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Группа обучения</h4>
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-primary">{{ request.group?.code }}</p>
            <p class="text-gray-900 dark:text-white">{{ request.group?.courseName }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(request.group?.startDate) }} - {{ formatDate(request.group?.endDate) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Employees -->
      <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Сотрудники ({{ request.employeesCount }})
          </h4>
          <span 
            v-if="request.employees?.every(e => e.enrollmentStatus === 'enrolled')"
            class="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success"
          >
            Все зачислены
          </span>
        </div>
        
        <div v-if="request.employees && request.employees.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="employee in request.employees"
            :key="employee.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {{ getInitials(employee.student?.fullName || '') }}
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white text-sm">
                  {{ employee.student?.fullName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ employee.student?.pinfl }}
                </p>
              </div>
            </div>
            <span 
              :class="[
                'px-2 py-1 rounded text-xs font-medium',
                employee.enrollmentStatus === 'enrolled' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              ]"
            >
              {{ employee.enrollmentStatus === 'enrolled' ? 'Зачислен' : 'Ожидает' }}
            </span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
          Список сотрудников недоступен
        </p>
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
      <div v-else-if="request.status === 'reserved'" class="rounded-lg bg-warning/10 border border-warning/20 p-4">
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="text-sm text-warning font-medium">PDF-файл ещё не загружен представителем</span>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="request.representativeNotes || request.adminNotes" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-if="request.representativeNotes" class="rounded-lg border border-stroke dark:border-strokedark p-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Примечания представителя</h4>
          <p class="text-gray-700 dark:text-gray-300 text-sm">{{ request.representativeNotes }}</p>
        </div>
        <div v-if="request.adminNotes" class="rounded-lg border border-stroke dark:border-strokedark p-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Заметки администратора</h4>
          <p class="text-gray-700 dark:text-gray-300 text-sm">{{ request.adminNotes }}</p>
        </div>
      </div>

      <!-- Rejection reason -->
      <div v-if="request.status === 'rejected' && request.rejectionReason" class="rounded-lg bg-danger/10 border border-danger/20 p-4">
        <h4 class="font-medium text-danger mb-2">Причина отклонения</h4>
        <p class="text-gray-700 dark:text-gray-300">{{ request.rejectionReason }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <!-- Reserve button -->
          <button
            v-if="request?.status === 'pending'"
            @click="$emit('reserve', request)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-info text-white font-medium hover:bg-info/90 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Забронировать
          </button>

          <!-- Approve button -->
          <button
            v-if="request?.status === 'reserved' && request?.pdfFileId"
            @click="$emit('approve', request)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success/90 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Одобрить
          </button>

          <!-- Reject button -->
          <button
            v-if="request?.status === 'pending' || request?.status === 'reserved'"
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
defineProps({
  request: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'reserve', 'approve', 'reject'])

// Methods
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
