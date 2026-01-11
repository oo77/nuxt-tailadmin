<template>
  <UiModal
    :is-open="isOpen"
    title="Отклонение заявки"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Request info -->
      <div class="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger font-semibold">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ request.organization?.name }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ request.group?.code }} • {{ request.employeesCount }} сотрудников
          </p>
        </div>
      </div>

      <!-- Warning -->
      <div class="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
        <svg class="h-5 w-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="text-sm">
          <p class="font-medium text-warning">Внимание</p>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Представитель организации получит уведомление об отклонении заявки с указанной причиной.
          </p>
        </div>
      </div>

      <!-- Reason input -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Причина отклонения <span class="text-danger">*</span>
        </label>
        <textarea
          v-model="reason"
          rows="4"
          placeholder="Укажите причину отклонения заявки..."
          :class="[
            'w-full rounded-lg border py-3 px-4 outline-none transition resize-none',
            error
              ? 'border-danger focus:border-danger'
              : 'border-stroke focus:border-primary dark:border-form-strokedark'
          ]"
          class="bg-transparent dark:bg-form-input"
        ></textarea>
        <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>
        <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Причина будет показана представителю организации
        </p>
      </div>

      <!-- Quick reasons -->
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Быстрый выбор причины:</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="quickReason in quickReasons"
            :key="quickReason"
            type="button"
            @click="reason = quickReason"
            class="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {{ quickReason }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          @click="$emit('close')"
          :disabled="submitting"
          class="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting || !reason.trim()"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-danger text-white font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {{ submitting ? 'Отклонение...' : 'Отклонить заявку' }}
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

const emit = defineEmits(['close', 'submit'])

// State
const reason = ref('')
const error = ref('')
const submitting = ref(false)

const quickReasons = [
  'Недостаточно мест в группе',
  'Неполный пакет документов',
  'Сотрудники уже зачислены в другую группу',
  'Курс не соответствует профилю организации',
  'Дублирующая заявка'
]

// Methods
const handleSubmit = () => {
  error.value = ''

  if (!reason.value.trim()) {
    error.value = 'Укажите причину отклонения'
    return
  }

  if (reason.value.trim().length < 10) {
    error.value = 'Причина должна содержать минимум 10 символов'
    return
  }

  submitting.value = true
  emit('submit', { reason: reason.value.trim() })

  // Reset after short delay (let parent handle the actual submission)
  setTimeout(() => {
    submitting.value = false
  }, 1000)
}
</script>
