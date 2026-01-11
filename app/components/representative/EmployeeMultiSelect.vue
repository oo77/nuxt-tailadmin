<template>
  <div class="space-y-4">
    <!-- Search and controls -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search input -->
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 pr-12 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          @input="debouncedSearch"
        />
        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div v-if="loading" class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Selected count & clear button -->
      <div class="flex items-center gap-3">
        <span v-if="modelValue.length > 0" class="text-sm text-gray-600 dark:text-gray-400">
          Выбрано: <strong class="text-primary">{{ modelValue.length }}</strong>
          <span v-if="maxSelection" class="text-gray-400"> / {{ maxSelection }}</span>
        </span>
        <button
          v-if="modelValue.length > 0"
          @click="clearSelection"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Очистить
        </button>
      </div>
    </div>

    <!-- Capacity warning -->
    <div 
      v-if="maxSelection && modelValue.length >= maxSelection" 
      class="flex items-center gap-2 px-4 py-3 rounded-lg bg-warning/10 text-warning text-sm"
    >
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>Достигнут лимит доступных мест в группе</span>
    </div>

    <!-- Search results dropdown -->
    <div
      v-if="searchResults.length > 0 && searchQuery.length >= 2"
      class="max-h-72 overflow-y-auto rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-lg"
    >
      <div class="p-2 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
        Найдено: {{ searchResults.length }} сотрудников
      </div>
      <button
        v-for="student in searchResults"
        :key="student.id"
        type="button"
        :disabled="isSelected(student.id) || isAlreadyInGroup(student.id) || (maxSelection && modelValue.length >= maxSelection && !isSelected(student.id))"
        @click="toggleStudent(student)"
        :class="[
          'w-full px-4 py-3 text-left transition-colors flex items-center gap-3 border-b border-stroke dark:border-strokedark last:border-b-0',
          isSelected(student.id)
            ? 'bg-primary/5 dark:bg-primary/10'
            : isAlreadyInGroup(student.id)
              ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <!-- Avatar -->
        <div 
          :class="[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-sm',
            isSelected(student.id)
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          ]"
        >
          {{ getInitials(student.fullName) }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ student.fullName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ student.position || 'Должность не указана' }}
            <span v-if="student.pinfl" class="text-gray-400"> • {{ student.pinfl }}</span>
          </p>
        </div>

        <!-- Status icons -->
        <div class="shrink-0">
          <span 
            v-if="isSelected(student.id)" 
            class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span 
            v-else-if="isAlreadyInGroup(student.id)" 
            class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
          >
            В группе
          </span>
          <span 
            v-else-if="maxSelection && modelValue.length >= maxSelection"
            class="text-xs text-gray-400"
          >
            Лимит
          </span>
          <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>
    </div>

    <!-- No results -->
    <div
      v-else-if="searchQuery.length >= 2 && !loading && searchResults.length === 0"
      class="p-6 text-center rounded-lg border border-dashed border-stroke dark:border-strokedark"
    >
      <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Сотрудники не найдены</p>
      <p class="mt-1 text-xs text-gray-400">Попробуйте изменить поисковый запрос</p>
    </div>

    <!-- Selected employees list -->
    <div v-if="modelValue.length > 0" class="space-y-2">
      <label class="block text-sm font-medium text-gray-900 dark:text-white">
        Выбранные сотрудники
      </label>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="studentId in modelValue"
          :key="studentId"
          class="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 transition-all hover:border-primary/30"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success font-semibold text-sm">
              {{ getStudentInitials(studentId) }}
            </div>
            <div class="min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ getStudentName(studentId) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ getStudentInfo(studentId) }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="removeStudent(studentId)"
            class="shrink-0 p-2 text-gray-400 hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state when nothing selected -->
    <div 
      v-else 
      class="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-stroke dark:border-strokedark"
    >
      <svg class="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="text-sm font-medium text-gray-900 dark:text-white">Сотрудники не выбраны</p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
        Начните вводить ФИО или ПИНФЛ для поиска
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  organizationId: { 
    type: String, 
    required: true 
  },
  groupId: { 
    type: String, 
    default: null 
  },
  maxSelection: { 
    type: Number, 
    default: null 
  },
  modelValue: { 
    type: Array, 
    default: () => [] 
  },
  searchPlaceholder: {
    type: String,
    default: 'Поиск сотрудников по ФИО или ПИНФЛ...'
  }
})

const emit = defineEmits(['update:modelValue'])

const { authFetch } = useAuthFetch()

// State
const searchQuery = ref('')
const searchResults = ref([])
const studentsCache = ref(new Map())
const alreadyInGroupIds = ref([])
const loading = ref(false)
let searchTimeout = null

// Methods
const searchStudents = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  loading.value = true
  try {
    const params = new URLSearchParams({
      search: searchQuery.value,
      organizationId: props.organizationId,
      limit: '30'
    })

    const response = await authFetch(`/api/students?${params.toString()}`, { method: 'GET' })
    
    if (response.success && response.students) {
      searchResults.value = response.students
      // Cache students
      for (const student of response.students) {
        studentsCache.value.set(student.id, student)
      }
    }
  } catch (error) {
    console.error('Error searching students:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchStudents()
  }, 300)
}

const loadAlreadyInGroup = async () => {
  if (!props.groupId) return
  
  try {
    const response = await authFetch(`/api/groups/${props.groupId}/students`, { method: 'GET' })
    if (response.success && response.students) {
      alreadyInGroupIds.value = response.students.map(s => s.id)
    }
  } catch (error) {
    console.error('Error loading group students:', error)
  }
}

const toggleStudent = (student) => {
  if (isSelected(student.id)) {
    removeStudent(student.id)
  } else {
    addStudent(student)
  }
}

const addStudent = (student) => {
  if (isSelected(student.id) || isAlreadyInGroup(student.id)) return
  if (props.maxSelection && props.modelValue.length >= props.maxSelection) return
  
  studentsCache.value.set(student.id, student)
  emit('update:modelValue', [...props.modelValue, student.id])
}

const removeStudent = (studentId) => {
  const newValue = props.modelValue.filter(id => id !== studentId)
  emit('update:modelValue', newValue)
}

const clearSelection = () => {
  emit('update:modelValue', [])
}

const isSelected = (id) => props.modelValue.includes(id)
const isAlreadyInGroup = (id) => alreadyInGroupIds.value.includes(id)

const getStudentName = (id) => {
  const student = studentsCache.value.get(id)
  return student?.fullName || 'Загрузка...'
}

const getStudentInfo = (id) => {
  const student = studentsCache.value.get(id)
  if (!student) return ''
  const parts = []
  if (student.position) parts.push(student.position)
  if (student.pinfl) parts.push(student.pinfl)
  return parts.join(' • ')
}

const getStudentInitials = (id) => {
  const name = getStudentName(id)
  return getInitials(name)
}

const getInitials = (name) => {
  if (!name || name === 'Загрузка...') return '...'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Load cached students on mount
const loadSelectedStudents = async () => {
  for (const studentId of props.modelValue) {
    if (!studentsCache.value.has(studentId)) {
      try {
        const response = await authFetch(`/api/students/${studentId}`)
        if (response.success && response.student) {
          studentsCache.value.set(studentId, response.student)
        }
      } catch (error) {
        console.error(`Error loading student ${studentId}:`, error)
      }
    }
  }
}

// Watch for changes
watch(() => props.groupId, () => {
  loadAlreadyInGroup()
}, { immediate: true })

watch(() => props.modelValue, () => {
  loadSelectedStudents()
}, { immediate: true })
</script>
