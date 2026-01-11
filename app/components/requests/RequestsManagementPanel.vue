<template>
  <div class="space-y-6">
    <!-- Header with stats -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Управление заявками
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Рассмотрение и обработка заявок от представителей организаций
        </p>
      </div>

      <!-- Stats cards -->
      <div v-if="stats" class="flex flex-wrap gap-3">
        <div 
          v-for="stat in statCards" 
          :key="stat.key"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all',
            selectedStatus === stat.filterValue
              ? 'ring-2 ring-primary ring-offset-2'
              : '',
            stat.bgColor
          ]"
          @click="setStatusFilter(stat.filterValue)"
        >
          <component :is="stat.icon" :class="['h-5 w-5', stat.iconColor]" />
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400">{{ stat.label }}</p>
            <p :class="['text-lg font-bold', stat.textColor]">{{ stats[stat.key] || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Организация, группа..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-10 pr-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
              @input="debouncedSearch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Status filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Статус
          </label>
          <select
            v-model="selectedStatus"
            class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            @change="loadRequests"
          >
            <option value="">Все статусы</option>
            <option value="pending">На рассмотрении</option>
            <option value="reserved">Забронировано</option>
            <option value="approved">Одобрено</option>
            <option value="rejected">Отклонено</option>
            <option value="withdrawn">Отозвано</option>
          </select>
        </div>

        <!-- Group filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Группа
          </label>
          <select
            v-model="filters.groupId"
            class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            @change="loadRequests"
          >
            <option value="">Все группы</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.code }} - {{ group.courseName }}
            </option>
          </select>
        </div>

        <!-- Organization filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Организация
          </label>
          <select
            v-model="filters.organizationId"
            class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            @change="loadRequests"
          >
            <option value="">Все организации</option>
            <option v-for="org in organizations" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="p-12 text-center">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mx-auto"></div>
        <p class="mt-4 text-gray-500 dark:text-gray-400">Загрузка заявок...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="requests.length === 0" class="p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-lg font-medium text-gray-900 dark:text-white">Заявки не найдены</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Попробуйте изменить параметры фильтрации
        </p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800">
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Организация
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Группа
              </th>
              <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Сотрудников
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Статус
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Дата подачи
              </th>
              <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke dark:divide-strokedark">
            <tr 
              v-for="request in requests" 
              :key="request.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <!-- Organization -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {{ getInitials(request.organization?.name || '') }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                      {{ request.organization?.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ request.representative?.fullName }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Group -->
              <td class="px-6 py-4">
                <div>
                  <p class="font-medium text-primary">{{ request.group?.code }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {{ request.group?.courseName }}
                  </p>
                </div>
              </td>

              <!-- Employees count -->
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-lg bg-gray-100 dark:bg-gray-700 font-bold text-gray-900 dark:text-white">
                  {{ request.employeesCount }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <RepresentativeRequestStatusBadge 
                  :status="request.status" 
                  :expires-at="request.reservationExpiresAt"
                />
                <p v-if="request.status === 'reserved' && !request.pdfFileId" class="mt-1 text-xs text-warning">
                  Ожидает PDF
                </p>
                <p v-if="request.status === 'reserved' && request.pdfFileId" class="mt-1 text-xs text-success">
                  PDF загружен
                </p>
              </td>

              <!-- Date -->
              <td class="px-6 py-4">
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ formatDate(request.createdAt) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(request.createdAt) }}
                </p>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <!-- View -->
                  <button
                    @click="viewRequest(request)"
                    class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Просмотр"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <!-- Reserve (from pending) -->
                  <button
                    v-if="request.status === 'pending'"
                    @click="reserveRequest(request)"
                    :disabled="processing === request.id"
                    class="p-2 rounded-lg text-info hover:bg-info/10 transition-colors disabled:opacity-50"
                    title="Забронировать места"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <!-- Approve (from reserved with PDF) -->
                  <button
                    v-if="request.status === 'reserved' && request.pdfFileId"
                    @click="approveRequest(request)"
                    :disabled="processing === request.id"
                    class="p-2 rounded-lg text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                    title="Одобрить"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  <!-- Reject -->
                  <button
                    v-if="request.status === 'pending' || request.status === 'reserved'"
                    @click="openRejectModal(request)"
                    class="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    title="Отклонить"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-stroke dark:border-strokedark flex justify-center">
        <nav class="flex gap-2">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :disabled="page === '...'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              currentPage === page
                ? 'bg-primary text-white'
                : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            ]"
          >
            {{ page }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Request Detail Modal -->
    <RequestsAdminRequestDetailModal
      v-if="selectedRequest"
      :request="selectedRequest"
      :is-open="showDetailModal"
      @close="closeDetailModal"
      @reserve="reserveRequest"
      @approve="approveRequest"
      @reject="openRejectModal"
    />

    <!-- Reject Modal -->
    <RequestsRejectRequestModal
      v-if="requestToReject"
      :request="requestToReject"
      :is-open="showRejectModal"
      @close="closeRejectModal"
      @submit="handleReject"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'

const notification = useNotification()
const { authFetch } = useAuthFetch()

// Icons
const IconTotal = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'h-5 w-5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })]) }
const IconPending = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'h-5 w-5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })]) }
const IconReserved = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'h-5 w-5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' })]) }
const IconApproved = { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', class: 'h-5 w-5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })]) }

const statCards = [
  { key: 'pending', label: 'Ожидают', icon: IconPending, bgColor: 'bg-warning/10', iconColor: 'text-warning', textColor: 'text-warning', filterValue: 'pending' },
  { key: 'reserved', label: 'Забронировано', icon: IconReserved, bgColor: 'bg-info/10', iconColor: 'text-info', textColor: 'text-info', filterValue: 'reserved' },
  { key: 'approved', label: 'Одобрено', icon: IconApproved, bgColor: 'bg-success/10', iconColor: 'text-success', textColor: 'text-success', filterValue: 'approved' },
]

// State
const loading = ref(false)
const processing = ref(null)
const requests = ref([])
const stats = ref(null)
const groups = ref([])
const organizations = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const selectedStatus = ref('')

const filters = reactive({
  search: '',
  groupId: '',
  organizationId: ''
})

const selectedRequest = ref(null)
const showDetailModal = ref(false)
const requestToReject = ref(null)
const showRejectModal = ref(false)

// Computed
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

// Debounce
let searchTimer = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadRequests()
  }, 300)
}

// Methods
const loadRequests = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '15'
    })

    if (selectedStatus.value) params.append('status', selectedStatus.value)
    if (filters.search) params.append('search', filters.search)
    if (filters.groupId) params.append('groupId', filters.groupId)
    if (filters.organizationId) params.append('organizationId', filters.organizationId)

    const response = await authFetch(`/api/training-requests?${params.toString()}`, { method: 'GET' })

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

const loadGroups = async () => {
  try {
    const response = await authFetch('/api/groups/select', { method: 'GET' })
    if (response.success) {
      groups.value = response.data || []
    }
  } catch (error) {
    console.error('Error loading groups:', error)
  }
}

const loadOrganizations = async () => {
  try {
    const response = await authFetch('/api/organizations?limit=1000', { method: 'GET' })
    if (response.success) {
      organizations.value = response.data || []
    }
  } catch (error) {
    console.error('Error loading organizations:', error)
  }
}

const setStatusFilter = (status) => {
  selectedStatus.value = selectedStatus.value === status ? '' : status
  currentPage.value = 1
  loadRequests()
}

const changePage = (page) => {
  if (page === '...') return
  currentPage.value = page
  loadRequests()
}

const viewRequest = (request) => {
  selectedRequest.value = request
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedRequest.value = null
}

const reserveRequest = async (request) => {
  if (!confirm(`Забронировать места для заявки от ${request.organization?.name}?`)) return

  processing.value = request.id
  try {
    const response = await authFetch(`/api/training-requests/${request.id}/reserve`, {
      method: 'POST',
      body: { expiresInDays: 3 }
    })

    if (response.success) {
      notification.success('Места успешно забронированы')
      await Promise.all([loadRequests(), loadStats()])
      closeDetailModal()
    } else {
      notification.error(response.message || 'Ошибка при бронировании')
    }
  } catch (error) {
    console.error('Error reserving request:', error)
    notification.error('Ошибка при бронировании')
  } finally {
    processing.value = null
  }
}

const approveRequest = async (request) => {
  if (!confirm(`Одобрить заявку от ${request.organization?.name}? Сотрудники будут зачислены в группу.`)) return

  processing.value = request.id
  try {
    const response = await authFetch(`/api/training-requests/${request.id}/approve`, {
      method: 'POST'
    })

    if (response.success) {
      notification.success('Заявка одобрена, сотрудники зачислены')
      await Promise.all([loadRequests(), loadStats()])
      closeDetailModal()
    } else {
      notification.error(response.message || 'Ошибка при одобрении')
    }
  } catch (error) {
    console.error('Error approving request:', error)
    notification.error('Ошибка при одобрении')
  } finally {
    processing.value = null
  }
}

const openRejectModal = (request) => {
  requestToReject.value = request
  showRejectModal.value = true
  closeDetailModal()
}

const closeRejectModal = () => {
  showRejectModal.value = false
  requestToReject.value = null
}

const handleReject = async (data) => {
  if (!requestToReject.value) return

  processing.value = requestToReject.value.id
  try {
    const response = await authFetch(`/api/training-requests/${requestToReject.value.id}/reject`, {
      method: 'POST',
      body: { reason: data.reason }
    })

    if (response.success) {
      notification.success('Заявка отклонена')
      closeRejectModal()
      await Promise.all([loadRequests(), loadStats()])
    } else {
      notification.error(response.message || 'Ошибка при отклонении')
    }
  } catch (error) {
    console.error('Error rejecting request:', error)
    notification.error('Ошибка при отклонении')
  } finally {
    processing.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name) => {
  if (!name) return '?'
  const words = name.split(' ')
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

onMounted(() => {
  Promise.all([
    loadRequests(),
    loadStats(),
    loadGroups(),
    loadOrganizations()
  ])
})
</script>
