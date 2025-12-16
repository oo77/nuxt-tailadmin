<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок -->
    <div class="text-center">
      <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <svg
          v-if="progress.status === 'processing'"
          class="h-10 w-10 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <svg
          v-else-if="progress.status === 'completed'"
          class="h-10 w-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg
          v-else-if="progress.status === 'failed'"
          class="h-10 w-10 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ statusText }}
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ statusDescription }}
      </p>
    </div>

    <!-- Прогресс-бар -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
      <div class="mb-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Обработано записей
        </span>
        <span class="text-sm font-bold text-primary">
          {{ progress.processedRows }} / {{ progress.totalRows }}
        </span>
      </div>
      
      <!-- Прогресс-бар с анимацией -->
      <div class="relative h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          class="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
          :style="{ width: `${progressPercentage}%` }"
        >
          <div class="h-full w-full animate-pulse bg-white/20" />
        </div>
      </div>
      
      <div class="mt-2 text-center">
        <span class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ progressPercentage }}%
        </span>
      </div>
    </div>

    <!-- Статистика в реальном времени -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Успешно обработано -->
      <div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Успешно</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.successCount }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Создано -->
      <div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Создано</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.createdCount }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Обновлено -->
      <div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Обновлено</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.updatedCount }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Ошибки -->
      <div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Ошибки</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.errorCount }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибки в реальном времени -->
    <div
      v-if="progress.errors.length > 0"
      class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
    >
      <div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-red-900 dark:text-red-100">
              Ошибки при импорте
            </h4>
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ progress.errors.length }} {{ progress.errors.length === 1 ? 'запись' : 'записей' }} не удалось импортировать
            </p>
          </div>
        </div>
      </div>
      <div class="max-h-60 overflow-y-auto p-6">
        <div class="space-y-3">
          <div
            v-for="(error, index) in progress.errors.slice(0, 10)"
            :key="index"
            class="rounded-lg bg-white p-4 dark:bg-gray-800"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Строка {{ error.rowNumber }} • ПИНФЛ: {{ error.pinfl }}
                </p>
                <p class="text-sm text-red-600 dark:text-red-400">
                  {{ error.error }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <p v-if="progress.errors.length > 10" class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          И ещё {{ progress.errors.length - 10 }} {{ progress.errors.length - 10 === 1 ? 'ошибка' : 'ошибок' }}...
        </p>
      </div>
    </div>

    <!-- Индикатор активности -->
    <div v-if="progress.status === 'processing'" class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <div class="flex gap-1">
        <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 0ms" />
        <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 150ms" />
        <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 300ms" />
      </div>
      <span>Импорт в процессе...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ImportProgress } from '~/types/import';

const props = defineProps<{
  progress: ImportProgress;
}>();

const progressPercentage = computed(() => {
  if (props.progress.totalRows === 0) return 0;
  return Math.round((props.progress.processedRows / props.progress.totalRows) * 100);
});

const statusText = computed(() => {
  switch (props.progress.status) {
    case 'processing':
      return 'Импорт данных';
    case 'completed':
      return 'Импорт завершён';
    case 'failed':
      return 'Импорт не удался';
    default:
      return 'Ожидание';
  }
});

const statusDescription = computed(() => {
  switch (props.progress.status) {
    case 'processing':
      return 'Пожалуйста, подождите. Это может занять некоторое время...';
    case 'completed':
      return 'Все данные успешно обработаны';
    case 'failed':
      return 'Произошла ошибка при импорте данных';
    default:
      return 'Подготовка к импорту...';
  }
});
</script>
