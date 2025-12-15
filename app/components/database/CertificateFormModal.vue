<template>
  <UiModal :is-open="isOpen" @close="$emit('close')" title="Добавить сертификат">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Название курса -->
      <div>
        <label for="courseName" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Название курса <span class="text-danger">*</span>
        </label>
        <input
          id="courseName"
          v-model="formData.courseName"
          type="text"
          placeholder="Введите название курса"
          required
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': errors.courseName }"
        />
        <p v-if="errors.courseName" class="mt-1 text-sm text-danger">
          {{ errors.courseName }}
        </p>
      </div>

      <!-- Номер сертификата -->
      <div>
        <label for="certificateNumber" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Номер сертификата <span class="text-danger">*</span>
        </label>
        <input
          id="certificateNumber"
          v-model="formData.certificateNumber"
          type="text"
          placeholder="Введите номер сертификата"
          required
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary font-mono"
          :class="{ 'border-danger': errors.certificateNumber }"
        />
        <p v-if="errors.certificateNumber" class="mt-1 text-sm text-danger">
          {{ errors.certificateNumber }}
        </p>
      </div>

      <!-- Дата получения -->
      <div>
        <label for="issueDate" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Дата получения <span class="text-danger">*</span>
        </label>
        <input
          id="issueDate"
          v-model="formData.issueDate"
          type="date"
          required
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': errors.issueDate }"
        />
        <p v-if="errors.issueDate" class="mt-1 text-sm text-danger">
          {{ errors.issueDate }}
        </p>
      </div>

      <!-- Срок годности -->
      <div>
        <label for="expiryDate" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Срок годности
        </label>
        <input
          id="expiryDate"
          v-model="formData.expiryDate"
          type="date"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        />
        <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Оставьте пустым, если сертификат бессрочный
        </p>
      </div>

      <!-- Ссылка на файл -->
      <div>
        <label for="fileUrl" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Ссылка на файл сертификата
        </label>
        <input
          id="fileUrl"
          v-model="formData.fileUrl"
          type="url"
          placeholder="https://example.com/certificate.pdf"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': errors.fileUrl }"
        />
        <p v-if="errors.fileUrl" class="mt-1 text-sm text-danger">
          {{ errors.fileUrl }}
        </p>
        <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Введите URL файла сертификата (PDF, изображение и т.д.)
        </p>
      </div>

      <!-- Общая ошибка -->
      <div v-if="errors.general" class="rounded-md bg-danger/10 p-4">
        <p class="text-sm text-danger">{{ errors.general }}</p>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-4">
        <UiButton
          type="button"
          variant="secondary"
          @click="$emit('close')"
          :disabled="isSubmitting"
        >
          Отмена
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
          class="min-w-[120px]"
        >
          <span v-if="!isSubmitting">Добавить</span>
          <span v-else class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
            Сохранение...
          </span>
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CreateCertificateData } from '~/types/student';

interface Props {
  studentId: string;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [data: CreateCertificateData];
}>();

// Состояние формы
const formData = ref({
  courseName: '',
  certificateNumber: '',
  issueDate: '',
  expiryDate: '',
  fileUrl: '',
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

// Валидация формы
const validateForm = (): boolean => {
  errors.value = {};

  if (!formData.value.courseName.trim()) {
    errors.value.courseName = 'Название курса обязательно для заполнения';
  }

  if (!formData.value.certificateNumber.trim()) {
    errors.value.certificateNumber = 'Номер сертификата обязателен для заполнения';
  }

  if (!formData.value.issueDate) {
    errors.value.issueDate = 'Дата получения обязательна для заполнения';
  }

  if (formData.value.fileUrl && !isValidUrl(formData.value.fileUrl)) {
    errors.value.fileUrl = 'Введите корректный URL';
  }

  if (formData.value.expiryDate && formData.value.issueDate) {
    const issueDate = new Date(formData.value.issueDate);
    const expiryDate = new Date(formData.value.expiryDate);
    if (expiryDate <= issueDate) {
      errors.value.expiryDate = 'Срок годности должен быть позже даты получения';
    }
  }

  return Object.keys(errors.value).length === 0;
};

// Проверка валидности URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Обработка отправки формы
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  errors.value = {};

  try {
    const submitData: CreateCertificateData = {
      studentId: props.studentId,
      courseName: formData.value.courseName.trim(),
      certificateNumber: formData.value.certificateNumber.trim(),
      issueDate: formData.value.issueDate,
      fileUrl: formData.value.fileUrl.trim() || undefined,
      expiryDate: formData.value.expiryDate || undefined,
    };

    emit('submit', submitData);
    
    // Сброс формы после успешной отправки
    formData.value = {
      courseName: '',
      certificateNumber: '',
      issueDate: '',
      expiryDate: '',
      fileUrl: '',
    };
  } catch (error) {
    console.error('Ошибка отправки формы:', error);
    errors.value.general = 'Произошла ошибка при сохранении данных';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
