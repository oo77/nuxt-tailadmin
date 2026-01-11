<template>
  <div class="space-y-4">
    <!-- Фильтры -->
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по названию объявления..."
          class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <select
        v-model="statusFilter"
        class="rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
      >
        <option value="">Все статусы</option>
        <option value="draft">Черновик</option>
        <option value="pending">На рассмотрении</option>
        <option value="approved">Одобрено</option>
        <option value="rejected">Отклонено</option>
        <option value="withdrawn">Отозвано</option>
      </select>
    </div>

    <!-- Список заявок -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка заявок...</p>
    </div>

    <div v-else-if="filteredRequests.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-lg font-medium">Заявки не найдены</p>
      <p class="mt-2">{{ searchQuery || statusFilter ? 'Попробуйте изменить фильтры' : 'Вы ещё не подавали заявок' }}</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="request in filteredRequests"
        :key="request.id"
        class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/30"
      >
        <div class="p-5">
          <!-- Заголовок -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <RepresentativeRequestStatusBadge :status="request.status" />
                <span
                  v-if="request.requestType"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {{ requestTypeLabel(request.requestType) }}
                </span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {{ request.announcement?.title || 'Объявление удалено' }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Подана {{ formatDate(request.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Информация о группах -->
          <div v-if="request.groups && request.groups.length > 0" class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Группы:</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="group in request.groups"
                :key="group.id"
                class="inline-flex items-center px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
              >
                <span class="font-medium text-gray-900 dark:text-white">{{ group.groupCode }}</span>
                <span class="ml-2 text-gray-500 dark:text-gray-400">
                  ({{ group.requestedSlots }} {{ pluralize(group.requestedSlots, 'место', 'места', 'мест') }})
                </span>
              </span>
            </div>
          </div>

          <!-- Комментарий -->
          <div v-if="request.comment" class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ request.comment }}</p>
          </div>

          <!-- Причина отклонения -->
          <div v-if="request.status === 'rejected' && request.rejectionReason" class="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
            <p class="text-sm font-medium text-danger mb-1">Причина отклонения:</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ request.rejectionReason }}</p>
          </div>

          <!-- Действия -->
          <div class="flex items-center gap-3">
            <button
              @click="$emit('view', request)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Подробнее
            </button>

            <button
              v-if="canWithdraw(request)"
              @click="$emit('withdraw', request)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors text-sm font-medium"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Отозвать
            </button>

            <button
              v-if="request.pdfUrl"
              @click="downloadPdf(request.pdfUrl)"
              class="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Скачать PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="px-3 py-2 rounded-lg border border-stroke dark:border-strokedark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Назад
      </button>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        Страница {{ currentPage }} из {{ totalPages }}
      </span>
      <button
        @click="currentPage++"
        :disabled="currentPage >= totalPages"
        class="px-3 py-2 rounded-lg border border-stroke dark:border-strokedark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Вперёд
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  requests: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['view', 'withdraw'])

const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const filteredRequests = computed(() => {
  let filtered = props.requests

  // Фильтр по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.announcement?.title?.toLowerCase().includes(query)
    )
  }

  // Фильтр по статусу
  if (statusFilter.value) {
    filtered = filtered.filter(r => r.status === statusFilter.value)
  }

  // Пагинация
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = props.requests

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.announcement?.title?.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(r => r.status === statusFilter.value)
  }

  return Math.ceil(filtered.length / itemsPerPage)
})

const canWithdraw = (request) => {
  return request.status === 'pending' || request.status === 'draft'
}

const requestTypeLabel = (type) => {
  const labels = {
    with_employees: 'С сотрудниками',
    reservation: 'Резервирование'
  }
  return labels[type] || type
}

const formatDate = (dateString) => {
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

const pluralize = (count, one, few, many) => {
  const mod10 = count % 10
  const mod100 = count % 100
  
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

const downloadPdf = (url) => {
  window.open(url, '_blank')
}
</script>
