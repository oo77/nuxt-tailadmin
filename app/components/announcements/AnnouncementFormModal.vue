<template>
  <UiModal 
    :is-open="isOpen" 
    :title="isEdit ? 'Редактировать объявление' : 'Создать объявление'" 
    size="lg" 
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Заголовок -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Заголовок <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          placeholder="Например: Набор на обучение по программе АПАК"
          :class="[
            'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition',
            errors.title
              ? 'border-danger focus:border-danger'
              : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
          ]"
        />
        <p v-if="errors.title" class="mt-1 text-sm text-danger">{{ errors.title }}</p>
      </div>

      <!-- Описание -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Описание
        </label>
        <textarea
          v-model="form.description"
          rows="4"
          placeholder="Подробная информация об объявлении..."
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"
        ></textarea>
      </div>

      <!-- Тип объявления -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Тип объявления <span class="text-danger">*</span>
        </label>
        <div class="relative">
          <select
            v-model="form.announcementType"
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition appearance-none',
              errors.announcementType
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
            ]"
          >
            <option value="">Выберите тип...</option>
            <option value="single_group">Одна группа</option>
            <option value="multiple_groups">Несколько групп</option>
            <option value="program">Программа обучения</option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p v-if="errors.announcementType" class="mt-1 text-sm text-danger">{{ errors.announcementType }}</p>
      </div>

      <!-- Выбор групп -->
      <div v-if="form.announcementType">
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Учебные группы <span class="text-danger">*</span>
        </label>
        
        <!-- Список выбранных групп -->
        <div v-if="selectedGroups.length > 0" class="mb-3 space-y-2">
          <div
            v-for="group in selectedGroups"
            :key="group.id"
            class="flex items-center justify-between p-3 rounded-lg border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                  {{ group.code }}
                </span>
                <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ group.courseName }}
                </span>
              </div>
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}
              </div>
            </div>
            <button
              type="button"
              @click="removeGroup(group.id)"
              class="ml-3 text-danger hover:text-danger/80 transition-colors"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Селектор для добавления групп -->
        <div class="relative">
          <select
            v-model="selectedGroupId"
            @change="addGroup"
            class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary appearance-none"
          >
            <option value="">Добавить группу...</option>
            <option
              v-for="group in availableGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.code }} - {{ group.courseName }} ({{ formatDate(group.startDate) }})
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p v-if="errors.groupIds" class="mt-1 text-sm text-danger">{{ errors.groupIds }}</p>
      </div>

      <!-- Настройки приёма заявок -->
      <div class="p-4 rounded-lg border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800 space-y-4">
        <h4 class="text-sm font-semibold text-black dark:text-white">Настройки приёма заявок</h4>
        
        <!-- Принимать заявки -->
        <div class="flex items-center gap-3">
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              v-model="form.acceptsRequests"
              type="checkbox"
              class="peer sr-only"
            />
            <div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"></div>
          </label>
          <span class="text-sm font-medium text-black dark:text-white">
            Принимать заявки
          </span>
        </div>

        <!-- Срок подачи заявок -->
        <div v-if="form.acceptsRequests">
          <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Срок подачи заявок
          </label>
          <input
            v-model="form.requestDeadline"
            type="date"
            class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
          />
        </div>

        <!-- Показывать представителям -->
        <div class="flex items-center gap-3">
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              v-model="form.isVisibleToRepresentatives"
              type="checkbox"
              class="peer sr-only"
            />
            <div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"></div>
          </label>
          <span class="text-sm font-medium text-black dark:text-white">
            Показывать представителям организаций
          </span>
        </div>

        <!-- Показывать статус мест -->
        <div class="flex items-center gap-3">
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              v-model="form.showCapacityStatus"
              type="checkbox"
              class="peer sr-only"
            />
            <div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"></div>
          </label>
          <span class="text-sm font-medium text-black dark:text-white">
            Показывать статус заполненности мест
          </span>
        </div>
      </div>

      <!-- Дополнительная информация -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Дополнительная информация
        </label>
        <textarea
          v-model="form.additionalInfo"
          rows="3"
          placeholder="Требования, условия, контакты и т.д..."
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"
        ></textarea>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-between items-center">
        <div v-if="!isEdit" class="text-sm text-gray-500 dark:text-gray-400">
          Объявление будет создано в статусе "Черновик"
        </div>
        <div v-else class="flex-1"></div>
        <div class="flex gap-3">
          <UiButton variant="outline" @click="$emit('close')">
            Отмена
          </UiButton>
          <UiButton
            :loading="loading"
            @click="handleSubmit"
          >
            {{ isEdit ? 'Сохранить' : 'Создать объявление' }}
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  announcement: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const { authFetch } = useAuthFetch()
const toast = useNotification()

// State
const loading = ref(false)
const allGroups = ref([])
const selectedGroupId = ref('')
const form = ref({
  title: '',
  description: '',
  announcementType: '',
  groupIds: [],
  acceptsRequests: true,
  requestDeadline: '',
  isVisibleToRepresentatives: true,
  showCapacityStatus: true,
  additionalInfo: ''
})
const errors = ref({})

// Computed
const isEdit = computed(() => !!props.announcement)

const selectedGroups = computed(() => {
  return allGroups.value.filter(g => form.value.groupIds.includes(g.id))
})

const availableGroups = computed(() => {
  return allGroups.value.filter(g => !form.value.groupIds.includes(g.id))
})

// Methods
const loadGroups = async () => {
  try {
    const response = await authFetch('/api/groups', {
      params: { limit: 1000, isActive: true }
    })

    if (response.success && response.groups) {
      allGroups.value = response.groups
    }
  } catch (error) {
    console.error('Error loading groups:', error)
  }
}

const addGroup = () => {
  if (selectedGroupId.value && !form.value.groupIds.includes(selectedGroupId.value)) {
    form.value.groupIds.push(selectedGroupId.value)
    selectedGroupId.value = ''
  }
}

const removeGroup = (groupId) => {
  form.value.groupIds = form.value.groupIds.filter(id => id !== groupId)
}

const validateForm = () => {
  errors.value = {}

  if (!form.value.title.trim()) {
    errors.value.title = 'Заголовок обязателен'
  }

  if (!form.value.announcementType) {
    errors.value.announcementType = 'Выберите тип объявления'
  }

  if (form.value.groupIds.length === 0) {
    errors.value.groupIds = 'Выберите хотя бы одну группу'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (loading.value) return
  
  if (!validateForm()) return

  loading.value = true
  try {
    if (isEdit.value && props.announcement) {
      // Обновление
      const response = await authFetch(
        `/api/announcements/${props.announcement.id}`,
        {
          method: 'PUT',
          body: form.value
        }
      )

      if (response.success && response.announcement) {
        toast.success('Объявление успешно обновлено')
        emit('updated', response.announcement)
        emit('close')
      } else {
        handleErrors(response)
      }
    } else {
      // Создание
      const response = await authFetch(
        '/api/announcements',
        {
          method: 'POST',
          body: form.value
        }
      )

      if (response.success && response.announcement) {
        toast.success('Объявление успешно создано')
        emit('created', response.announcement)
        emit('close')
      } else {
        handleErrors(response)
      }
    }
  } catch (error) {
    toast.error('Произошла ошибка при сохранении')
  } finally {
    loading.value = false
  }
}

const handleErrors = (response) => {
  if (response.errors && Array.isArray(response.errors)) {
    for (const err of response.errors) {
      if (err.field) {
        errors.value[err.field] = err.message
      }
    }
    toast.error(response.message || 'Проверьте введённые данные')
  } else {
    toast.error(response.message || 'Ошибка при сохранении')
  }
}

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    announcementType: '',
    groupIds: [],
    acceptsRequests: true,
    requestDeadline: '',
    isVisibleToRepresentatives: true,
    showCapacityStatus: true,
    additionalInfo: ''
  }
  errors.value = {}
}

const fillFormFromAnnouncement = (announcement) => {
  form.value = {
    title: announcement.title,
    description: announcement.description || '',
    announcementType: announcement.announcementType,
    groupIds: announcement.groupIds || [],
    acceptsRequests: Boolean(announcement.acceptsRequests),
    requestDeadline: announcement.requestDeadline ? formatDateForInput(announcement.requestDeadline) : '',
    isVisibleToRepresentatives: Boolean(announcement.isVisibleToRepresentatives),
    showCapacityStatus: Boolean(announcement.showCapacityStatus),
    additionalInfo: announcement.additionalInfo || ''
  }
}

const formatDateForInput = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Watch for modal open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadGroups()
    if (props.announcement) {
      fillFormFromAnnouncement(props.announcement)
    } else {
      resetForm()
    }
  }
})

// Watch for announcement changes (edit mode)
watch(() => props.announcement, (announcement) => {
  if (announcement && props.isOpen) {
    fillFormFromAnnouncement(announcement)
  }
})
</script>
