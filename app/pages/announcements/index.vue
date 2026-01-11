<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Объявления о наборе
      </h2>
      <UiButton v-if="canCreateAnnouncements" @click="showCreateModal = true" class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Создать объявление
      </UiButton>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего объявлений</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.total }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Опубликовано</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.published }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Черновики</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.draft }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Заявок</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.totalRequests }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Сбросить фильтры
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Поиск -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Название объявления..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="handleFilterChange"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Статус -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Статус
          </label>
          <div class="relative">
            <select
              v-model="filters.status"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option value="">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
              <option value="closed">Закрыто</option>
              <option value="archived">Архив</option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Сортировка -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Сортировка
          </label>
          <div class="relative">
            <select
              v-model="filters.sortBy"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option value="createdAt">По дате создания</option>
              <option value="publishedAt">По дате публикации</option>
              <option value="deadline">По дедлайну</option>
              <option value="title">По названию</option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Список объявлений -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка объявлений...</p>
      </div>

      <div v-else-if="announcements.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <p class="mt-4 text-lg font-medium">Объявления не найдены</p>
        <p class="mt-2">Создайте первое объявление, нажав кнопку "Создать объявление"</p>
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <AnnouncementsAnnouncementCard
          v-for="announcement in announcements"
          :key="announcement.id"
          :announcement="announcement"
          @click="viewAnnouncement(announcement.id)"
          @publish="handlePublish(announcement.id)"
          @close="handleClose(announcement.id)"
          @delete="handleDelete(announcement.id)"
        />
      </div>

      <!-- Пагинация -->
      <div v-if="totalPages > 1" class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Показано <span class="font-medium">{{ ((currentPage - 1) * 10) + 1 }}</span>
            -
            <span class="font-medium">{{ Math.min(currentPage * 10, total) }}</span>
            из
            <span class="font-medium">{{ total }}</span>
            объявлений
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Назад
            </button>
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания объявления -->
    <AnnouncementsAnnouncementFormModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleAnnouncementCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const { canCreateAnnouncements } = usePermissions()
const {
  announcements,
  loading,
  total,
  currentPage,
  totalPages,
  fetchAnnouncements,
  publishAnnouncement,
  closeAnnouncement,
  deleteAnnouncement,
} = useAnnouncements()

// State
const showCreateModal = ref(false)
const stats = ref({
  total: 0,
  published: 0,
  draft: 0,
  totalRequests: 0,
})
const filters = ref({
  search: '',
  status: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
})

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || filters.value.status !== ''
})

// Methods
const loadAnnouncements = async () => {
  const params = {
    search: filters.value.search || undefined,
    status: filters.value.status || undefined,
    sortBy: filters.value.sortBy,
    sortOrder: filters.value.sortOrder,
    page: currentPage.value,
    limit: 10,
  }

  await fetchAnnouncements(params)
  updateStats()
}

const updateStats = () => {
  // Подсчитываем статистику из загруженных объявлений
  stats.value.total = total.value
  stats.value.published = announcements.value.filter(a => a.status === 'published').length
  stats.value.draft = announcements.value.filter(a => a.status === 'draft').length
  stats.value.totalRequests = announcements.value.reduce((sum, a) => sum + (a.stats?.totalRequests || 0), 0)
}

const handleFilterChange = () => {
  loadAnnouncements()
}

const resetFilters = () => {
  filters.value.search = ''
  filters.value.status = ''
  filters.value.sortBy = 'createdAt'
  filters.value.sortOrder = 'desc'
  loadAnnouncements()
}

const changePage = (page) => {
  loadAnnouncements()
}

const viewAnnouncement = (id) => {
  router.push(`/announcements/${id}`)
}

const handlePublish = async (id) => {
  try {
    await publishAnnouncement(id)
    await loadAnnouncements()
  } catch (error) {
    console.error('Ошибка при публикации объявления:', error)
  }
}

const handleClose = async (id) => {
  try {
    await closeAnnouncement(id)
    await loadAnnouncements()
  } catch (error) {
    console.error('Ошибка при закрытии объявления:', error)
  }
}

const handleDelete = async (id) => {
  if (confirm('Вы уверены, что хотите удалить это объявление?')) {
    try {
      await deleteAnnouncement(id)
      await loadAnnouncements()
    } catch (error) {
      console.error('Ошибка при удалении объявления:', error)
    }
  }
}

const handleAnnouncementCreated = () => {
  showCreateModal.value = false
  loadAnnouncements()
}

// Initialize
onMounted(() => {
  loadAnnouncements()
})
</script>
