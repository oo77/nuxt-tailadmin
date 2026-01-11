<template>
  <div class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark">
    <div class="px-5 py-4 border-b border-stroke dark:border-strokedark">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-black dark:text-white">
            Заявки
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Всего: {{ total }}
          </p>
        </div>
        <slot name="actions"></slot>
      </div>
    </div>

    <div class="p-5">
      <!-- Фильтры -->
      <div v-if="showFilters" class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="status in statuses"
          :key="status.value"
          @click="$emit('filter-change', status.value)"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            currentFilter === status.value
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          {{ status.label }}
          <span v-if="status.count !== undefined" class="ml-1.5">
            ({{ status.count }})
          </span>
        </button>
      </div>

      <!-- Список -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="p-4 rounded-lg border border-stroke dark:border-strokedark animate-pulse"
        >
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>

      <div v-else-if="requests.length === 0" class="text-center py-8">
        <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Заявок не найдено
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="request in requests"
          :key="request.id"
          class="p-4 rounded-lg border border-stroke dark:border-strokedark hover:border-primary/30 transition-colors cursor-pointer"
          @click="$emit('view', request)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2">
                <RequestStatusBadge :status="request.status" />
                <span 
                  v-if="request.requestType === 'reservation'"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info/10 text-info"
                >
                  Резервация
                </span>
              </div>

              <!-- Organization -->
              <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {{ request.organizationName }}
              </h4>
              
              <!-- Representative -->
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Представитель: {{ request.representativeName }}
              </p>

              <!-- Details -->
              <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center gap-1.5">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{{ request.employeesCount || 0 }} {{ pluralize(request.employeesCount || 0, 'сотрудник', 'сотрудника', 'сотрудников') }}</span>
                </div>
                
                <div class="flex items-center gap-1.5">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{{ formatDate(request.createdAt) }}</span>
                </div>

                <div 
                  v-if="request.pdfFileId"
                  class="flex items-center gap-1.5 text-success"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>PDF загружен</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center gap-2">
              <button
                v-if="request.status === 'pending' && canApprove"
                @click.stop="$emit('approve', request)"
                class="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                title="Одобрить"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <button
                v-if="(request.status === 'pending' || request.status === 'draft') && canReject"
                @click.stop="$emit('reject', request)"
                class="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                title="Отклонить"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <button
                class="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Подробнее"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import RequestStatusBadge from '../representative/RequestStatusBadge.vue'

const props = defineProps({
  requests: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    default: 0
  },
  showFilters: {
    type: Boolean,
    default: true
  },
  currentFilter: {
    type: String,
    default: 'all'
  },
  statuses: {
    type: Array,
    default: () => [
      { value: 'all', label: 'Все' },
      { value: 'pending', label: 'На рассмотрении' },
      { value: 'approved', label: 'Одобрено' },
      { value: 'rejected', label: 'Отклонено' },
      { value: 'draft', label: 'Черновик' }
    ]
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

defineEmits(['view', 'approve', 'reject', 'filter-change'])

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
