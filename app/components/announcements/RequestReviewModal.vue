<template>
  <UiModal
    :is-open="isOpen"
    :title="action === 'approve' ? 'Одобрить заявку' : 'Отклонить заявку'"
    size="md"
    @close="$emit('close')"
  >
    <div v-if="request" class="space-y-6">
      <!-- Request summary -->
      <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
            {{ getInitials(request.organizationName || '') }}
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">{{ request.organizationName }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ request.representativeName }}</p>
          </div>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>Объявление: {{ request.announcementTitle }}</p>
          <p v-if="request.requestType === 'with_employees'">
            Сотрудников: {{ request.employees?.length || 0 }}
          </p>
          <p v-else>
            Запрошено мест: {{ request.totalRequestedSlots || 0 }}
          </p>
        </div>
      </div>

      <!-- Approval form -->
      <div v-if="action === 'approve'">
        <!-- Slots approval (for reservation type) -->
        <div v-if="request.requestType === 'reservation'" class="space-y-4">
          <div>
            <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
              Одобрить мест <span class="text-danger">*</span>
            </label>
            <input
              v-model.number="form.approvedSlots"
              type="number"
              min="1"
              :max="request.totalRequestedSlots"
              placeholder="Количество мест"
              :class="[
                'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition',
                errors.approvedSlots
                  ? 'border-danger focus:border-danger'
                  : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
              ]"
            />
            <p v-if="errors.approvedSlots" class="mt-1 text-sm text-danger">{{ errors.approvedSlots }}</p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Запрошено: {{ request.totalRequestedSlots }}
            </p>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Комментарий
          </label>
          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="Дополнительная информация (необязательно)..."
            class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"
          ></textarea>
        </div>

        <!-- Confirmation -->
        <div class="p-4 rounded-lg bg-success/10 border border-success/20">
          <div class="flex items-start gap-3">
            <svg class="h-5 w-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-sm text-success">
              <p class="font-medium mb-1">Подтверждение одобрения</p>
              <p>
                После одобрения заявка будет переведена в статус "Одобрено"
                <span v-if="request.requestType === 'with_employees'">
                  и сотрудники будут зачислены в выбранные группы
                </span>
                <span v-else>
                  и места будут зарезервированы
                </span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rejection form -->
      <div v-else>
        <div>
          <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Причина отклонения <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="form.rejectionReason"
            rows="4"
            placeholder="Укажите причину отклонения заявки..."
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition resize-none',
              errors.rejectionReason
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
            ]"
          ></textarea>
          <p v-if="errors.rejectionReason" class="mt-1 text-sm text-danger">{{ errors.rejectionReason }}</p>
        </div>

        <!-- Warning -->
        <div class="p-4 rounded-lg bg-danger/10 border border-danger/20">
          <div class="flex items-start gap-3">
            <svg class="h-5 w-5 text-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="text-sm text-danger">
              <p class="font-medium mb-1">Внимание</p>
              <p>
                После отклонения заявка будет переведена в статус "Отклонено" и представитель получит уведомление с указанной причиной.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton
          :variant="action === 'approve' ? 'primary' : 'danger'"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ action === 'approve' ? 'Одобрить заявку' : 'Отклонить заявку' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  action: {
    type: String,
    required: true,
    validator: (value) => ['approve', 'reject'].includes(value)
  }
})

const emit = defineEmits(['close', 'submit'])

const { authFetch } = useAuthFetch()
const toast = useNotification()

const loading = ref(false)
const form = ref({
  approvedSlots: 0,
  notes: '',
  rejectionReason: ''
})
const errors = ref({})

const validateForm = () => {
  errors.value = {}

  if (props.action === 'approve') {
    if (props.request.requestType === 'reservation') {
      if (!form.value.approvedSlots || form.value.approvedSlots < 1) {
        errors.value.approvedSlots = 'Укажите количество мест'
      } else if (form.value.approvedSlots > props.request.totalRequestedSlots) {
        errors.value.approvedSlots = `Не более ${props.request.totalRequestedSlots} мест`
      }
    }
  } else {
    if (!form.value.rejectionReason.trim()) {
      errors.value.rejectionReason = 'Укажите причину отклонения'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (loading.value) return
  
  if (!validateForm()) return

  loading.value = true
  try {
    const endpoint = props.action === 'approve'
      ? `/api/requests/${props.request.id}/approve`
      : `/api/requests/${props.request.id}/reject`

    const body = props.action === 'approve'
      ? {
          approvedSlots: props.request.requestType === 'reservation' ? form.value.approvedSlots : undefined,
          notes: form.value.notes
        }
      : {
          rejectionReason: form.value.rejectionReason
        }

    const response = await authFetch(endpoint, {
      method: 'PATCH',
      body
    })

    if (response.success) {
      toast.success(
        props.action === 'approve'
          ? 'Заявка успешно одобрена'
          : 'Заявка отклонена'
      )
      emit('submit', response.request)
      emit('close')
    } else {
      handleErrors(response)
    }
  } catch (error) {
    toast.error('Произошла ошибка при обработке заявки')
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
    toast.error(response.message || 'Ошибка при обработке заявки')
  }
}

const resetForm = () => {
  form.value = {
    approvedSlots: props.request?.totalRequestedSlots || 0,
    notes: '',
    rejectionReason: ''
  }
  errors.value = {}
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

watch(() => props.request, () => {
  if (props.isOpen) {
    resetForm()
  }
})
</script>
