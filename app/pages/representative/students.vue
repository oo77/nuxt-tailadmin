<template>
  <NuxtLayout name="representative">
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Слушатели нашей организации
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Список сотрудников, проходящих или прошедших обучение
          </p>
        </div>

        <!-- Stats -->
        <div v-if="stats" class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Всего слушателей</p>
              <p class="text-lg font-bold text-primary">{{ stats.total }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-5">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск
            </label>
            <div class="relative">
              <input
                v-model="filters.search"
                type="text"
                placeholder="ФИО или ПИНФЛ..."
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
              Статус обучения
            </label>
            <select
              v-model="filters.status"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
              @change="loadStudents"
            >
              <option value="">Все</option>
              <option value="active">Обучаются</option>
              <option value="completed">Завершили</option>
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
              @change="loadStudents"
            >
              <option value="">Все группы</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.code }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p class="text-gray-500 dark:text-gray-400">Загрузка слушателей...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-else-if="students.length === 0" 
        class="flex flex-col items-center justify-center py-16 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark"
      >
        <svg class="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Слушатели не найдены
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          {{ filters.search || filters.status || filters.groupId 
            ? 'Попробуйте изменить параметры фильтрации' 
            : 'В вашей организации пока нет слушателей, прошедших обучение' 
          }}
        </p>
      </div>

      <!-- Students grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="student in students"
          :key="student.id"
          class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start gap-4">
            <!-- Avatar -->
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {{ getInitials(student.fullName) }}
            </div>
            
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                {{ student.fullName }}
              </h3>
              <p v-if="student.position" class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ student.position }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ПИНФЛ: {{ student.pinfl }}
              </p>
            </div>
          </div>

          <!-- Courses/groups info -->
          <div v-if="student.groups && student.groups.length > 0" class="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Обучение:</p>
            <div class="space-y-2">
              <div 
                v-for="group in student.groups.slice(0, 3)" 
                :key="group.id"
                class="flex items-center justify-between text-sm"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span :class="[
                    'h-2 w-2 rounded-full shrink-0',
                    group.isActive ? 'bg-success' : 'bg-gray-400'
                  ]"></span>
                  <span class="truncate text-gray-700 dark:text-gray-300">{{ group.code }}</span>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                  {{ group.isActive ? 'Идёт' : 'Завершён' }}
                </span>
              </div>
              <p v-if="student.groups.length > 3" class="text-xs text-primary">
                +{{ student.groups.length - 3 }} ещё
              </p>
            </div>
          </div>

          <!-- Certificates count -->
          <div v-if="student.certificatesCount" class="mt-4 flex items-center gap-2 text-sm text-success">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span>{{ student.certificatesCount }} сертификатов</span>
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
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const { authFetch } = useAuthFetch()
const { user } = useAuth()

// State
const loading = ref(false)
const students = ref([])
const groups = ref([])
const stats = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)

const filters = reactive({
  search: '',
  status: '',
  groupId: ''
})

// Debounce
let searchTimer = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadStudents()
  }, 300)
}

// Methods
const loadStudents = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '12',
      organizationId: user.value?.organizationId || ''
    })

    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.groupId) params.append('groupId', filters.groupId)

    const response = await authFetch(`/api/students?${params.toString()}`, { method: 'GET' })

    if (response.success) {
      students.value = response.students || []
      totalPages.value = response.totalPages || 1
      stats.value = { total: response.total || 0 }
    }
  } catch (error) {
    console.error('Error loading students:', error)
  } finally {
    loading.value = false
  }
}

const loadGroups = async () => {
  try {
    const response = await authFetch(`/api/groups/select?organizationId=${user.value?.organizationId}`, { method: 'GET' })
    if (response.success) {
      groups.value = response.data || []
    }
  } catch (error) {
    console.error('Error loading groups:', error)
  }
}

const changePage = (page) => {
  currentPage.value = page
  loadStudents()
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

onMounted(() => {
  Promise.all([loadStudents(), loadGroups()])
})
</script>
