<template>
  <NuxtLayout name="representative">
    <div class="space-y-6">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm">
        <NuxtLink 
          to="/representative" 
          class="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          Анонсы
        </NuxtLink>
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-gray-900 dark:text-white font-medium">Подача заявки</span>
      </nav>

      <!-- Loading state -->
      <div v-if="loadingGroup" class="flex justify-center py-12">
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p class="text-gray-500 dark:text-gray-400">Загрузка информации о группе...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-12">
        <svg class="mx-auto h-16 w-16 text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ error }}</h3>
        <NuxtLink 
          to="/representative" 
          class="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться к списку групп
        </NuxtLink>
      </div>

      <!-- Main form -->
      <div v-else-if="group" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Group info sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-24 space-y-4">
            <!-- Group card -->
            <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark overflow-hidden">
              <div class="h-2 bg-primary"></div>
              <div class="p-5">
                <div class="flex items-center gap-2 mb-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {{ group.code }}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {{ group.courseName }}
                </h3>

                <div class="space-y-3 text-sm">
                  <div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}</span>
                  </div>

                  <div v-if="group.classroom" class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{{ group.classroom }}</span>
                  </div>

                  <div v-if="group.requestDeadline" class="flex items-center gap-3" :class="isDeadlineSoon ? 'text-danger' : 'text-gray-600 dark:text-gray-400'">
                    <svg class="h-5 w-5" :class="isDeadlineSoon ? 'text-danger' : 'text-primary'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Приём до: {{ formatDate(group.requestDeadline) }}</span>
                  </div>
                </div>

                <!-- Capacity -->
                <div class="mt-5 pt-5 border-t border-stroke dark:border-strokedark">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Свободных мест</span>
                    <span class="text-2xl font-bold" :class="availableSlotsColor">
                      {{ group.availableSlots }}
                    </span>
                  </div>
                  <div class="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-500 rounded-full"
                      :class="capacityBarColor"
                      :style="{ width: `${capacityPercentage}%` }"
                    />
                  </div>
                  <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    {{ group.maxCapacity - group.availableSlots }} из {{ group.maxCapacity }} мест занято
                  </p>
                </div>
              </div>
            </div>

            <!-- Info box -->
            <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <div class="flex gap-3">
                <svg class="h-5 w-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  <p class="font-medium mb-1">Как это работает:</p>
                  <ol class="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400">
                    <li>Выберите сотрудников для обучения</li>
                    <li>Отправьте заявку на рассмотрение</li>
                    <li>После одобрения загрузите PDF с подписью</li>
                    <li>Сотрудники будут зачислены в группу</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form section -->
        <div class="lg:col-span-2">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Employee selection -->
            <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
              <div class="flex items-center gap-3 mb-6">
                <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Выбор сотрудников</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Выберите сотрудников для обучения (максимум {{ group.availableSlots }})
                  </p>
                </div>
              </div>

              <RepresentativeEmployeeMultiSelect
                v-model="selectedEmployees"
                :organization-id="organizationId"
                :group-id="groupId"
                :max-selection="group.availableSlots"
              />

              <!-- Validation error -->
              <p v-if="errors.employees" class="mt-2 text-sm text-danger">
                {{ errors.employees }}
              </p>
            </div>

            <!-- Notes -->
            <div class="rounded-xl bg-white dark:bg-boxdark shadow-sm border border-stroke dark:border-strokedark p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Дополнительная информация</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Примечания к заявке (необязательно)
                  </p>
                </div>
              </div>

              <textarea
                v-model="notes"
                rows="4"
                placeholder="Любая дополнительная информация о сотрудниках или заявке..."
                class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input resize-none"
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-stroke dark:border-strokedark">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span v-if="selectedEmployees.length === 0">
                  Выберите хотя бы одного сотрудника
                </span>
                <span v-else>
                  Выбрано сотрудников: <strong class="text-primary">{{ selectedEmployees.length }}</strong>
                </span>
              </div>

              <div class="flex items-center gap-3">
                <NuxtLink
                  to="/representative"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Отмена
                </NuxtLink>

                <button
                  type="submit"
                  :disabled="submitting || selectedEmployees.length === 0"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                  <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {{ submitting ? 'Отправка...' : 'Отправить заявку' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const notification = useNotification()
const { authFetch } = useAuthFetch()
const { user } = useAuth()

const groupId = route.params.groupId

// State
const loadingGroup = ref(true)
const submitting = ref(false)
const group = ref(null)
const error = ref(null)
const selectedEmployees = ref([])
const notes = ref('')
const errors = ref({})

// Computed
const organizationId = computed(() => user.value?.organizationId || '')

const capacityPercentage = computed(() => {
  if (!group.value?.maxCapacity) return 0
  const used = group.value.maxCapacity - group.value.availableSlots
  return Math.min(100, (used / group.value.maxCapacity) * 100)
})

const capacityBarColor = computed(() => {
  const pct = capacityPercentage.value
  if (pct >= 90) return 'bg-danger'
  if (pct >= 70) return 'bg-warning'
  return 'bg-success'
})

const availableSlotsColor = computed(() => {
  const slots = group.value?.availableSlots || 0
  if (slots === 0) return 'text-gray-400'
  if (slots <= 3) return 'text-danger'
  if (slots <= 5) return 'text-warning'
  return 'text-success'
})

const isDeadlineSoon = computed(() => {
  if (!group.value?.requestDeadline) return false
  const now = new Date()
  const deadline = new Date(group.value.requestDeadline)
  const diff = deadline.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days <= 3 && days >= 0
})

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

const loadGroup = async () => {
  loadingGroup.value = true
  error.value = null

  try {
    const response = await authFetch(`/api/groups/${groupId}`, { method: 'GET' })
    
    if (response.success && response.group) {
      group.value = response.group
      
      // Validate group accepts requests
      if (!group.value.acceptsRequests) {
        error.value = 'Эта группа не принимает заявки'
      } else if (group.value.availableSlots === 0) {
        error.value = 'В этой группе нет свободных мест'
      } else if (group.value.announcementStatus !== 'announced') {
        error.value = 'Эта группа недоступна для заявок'
      }
    } else {
      error.value = 'Группа не найдена'
    }
  } catch (err) {
    console.error('Error loading group:', err)
    error.value = 'Ошибка при загрузке информации о группе'
  } finally {
    loadingGroup.value = false
  }
}

const validate = () => {
  errors.value = {}

  if (selectedEmployees.value.length === 0) {
    errors.value.employees = 'Выберите хотя бы одного сотрудника'
    return false
  }

  if (selectedEmployees.value.length > group.value.availableSlots) {
    errors.value.employees = `Максимум ${group.value.availableSlots} сотрудников`
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    const response = await authFetch('/api/training-requests', {
      method: 'POST',
      body: {
        groupId: groupId,
        studentIds: selectedEmployees.value,
        representativeNotes: notes.value || undefined
      }
    })

    if (response.success) {
      notification.success('Заявка успешно отправлена!')
      router.push('/representative/requests')
    } else {
      notification.error(response.message || 'Ошибка при отправке заявки')
    }
  } catch (err) {
    console.error('Error submitting request:', err)
    notification.error(err.data?.message || 'Ошибка при отправке заявки')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadGroup()
})
</script>
