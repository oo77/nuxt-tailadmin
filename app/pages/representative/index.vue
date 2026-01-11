<template>
  <NuxtLayout name="representative">
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Анонсы учебных групп
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Выберите группу для подачи заявки на обучение сотрудников
          </p>
        </div>

        <!-- Stats summary -->
        <div v-if="stats" class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Доступно групп</p>
              <p class="text-lg font-bold text-primary">{{ stats.available }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-5">
        <div class="flex items-center gap-3 mb-4">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Фильтры</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Поиск по группам</p>
          </div>
        </div>

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
                placeholder="Название курса..."
                class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-10 pr-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                @input="debouncedSearch"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Date filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Дата начала
            </label>
            <select
              v-model="filters.startPeriod"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
              @change="loadGroups"
            >
              <option value="">Любая дата</option>
              <option value="week">Ближайшая неделя</option>
              <option value="month">Ближайший месяц</option>
              <option value="quarter">Ближайший квартал</option>
            </select>
          </div>

          <!-- Available slots filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Наличие мест
            </label>
            <select
              v-model="filters.hasAvailableSlots"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
              @change="loadGroups"
            >
              <option value="">Все группы</option>
              <option value="true">Только с местами</option>
            </select>
          </div>

          <!-- Accepts requests filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Приём заявок
            </label>
            <select
              v-model="filters.acceptsRequests"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
              @change="loadGroups"
            >
              <option value="">Все</option>
              <option value="true">Принимают заявки</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p class="text-gray-500 dark:text-gray-400">Загрузка групп...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-else-if="groups.length === 0" 
        class="flex flex-col items-center justify-center py-16 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark"
      >
        <svg class="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Нет доступных групп
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          В данный момент нет анонсированных учебных групп для вашей организации. 
          Проверьте позже или свяжитесь с администратором.
        </p>
      </div>

      <!-- Groups grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RepresentativeAnnouncedGroupCard
          v-for="group in groups"
          :key="group.id"
          :group="group"
          @apply="handleApply"
          @details="handleDetails"
        />
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

      <!-- Group Details Modal -->
      <RepresentativeGroupDetailModal
        v-if="selectedGroup"
        :group="selectedGroup"
        :is-open="showDetailModal"
        @close="closeDetailModal"
        @apply="handleApply"
      />
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const router = useRouter()
const { authFetch } = useAuthFetch()

// State
const loading = ref(false)
const groups = ref([])
const stats = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const limit = 10

const filters = reactive({
  search: '',
  startPeriod: '',
  hasAvailableSlots: 'true',
  acceptsRequests: 'true'
})

const selectedGroup = ref(null)
const showDetailModal = ref(false)

// Debounce search
let searchTimer = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadGroups()
  }, 300)
}

// Load groups
const loadGroups = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.toString()
    })

    if (filters.search) params.append('search', filters.search)
    if (filters.startPeriod) params.append('startPeriod', filters.startPeriod)
    if (filters.hasAvailableSlots) params.append('hasAvailableSlots', filters.hasAvailableSlots)
    if (filters.acceptsRequests) params.append('acceptsRequests', filters.acceptsRequests)

    const response = await authFetch(`/api/groups/announced?${params.toString()}`, { method: 'GET' })

    if (response.success) {
      groups.value = response.data || []
      totalPages.value = response.totalPages || 1
      stats.value = { available: response.total || 0 }
    }
  } catch (error) {
    console.error('Error loading groups:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  currentPage.value = page
  loadGroups()
}

const handleApply = (group) => {
  router.push(`/representative/apply/${group.id}`)
}

const handleDetails = (group) => {
  selectedGroup.value = group
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedGroup.value = null
}

onMounted(() => {
  loadGroups()
})
</script>
