<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Тип заявки -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Тип заявки <span class="text-danger">*</span>
      </label>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          @click="formData.requestType = 'with_employees'"
          :class="[
            'p-4 rounded-lg border-2 transition-all',
            formData.requestType === 'with_employees'
              ? 'border-primary bg-primary/5'
              : 'border-stroke dark:border-strokedark hover:border-primary/50'
          ]"
        >
          <div class="flex items-center gap-3">
            <div :class="[
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              formData.requestType === 'with_employees' ? 'border-primary' : 'border-gray-300'
            ]">
              <div v-if="formData.requestType === 'with_employees'" class="w-3 h-3 rounded-full bg-primary"></div>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900 dark:text-white">С сотрудниками</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Указать конкретных сотрудников</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          @click="formData.requestType = 'reservation'"
          :class="[
            'p-4 rounded-lg border-2 transition-all',
            formData.requestType === 'reservation'
              ? 'border-primary bg-primary/5'
              : 'border-stroke dark:border-strokedark hover:border-primary/50'
          ]"
        >
          <div class="flex items-center gap-3">
            <div :class="[
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              formData.requestType === 'reservation' ? 'border-primary' : 'border-gray-300'
            ]">
              <div v-if="formData.requestType === 'reservation'" class="w-3 h-3 rounded-full bg-primary"></div>
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900 dark:text-white">Резервирование</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Забронировать места</p>
            </div>
          </div>
        </button>
      </div>
      <p v-if="errors.requestType" class="mt-1 text-sm text-danger">{{ errors.requestType }}</p>
    </div>

    <!-- Выбор групп -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Учебные группы <span class="text-danger">*</span>
      </label>
      <RepresentativeGroupSelector
        :announcement="announcement"
        :selected-groups="formData.groups"
        @update:selected-groups="formData.groups = $event"
      />
      <p v-if="errors.groups" class="mt-1 text-sm text-danger">{{ errors.groups }}</p>
    </div>

    <!-- Сотрудники (если тип "с сотрудниками") -->
    <div v-if="formData.requestType === 'with_employees'">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Сотрудники <span class="text-danger">*</span>
      </label>
      <RepresentativeEmployeeMultiSelect
        :organization-id="organizationId"
        :selected-employees="formData.employees"
        @update:selected-employees="formData.employees = $event"
      />
      <p v-if="errors.employees" class="mt-1 text-sm text-danger">{{ errors.employees }}</p>
    </div>

    <!-- Комментарий -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Комментарий
      </label>
      <textarea
        v-model="formData.comment"
        rows="4"
        class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        placeholder="Дополнительная информация к заявке..."
      ></textarea>
    </div>

    <!-- PDF файл -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Приложить документ (PDF)
      </label>
      <div class="flex items-center gap-3">
        <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          @change="handleFileChange"
          class="hidden"
        />
        <button
          type="button"
          @click="$refs.fileInput.click()"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Выбрать файл
        </button>
        <span v-if="formData.pdfFile" class="text-sm text-gray-600 dark:text-gray-400">
          {{ formData.pdfFile.name }}
        </span>
        <button
          v-if="formData.pdfFile"
          type="button"
          @click="formData.pdfFile = null"
          class="text-danger hover:text-danger/80"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Максимальный размер файла: 10 МБ
      </p>
      <p v-if="errors.pdfFile" class="mt-1 text-sm text-danger">{{ errors.pdfFile }}</p>
    </div>

    <!-- Кнопки -->
    <div class="flex items-center justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
      <UiButton
        type="button"
        variant="outline"
        @click="$emit('cancel')"
        :disabled="loading"
      >
        Отмена
      </UiButton>
      <UiButton
        type="submit"
        variant="primary"
        :disabled="loading"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ loading ? 'Отправка...' : 'Подать заявку' }}
      </UiButton>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  announcement: {
    type: Object,
    required: true
  },
  organizationId: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const fileInput = ref(null)

const formData = reactive({
  requestType: 'with_employees',
  groups: [],
  employees: [],
  comment: '',
  pdfFile: null
})

const errors = reactive({
  requestType: '',
  groups: '',
  employees: '',
  pdfFile: ''
})

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Проверка типа файла
  if (file.type !== 'application/pdf') {
    errors.pdfFile = 'Можно загружать только PDF файлы'
    return
  }

  // Проверка размера (10 МБ)
  if (file.size > 10 * 1024 * 1024) {
    errors.pdfFile = 'Размер файла не должен превышать 10 МБ'
    return
  }

  errors.pdfFile = ''
  formData.pdfFile = file
}

const validateForm = () => {
  let isValid = true

  // Сброс ошибок
  Object.keys(errors).forEach(key => errors[key] = '')

  // Проверка типа заявки
  if (!formData.requestType) {
    errors.requestType = 'Выберите тип заявки'
    isValid = false
  }

  // Проверка групп
  if (formData.groups.length === 0) {
    errors.groups = 'Выберите хотя бы одну группу'
    isValid = false
  }

  // Проверка сотрудников для типа "с сотрудниками"
  if (formData.requestType === 'with_employees' && formData.employees.length === 0) {
    errors.employees = 'Выберите хотя бы одного сотрудника'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) return

  const submitData = {
    requestType: formData.requestType,
    groups: formData.groups.map(group => ({
      groupId: group.groupId,
      requestedSlots: group.requestedSlots,
      employeeIds: formData.requestType === 'with_employees' ? group.employeeIds : []
    })),
    comment: formData.comment || undefined,
    pdfFile: formData.pdfFile || undefined
  }

  emit('submit', submitData)
}
</script>
