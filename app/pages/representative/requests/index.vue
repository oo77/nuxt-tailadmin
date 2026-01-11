<template>
  <NuxtLayout name="representative">
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Мои заявки
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            История и статус поданных заявок на обучение
          </p>
        </div>

        <NuxtLink
          to="/representative"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Новая заявка
        </NuxtLink>
      </div>

      <!-- Stats cards -->
      <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div 
          v-for="stat in statCards" 
          :key="stat.key"
          class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-4"
        >
          <div class="flex items-center gap-3">
            <div :class="['h-10 w-10 rounded-lg flex items-center justify-center', stat.bgColor]">
              <component :is="stat.icon" :class="['h-5 w-5', stat.iconColor]" />
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
              <p class="text-xl font-bold" :class="stat.textColor">{{ stats[stat.key] || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-5">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="filter in statusFilters"
            :key="filter.value"
            @click="setStatusFilter(filter.value)"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              selectedStatus === filter.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            ]"
          >
            {{ filter.label }}
            <span 
              v-if="filter.count !== undefined && filter.count > 0"
              :class="[
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                selectedStatus === filter.value ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
              ]"
            >
              {{ filter.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p class="text-gray-500 dark:text-gray-400">Загрузка заявок...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-else-if="requests.length === 0" 
        class="flex flex-col items-center justify-center py-16 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark"
      >
        <svg class="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {{ selectedStatus ? 'Заявки не найдены' : 'Нет заявок' }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
          {{ selectedStatus ? 'Попробуйте изменить фильтр' : 'Вы еще не подавали заявки на обучение' }}
        </p>
        <NuxtLink
          to="/representative"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Подать первую заявку
        </NuxtLink>
      </div>

      <!-- Requests list -->
      <div v-else class="space-y-4">
        <div
          v-for="request in requests"
          :key="request.id"
          class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark overflow-hidden transition-all hover:shadow-md"
        >
          <!-- Request header -->
          <div class="p-5 border-b border-stroke dark:border-strokedark">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="font-semibold text-primary">{{ request.group?.code }}</span>
                    <RepresentativeRequestStatusBadge 
                      :status="request.status" 
                      :expires-at="request.reservationExpiresAt"
                    />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {{ request.group?.courseName }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(request.group?.startDate) }} - {{ formatDate(request.group?.endDate) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <!-- Employee count -->
                <div class="text-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ request.employeesCount }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">сотрудников</p>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <button
                    @click="viewDetails(request)"
                    class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Подробнее"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Request details -->
          <div class="p-5">
            <!-- Reserved status - need PDF upload -->
            <div 
              v-if="request.status === 'reserved'" 
              class="mb-4 p-4 rounded-lg bg-info/10 border border-info/20"
            >
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-info shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="font-medium text-info">Места забронированы!</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Загрузите PDF-файл заявки с подписью руководства для подтверждения.
                    Срок брони: <strong>{{ formatDateTime(request.reservationExpiresAt) }}</strong>
                  </p>
                  <button
                    @click="openPdfUpload(request)"
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
              class="mb-4 p-4 rounded-lg bg-danger/10 border border-danger/20"
            >
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p class="font-medium text-danger">Причина отклонения:</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ request.rejectionReason }}</p>
                </div>
              </div>
            </div>

            <!-- Meta info -->
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1.5">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Подана: {{ formatDateTime(request.createdAt) }}</span>
              </div>

              <div v-if="request.pdfFileId" class="flex items-center gap-1.5 text-success">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF загружен</span>
              </div>

              <div v-if="request.decisionAt" class="flex items-center gap-1.5">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Решение: {{ formatDateTime(request.decisionAt) }}</span>
              </div>
            </div>

            <!-- Pending actions -->
            <div 
              v-if="request.status === 'pending'" 
              class="mt-4 pt-4 border-t border-stroke dark:border-strokedark flex items-center gap-3"
            >
              <button
                @click="withdrawRequest(request)"
                :disabled="withdrawing === request.id"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
              >
                <span v-if="withdrawing === request.id" class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Отозвать заявку
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center">
        <nav class="flex gap-2">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              currentPage === page
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-stroke dark:border-strokedark'
            ]"
          >
            {{ page }}
          </button>
        </nav>
      </div>

      <!-- PDF Upload Modal -->
      <RepresentativePdfUploadModal
        v-if="selectedRequestForPdf"
        :request="selectedRequestForPdf"
        :is-open="showPdfModal"
        @close="closePdfModal"
        @uploaded="handlePdfUploaded"
      />

      <!-- Request Detail Modal -->
      <RepresentativeRequestDetailModal
        v-if="selectedRequest"
        :request="selectedRequest"
        :is-open="showDetailModal"
        @close="closeDetailModal"
        @withdraw="withdrawRequest"
        @upload-pdf="openPdfUpload"
      />
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const notification = useNotification()
const { authFetch } = useAuthFetch()

// State
const loading = ref(false)
const requests = ref([])
const stats = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const selectedStatus = ref('')
const withdrawing = ref(null)

const selectedRequest = ref(null)
const showDetailModal = ref(false)
const selectedRequestForPdf = ref(null)
const showPdfModal = ref(false)

// Icons for stats
const IconTotal = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })]) }
const IconPending = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })]) }
const IconReserved = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' })]) }
const IconApproved = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })]) }
const IconRejected = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' })]) }

const statCards = [
  { key: 'total', label: 'Всего', icon: IconTotal, bgColor: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-600 dark:text-gray-400', textColor: 'text-gray-900 dark:text-white' },
  { key: 'pending', label: 'Ожидают', icon: IconPending, bgColor: 'bg-warning/10', iconColor: 'text-warning', textColor: 'text-warning' },
  { key: 'reserved', label: 'Забронировано', icon: IconReserved, bgColor: 'bg-info/10', iconColor: 'text-info', textColor: 'text-info' },
  { key: 'approved', label: 'Одобрено', icon: IconApproved, bgColor: 'bg-success/10', iconColor: 'text-success', textColor: 'text-success' },
  { key: 'rejected', label: 'Отклонено', icon: IconRejected, bgColor: 'bg-danger/10', iconColor: 'text-danger', textColor: 'text-danger' },
]

const statusFilters = computed(() => [
  { value: '', label: 'Все', count: stats.value?.total },
  { value: 'pending', label: 'На рассмотрении', count: stats.value?.pending },
  { value: 'reserved', label: 'Забронировано', count: stats.value?.reserved },
  { value: 'approved', label: 'Одобрено', count: stats.value?.approved },
  { value: 'rejected', label: 'Отклонено', count: stats.value?.rejected },
])

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

const loadRequests = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '10'
    })

    if (selectedStatus.value) {
      params.append('status', selectedStatus.value)
    }

    const response = await authFetch(`/api/training-requests/my?${params.toString()}`, { method: 'GET' })

    if (response.success) {
      requests.value = response.data || []
      totalPages.value = response.totalPages || 1
    }
  } catch (error) {
    console.error('Error loading requests:', error)
    notification.error('Ошибка при загрузке заявок')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await authFetch('/api/training-requests/stats', { method: 'GET' })
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const setStatusFilter = (status) => {
  selectedStatus.value = status
  currentPage.value = 1
  loadRequests()
}

const changePage = (page) => {
  currentPage.value = page
  loadRequests()
}

const viewDetails = (request) => {
  selectedRequest.value = request
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedRequest.value = null
}

const openPdfUpload = (request) => {
  selectedRequestForPdf.value = request
  showPdfModal.value = true
  closeDetailModal()
}

const closePdfModal = () => {
  showPdfModal.value = false
  selectedRequestForPdf.value = null
}

const handlePdfUploaded = async () => {
  closePdfModal()
  await Promise.all([loadRequests(), loadStats()])
  notification.success('PDF-файл успешно загружен')
}

const withdrawRequest = async (request) => {
  if (!confirm('Вы уверены, что хотите отозвать заявку?')) return

  withdrawing.value = request.id
  try {
    const response = await authFetch(`/api/training-requests/${request.id}/withdraw`, {
      method: 'POST'
    })

    if (response.success) {
      notification.success('Заявка успешно отозвана')
      await Promise.all([loadRequests(), loadStats()])
      closeDetailModal()
    } else {
      notification.error(response.message || 'Ошибка при отзыве заявки')
    }
  } catch (error) {
    console.error('Error withdrawing request:', error)
    notification.error('Ошибка при отзыве заявки')
  } finally {
    withdrawing.value = null
  }
}

onMounted(() => {
  Promise.all([loadRequests(), loadStats()])
})
</script>
