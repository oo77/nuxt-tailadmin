<template>
  <UiModal
    :is-open="isOpen"
    title="Загрузка PDF-файла заявки"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Info banner -->
      <div class="flex items-start gap-3 p-4 rounded-lg bg-info/10 border border-info/20">
        <svg class="h-5 w-5 text-info shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-sm">
          <p class="font-medium text-info">Требования к файлу:</p>
          <ul class="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
            <li>• Формат: PDF</li>
            <li>• Максимальный размер: 10 МБ</li>
            <li>• Должен содержать подпись руководства организации</li>
          </ul>
        </div>
      </div>

      <!-- Upload area -->
      <div
        ref="dropZone"
        :class="[
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-stroke dark:border-strokedark hover:border-primary/50'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept="application/pdf"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          @change="handleFileSelect"
        />

        <div v-if="!selectedFile">
          <div class="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <p class="text-gray-900 dark:text-white font-medium mb-1">
            Перетащите PDF-файл сюда
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            или <span class="text-primary">нажмите для выбора</span>
          </p>
        </div>

        <div v-else class="flex items-center justify-center gap-4">
          <div class="h-12 w-12 rounded-lg bg-danger/10 flex items-center justify-center">
            <svg class="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="text-left">
            <p class="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
              {{ selectedFile.name }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatFileSize(selectedFile.size) }}
            </p>
          </div>
          <button
            @click.stop="clearFile"
            class="p-2 text-gray-400 hover:text-danger transition-colors"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-danger/10 text-danger text-sm">
        <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Upload progress -->
      <div v-if="uploading" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Загрузка...</span>
          <span class="font-medium text-primary">{{ uploadProgress }}%</span>
        </div>
        <div class="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-300 rounded-full"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          @click="$emit('close')"
          :disabled="uploading"
          class="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          @click="uploadFile"
          :disabled="!selectedFile || uploading"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="uploading" class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {{ uploading ? 'Загрузка...' : 'Загрузить' }}
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'uploaded'])

const { authFetch } = useAuthFetch()

// State
const fileInput = ref(null)
const selectedFile = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref(null)

// Methods
const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file) => {
  error.value = null

  // Check file type
  if (file.type !== 'application/pdf') {
    error.value = 'Только PDF-файлы разрешены'
    return
  }

  // Check file size (10 MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Файл слишком большой. Максимум 10 МБ'
    return
  }

  selectedFile.value = file
}

const clearFile = () => {
  selectedFile.value = null
  error.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Б'
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  uploadProgress.value = 0
  error.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    const response = await authFetch(`/api/training-requests/${props.request.id}/pdf`, {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success) {
      setTimeout(() => {
        emit('uploaded')
      }, 500)
    } else {
      error.value = response.message || 'Ошибка при загрузке файла'
    }
  } catch (err) {
    console.error('Error uploading file:', err)
    error.value = err.data?.message || 'Ошибка при загрузке файла'
  } finally {
    uploading.value = false
  }
}
</script>
