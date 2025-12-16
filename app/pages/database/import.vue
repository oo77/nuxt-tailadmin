<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Импорт студентов
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Массовый импорт студентов из Excel файла
        </p>
      </div>
      <NuxtLink
        to="/database"
        class="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад к базе данных
      </NuxtLink>
    </div>

    <!-- Шаги импорта -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex flex-1 items-center"
        >
          <div class="flex flex-col items-center flex-1">
            <div
              :class="[
                'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                currentStep >= index + 1
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800',
              ]"
            >
              <svg v-if="currentStep > index + 1" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else class="text-lg font-semibold">{{ index + 1 }}</span>
            </div>
            <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ step.label }}
            </p>
          </div>
          <div
            v-if="index < steps.length - 1"
            :class="[
              'h-1 flex-1 transition-all duration-300',
              currentStep > index + 1 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
            ]"
          />
        </div>
      </div>
    </div>

    <!-- Контент шагов -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <!-- Шаг 1: Загрузка файла -->
      <div v-show="currentStep === 1" class="p-6">
        <DatabaseImportUploader
          @file-selected="handleFileSelected"
          :loading="analyzing"
        />
      </div>

      <!-- Шаг 2: Предпросмотр и анализ -->
      <div v-show="currentStep === 2" class="p-6">
        <DatabaseImportAnalysis
          v-if="analysis"
          :analysis="analysis"
          @confirm="handleConfirmImport"
          @cancel="handleCancelImport"
          :loading="importing"
        />
      </div>

      <!-- Шаг 3: Прогресс импорта -->
      <div v-show="currentStep === 3" class="p-6">
        <DatabaseImportProgress
          v-if="importProgress"
          :progress="importProgress"
        />
      </div>

      <!-- Шаг 4: Результаты -->
      <div v-show="currentStep === 4" class="p-6">
        <DatabaseImportResults
          v-if="importProgress"
          :result="importProgress"
          @new-import="handleNewImport"
          @go-to-database="goToDatabase"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ImportAnalysis, ImportProgress } from '~/types/import';

definePageMeta({
  middleware: 'auth',
  layout: 'default',
});

// Шаги импорта
const steps = [
  { id: 1, label: 'Загрузка файла' },
  { id: 2, label: 'Предпросмотр' },
  { id: 3, label: 'Импорт' },
  { id: 4, label: 'Результаты' },
];

const currentStep = ref(1);
const analyzing = ref(false);
const importing = ref(false);
const selectedFile = ref<File | null>(null);
const analysis = ref<ImportAnalysis | null>(null);
const importProgress = ref<ImportProgress | null>(null);
const jobId = ref<string | null>(null);

const { authFetch } = useAuthFetch();

// Обработка выбора файла
const handleFileSelected = async (file: File) => {
  selectedFile.value = file;
  analyzing.value = true;

  try {
    // Создаём FormData для отправки файла
    const formData = new FormData();
    formData.append('file', file);

    // Анализируем файл
    const response = await authFetch<{ success: boolean; analysis: ImportAnalysis; error?: string }>(
      '/api/students/import/analyze',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (response.success && response.analysis) {
      analysis.value = response.analysis;
      currentStep.value = 2;
    } else {
      alert(response.error || 'Ошибка анализа файла');
    }
  } catch (error) {
    console.error('Ошибка анализа файла:', error);
    alert('Ошибка анализа файла');
  } finally {
    analyzing.value = false;
  }
};

// Подтверждение импорта
const handleConfirmImport = async () => {
  if (!selectedFile.value) return;

  importing.value = true;
  currentStep.value = 3;

  try {
    // Создаём FormData для отправки файла
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    // Запускаем импорт
    const response = await authFetch<{ success: boolean; jobId: string; error?: string }>(
      '/api/students/import/execute',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (response.success && response.jobId) {
      jobId.value = response.jobId;
      startProgressPolling();
    } else {
      alert(response.error || 'Ошибка запуска импорта');
      currentStep.value = 2;
    }
  } catch (error) {
    console.error('Ошибка запуска импорта:', error);
    alert('Ошибка запуска импорта');
    currentStep.value = 2;
  } finally {
    importing.value = false;
  }
};

// Опрос статуса импорта
const startProgressPolling = () => {
  const pollInterval = setInterval(async () => {
    if (!jobId.value) {
      clearInterval(pollInterval);
      return;
    }

    try {
      const response = await authFetch<{ success: boolean; status: ImportProgress }>(
        `/api/students/import/status/${jobId.value}`,
        {
          method: 'GET',
        }
      );

      if (response.success && response.status) {
        importProgress.value = response.status;

        // Если импорт завершён, останавливаем опрос
        if (response.status.status === 'completed' || response.status.status === 'failed') {
          clearInterval(pollInterval);
          currentStep.value = 4;
        }
      }
    } catch (error) {
      console.error('Ошибка получения статуса импорта:', error);
      clearInterval(pollInterval);
    }
  }, 500); // Опрос каждые 500ms
};

// Отмена импорта
const handleCancelImport = () => {
  currentStep.value = 1;
  selectedFile.value = null;
  analysis.value = null;
};

// Новый импорт
const handleNewImport = () => {
  currentStep.value = 1;
  selectedFile.value = null;
  analysis.value = null;
  importProgress.value = null;
  jobId.value = null;
};

// Переход к базе данных
const goToDatabase = () => {
  navigateTo('/database');
};
</script>
