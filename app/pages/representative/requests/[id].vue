<template>
  <NuxtLayout name="representative">
    <div class="space-y-6">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm">
        <NuxtLink 
          to="/representative/requests" 
          class="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          Мои заявки
        </NuxtLink>
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-gray-900 dark:text-white font-medium">
          {{ request?.group?.code || 'Детали заявки' }}
        </span>
      </nav>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p class="text-gray-500 dark:text-gray-400">Загрузка заявки...</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <svg class="mx-auto h-16 w-16 text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ error }}</h3>
        <NuxtLink 
          to="/representative/requests" 
          class="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться к списку заявок
        </NuxtLink>
      </div>

      <!-- Content -->
      <div v-else-if="request" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Status card -->
          <div 
            :class="[
              'rounded-xl overflow-hidden',
              statusCardClass
            ]"
          >
            <div class="p-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div :class="['h-14 w-14 rounded-xl flex items-center justify-center', statusIconBgClass]">
                    <component :is="statusIcon" :class="['h-7 w-7', statusIconClass]" />
                  </div>
                  <div>
                    <RepresentativeRequestStatusBadge 
                      :status="request.status" 
                      :expires-at="request.reservationExpiresAt"
                    />
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {{ statusDescription }}
                    </p>
                  </div>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Подана: {{ formatDateTime(request.createdAt) }}
                </div>
              </div>

              <!-- Reserved status - need PDF upload -->
              <div 
                v-if="request.status === 'reserved'" 
                class="mt-6 p-4 rounded-lg bg-white/50 dark:bg-black/20"
              >
                <div class="flex items-start gap-3">
                  <svg class="h-5 w-5 text-info shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-white">Места забронированы!</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Загрузите PDF-файл заявки с подписью руководства для подтверждения.
                      Срок брони: <strong>{{ formatDateTime(request.reservationExpiresAt) }}</strong>
                    </p>
                    <button
                      @click="showPdfModal = true"
                      class="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-info text-white font-medium hover:bg-info/90 transition-colors"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Загрузить PDF
                    </button>
                  </div>
                </div>
              </div>

              <!-- Rejection reason -->
              <div 
                v-if="request.status === 'rejected' && request.rejectionReason" 
                class="mt-6 p-4 rounded-lg bg-white/50 dark:bg-black/20"
              >
                <p class="font-medium text-danger mb-2">Причина отклонения:</p>
                <p class="text-gray-700 dark:text-gray-300">{{ request.rejectionReason }}</p>
              </div>
            </div>
          </div>

          <!-- Group info -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
            <div class="flex items-center gap-3 mb-5">
              <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Информация о группе</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Код группы</p>
                <p class="font-semibold text-primary text-lg">{{ request.group?.code }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Название курса</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ request.group?.courseName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Даты обучения</p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(request.group?.startDate) }} - {{ formatDate(request.group?.endDate) }}
                </p>
              </div>
              <div v-if="request.group?.classroom">
                <p class="text-sm text-gray-500 dark:text-gray-400">Место проведения</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ request.group.classroom }}</p>
              </div>
            </div>
          </div>

          <!-- Employees list -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Сотрудники ({{ request.employeesCount }})
                </h3>
              </div>
              <span 
                v-if="enrolledCount === request.employeesCount"
                class="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success"
              >
                Все зачислены
              </span>
            </div>

            <div v-if="request.employees && request.employees.length > 0" class="space-y-3">
              <div
                v-for="employee in request.employees"
                :key="employee.id"
                class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="flex items-center gap-4">
                  <div 
                    :class="[
                      'flex h-11 w-11 items-center justify-center rounded-full font-semibold',
                      employee.enrollmentStatus === 'enrolled'
                        ? 'bg-success/10 text-success'
                        : 'bg-primary/10 text-primary'
                    ]"
                  >
                    {{ getInitials(employee.student?.fullName || '') }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ employee.student?.fullName }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ employee.student?.position || 'Должность не указана' }}
                      <span v-if="employee.student?.pinfl" class="text-gray-400"> • {{ employee.student.pinfl }}</span>
                    </p>
                  </div>
                </div>
                <span 
                  :class="[
                    'px-3 py-1.5 rounded-lg text-xs font-medium',
                    employee.enrollmentStatus === 'enrolled' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  ]"
                >
                  {{ employee.enrollmentStatus === 'enrolled' ? 'Зачислен' : 'Ожидает зачисления' }}
                </span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
              Список сотрудников загружается...
            </p>
          </div>

          <!-- Notes -->
          <div v-if="request.representativeNotes" class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Примечания</h3>
            </div>
            <p class="text-gray-700 dark:text-gray-300">{{ request.representativeNotes }}</p>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Actions card -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Действия</h3>
            
            <div class="space-y-3">
              <!-- Withdraw -->
              <button
                v-if="request.status === 'pending'"
                @click="withdrawRequest"
                :disabled="withdrawing"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-danger text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
              >
                <span v-if="withdrawing" class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Отозвать заявку
              </button>

              <!-- Upload PDF -->
              <button
                v-if="request.status === 'reserved'"
                @click="showPdfModal = true"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-info text-white font-medium hover:bg-info/90 transition-colors"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Загрузить PDF
              </button>

              <!-- Back to list -->
              <NuxtLink
                to="/representative/requests"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                К списку заявок
              </NuxtLink>
            </div>
          </div>

          <!-- PDF file -->
          <div v-if="request.pdfFileId" class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">PDF-файл</h3>
                <p class="text-sm text-success">Загружен</p>
              </div>
            </div>
            <a
              :href="request.pdfFileUrl"
              target="_blank"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Скачать PDF
            </a>
          </div>

          <!-- Timeline -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-4">История заявки</h3>
            
            <div class="relative pl-6 space-y-6">
              <!-- Timeline line -->
              <div class="absolute left-2 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>

              <!-- Created -->
              <div class="relative">
                <div class="absolute -left-6 w-4 h-4 rounded-full bg-primary"></div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Заявка подана</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(request.createdAt) }}</p>
              </div>

              <!-- Reserved -->
              <div v-if="request.reservedAt" class="relative">
                <div class="absolute -left-6 w-4 h-4 rounded-full bg-info"></div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Места забронированы</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(request.reservedAt) }}</p>
              </div>

              <!-- PDF uploaded -->
              <div v-if="request.pdfUploadedAt" class="relative">
                <div class="absolute -left-6 w-4 h-4 rounded-full bg-success"></div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">PDF загружен</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(request.pdfUploadedAt) }}</p>
              </div>

              <!-- Decision -->
              <div v-if="request.decisionAt" class="relative">
                <div 
                  :class="[
                    'absolute -left-6 w-4 h-4 rounded-full',
                    request.status === 'approved' ? 'bg-success' : 'bg-danger'
                  ]"
                ></div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ request.status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена' }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(request.decisionAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PDF Upload Modal -->
      <RepresentativePdfUploadModal
        v-if="request"
        :request="request"
        :is-open="showPdfModal"
        @close="showPdfModal = false"
        @uploaded="handlePdfUploaded"
      />
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const notification = useNotification()
const { authFetch } = useAuthFetch()

const requestId = route.params.id

// State
const loading = ref(true)
const withdrawing = ref(false)
const request = ref(null)
const error = ref(null)
const showPdfModal = ref(false)

// Status icons
const IconPending = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })]) }
const IconReserved = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' })]) }
const IconApproved = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })]) }
const IconRejected = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' })]) }

// Computed
const enrolledCount = computed(() => {
  if (!request.value?.employees) return 0
  return request.value.employees.filter(e => e.enrollmentStatus === 'enrolled').length
})

const statusIcon = computed(() => {
  switch (request.value?.status) {
    case 'pending': return IconPending
    case 'reserved': return IconReserved
    case 'approved': return IconApproved
    case 'rejected': return IconRejected
    default: return IconPending
  }
})

const statusCardClass = computed(() => {
  switch (request.value?.status) {
    case 'pending': return 'bg-warning/10 border border-warning/20'
    case 'reserved': return 'bg-info/10 border border-info/20'
    case 'approved': return 'bg-success/10 border border-success/20'
    case 'rejected': return 'bg-danger/10 border border-danger/20'
    default: return 'bg-gray-100 dark:bg-gray-800'
  }
})

const statusIconBgClass = computed(() => {
  switch (request.value?.status) {
    case 'pending': return 'bg-warning/20'
    case 'reserved': return 'bg-info/20'
    case 'approved': return 'bg-success/20'
    case 'rejected': return 'bg-danger/20'
    default: return 'bg-gray-200 dark:bg-gray-700'
  }
})

const statusIconClass = computed(() => {
  switch (request.value?.status) {
    case 'pending': return 'text-warning'
    case 'reserved': return 'text-info'
    case 'approved': return 'text-success'
    case 'rejected': return 'text-danger'
    default: return 'text-gray-600'
  }
})

const statusDescription = computed(() => {
  switch (request.value?.status) {
    case 'pending': return 'Заявка находится на рассмотрении администратора'
    case 'reserved': return 'Места забронированы, ожидается загрузка PDF-файла'
    case 'approved': return 'Заявка одобрена, сотрудники зачислены в группу'
    case 'rejected': return 'Заявка была отклонена'
    case 'withdrawn': return 'Заявка была отозвана'
    case 'expired': return 'Срок бронирования истёк'
    default: return ''
  }
})

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

const loadRequest = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await authFetch(`/api/training-requests/${requestId}`, { method: 'GET' })
    
    if (response.success && response.data) {
      request.value = response.data
    } else {
      error.value = 'Заявка не найдена'
    }
  } catch (err) {
    console.error('Error loading request:', err)
    error.value = 'Ошибка при загрузке заявки'
  } finally {
    loading.value = false
  }
}

const withdrawRequest = async () => {
  if (!confirm('Вы уверены, что хотите отозвать заявку?')) return

  withdrawing.value = true
  try {
    const response = await authFetch(`/api/training-requests/${requestId}/withdraw`, {
      method: 'POST'
    })

    if (response.success) {
      notification.success('Заявка успешно отозвана')
      router.push('/representative/requests')
    } else {
      notification.error(response.message || 'Ошибка при отзыве заявки')
    }
  } catch (err) {
    console.error('Error withdrawing request:', err)
    notification.error('Ошибка при отзыве заявки')
  } finally {
    withdrawing.value = false
  }
}

const handlePdfUploaded = async () => {
  showPdfModal.value = false
  notification.success('PDF-файл успешно загружен')
  await loadRequest()
}

onMounted(() => {
  loadRequest()
})
</script>
