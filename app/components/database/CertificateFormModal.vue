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

      <!-- Выбор способа добавления файла -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Файл сертификата
        </label>
        <div class="flex gap-4 mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="fileInputMode"
              value="url"
              class="w-4 h-4 text-primary"
            />
            <span class="text-sm text-black dark:text-white">Ввести URL</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="fileInputMode"
              value="upload"
              class="w-4 h-4 text-primary"
            />
            <span class="text-sm text-black dark:text-white">Загрузить файл</span>
          </label>
        </div>

        <!-- Ввод URL -->
        <div v-if="fileInputMode === 'url'">
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

        <!-- Загрузка файла -->
        <div v-else-if="fileInputMode === 'upload'">
          <CommonFileUploader
            v-if="!uploadedFile"
            category="certificate_generated"
            :folder-id="certificatesFolderId"
            :related-id="parseInt(studentId)"
            :metadata="{ pinfl: studentPinfl, certificateNumber: formData.certificateNumber }"
            accept=".pdf,.jpg,.jpeg,.png"
            :max-size-mb="10"
            :show-preview="false"
            @uploaded="handleFileUploaded"
            @error="handleFileError"
          />
          
          <!-- Превью загруженного файла -->
          <div v-else class="rounded-lg border border-stroke bg-gray-50 dark:bg-gray-800 dark:border-strokedark p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="shrink-0 h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <svg class="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-black dark:text-white">
                    {{ uploadedFile.filename }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(uploadedFile.sizeBytes) }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                @click="removeUploadedFile"
                class="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Удалить"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
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
import { ref, onMounted } from 'vue';
import type { CreateCertificateData } from '~/types/student';
import type { FileRecord } from '~/types/file';

interface Props {
  studentId: string;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [data: CreateCertificateData];
}>();

// Composables
const notification = useNotification();
const { formatFileSize } = useFileManager();
const { authFetch } = useAuthFetch();

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
const fileInputMode = ref<'url' | 'upload'>('url');
const uploadedFile = ref<FileRecord | null>(null);
const certificatesFolderId = ref<number | null>(null);
const studentPinfl = ref<string>('');

// Получение папки "Сертификаты" и ПИНФЛ студента при монтировании
onMounted(async () => {
  try {
    // Получение или создание папки "Сертификаты"
    try {
      const folderResponse = await authFetch<{ success: boolean; folder: { id: number } }>('/api/folders/by-name/Сертификаты');
      if (folderResponse.success && folderResponse.folder) {
        certificatesFolderId.value = folderResponse.folder.id;
      }
    } catch (error: any) {
      // Если папка не найдена, создаем её
      if (error?.statusCode === 404 || error?.data?.message?.includes('не найдена')) {
        console.log('Папка "Сертификаты" не найдена, создаем...');
        const createResponse = await authFetch<{ success: boolean; folder: { id: number } }>('/api/folders', {
          method: 'POST',
          body: {
            name: 'Сертификаты',
            parentId: null,
            isSystem: false,
          },
        });
        if (createResponse.success && createResponse.folder) {
          certificatesFolderId.value = createResponse.folder.id;
          console.log('Папка "Сертификаты" создана');
        }
      } else {
        throw error;
      }
    }

    // Получение ПИНФЛ студента
    const studentResponse = await authFetch<{ success: boolean; student: { pinfl: string } }>(`/api/students/${props.studentId}`);
    if (studentResponse.success && studentResponse.student) {
      studentPinfl.value = studentResponse.student.pinfl;
    }
  } catch (error) {
    console.error('Ошибка получения данных:', error);
    // Не показываем ошибку пользователю, просто логируем
  }
});

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

  if (fileInputMode.value === 'url' && formData.value.fileUrl && !isValidUrl(formData.value.fileUrl)) {
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

// Обработка загрузки файла
const handleFileUploaded = (file: FileRecord) => {
  uploadedFile.value = file;
  notification.success('Файл успешно загружен', 'Успех');
};

// Обработка ошибки загрузки
const handleFileError = (message: string) => {
  notification.error(message, 'Ошибка загрузки');
};

// Удаление загруженного файла
const removeUploadedFile = () => {
  uploadedFile.value = null;
};

// Обработка отправки формы
const handleSubmit = async () => {
  console.log('handleSubmit вызван');
  
  if (!validateForm()) {
    console.log('Валидация не прошла:', errors.value);
    return;
  }

  console.log('Валидация прошла, отправляем форму');
  isSubmitting.value = true;
  errors.value = {};

  try {
    const submitData: CreateCertificateData = {
      studentId: props.studentId,
      courseName: formData.value.courseName.trim(),
      certificateNumber: formData.value.certificateNumber.trim(),
      issueDate: formData.value.issueDate,
      expiryDate: formData.value.expiryDate || undefined,
    };

    // Добавляем либо fileUrl, либо fileUuid
    if (fileInputMode.value === 'upload' && uploadedFile.value) {
      submitData.fileUuid = uploadedFile.value.uuid;
    } else if (fileInputMode.value === 'url' && formData.value.fileUrl.trim()) {
      submitData.fileUrl = formData.value.fileUrl.trim();
    }

    emit('submit', submitData);
    
    // Сброс формы после успешной отправки
    formData.value = {
      courseName: '',
      certificateNumber: '',
      issueDate: '',
      expiryDate: '',
      fileUrl: '',
    };
    uploadedFile.value = null;
    fileInputMode.value = 'url';
  } catch (error) {
    console.error('Ошибка отправки формы:', error);
    notification.error('Произошла ошибка при сохранении данных', 'Ошибка');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
