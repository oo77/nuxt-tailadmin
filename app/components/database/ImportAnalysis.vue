<template>
  <div class="flex flex-col gap-6">
    <!-- Сводка анализа -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Всего строк -->
      <div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Всего строк</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.totalRows }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Валидные строки -->
      <div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Валидные</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.validRows }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Новые студенты -->
      <div class="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Будут созданы</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.newStudents }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Обновления -->
      <div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Будут обновлены</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.existingStudents }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибки валидации -->
    <div v-if="analysis.invalidRows > 0" class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-red-900 dark:text-red-100">
              Обнаружены ошибки валидации
            </h4>
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ analysis.invalidRows }} {{ analysis.invalidRows === 1 ? 'строка содержит' : 'строк содержат' }} ошибки и будут пропущены
            </p>
          </div>
        </div>
      </div>
      <div class="max-h-60 overflow-y-auto p-6">
        <div class="space-y-3">
          <div
            v-for="error in analysis.errors.slice(0, 10)"
            :key="error.rowNumber"
            class="rounded-lg bg-white p-4 dark:bg-gray-800"
          >
            <p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Строка {{ error.rowNumber }}
            </p>
            <ul class="space-y-1">
              <li
                v-for="(err, index) in error.errors"
                :key="index"
                class="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {{ err }}
              </li>
            </ul>
          </div>
        </div>
        <p v-if="analysis.errors.length > 10" class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          И ещё {{ analysis.errors.length - 10 }} {{ analysis.errors.length - 10 === 1 ? 'ошибка' : 'ошибок' }}...
        </p>
      </div>
    </div>

    <!-- Предпросмотр данных -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          Предпросмотр данных
        </h4>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Показаны первые {{ Math.min(analysis.preview.length, 20) }} валидных записей
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">№</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Служба/Отдел</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(item, index) in analysis.preview"
              :key="index"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.rowNumber }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{{ item.pinfl }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ item.fullName }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.organization }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.department || '—' }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.position }}</td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                    isExistingStudent(item.pinfl)
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  ]"
                >
                  {{ isExistingStudent(item.pinfl) ? 'Обновление' : 'Новый' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="flex items-center justify-end gap-4">
      <button
        @click="$emit('cancel')"
        :disabled="loading"
        class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Отмена
      </button>
      <button
        @click="$emit('confirm')"
        :disabled="loading || analysis.validRows === 0"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ loading ? 'Запуск импорта...' : `Импортировать ${analysis.validRows} записей` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ImportAnalysis } from '~/types/import';

const props = defineProps<{
  analysis: ImportAnalysis;
  loading?: boolean;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();

// Создаём Set для быстрой проверки существующих ПИНФЛ
const existingPinflsSet = computed(() => new Set(props.analysis.existingPinfls || []));

// Проверка, существует ли студент (для определения статуса)
const isExistingStudent = (pinfl: string): boolean => {
  return existingPinflsSet.value.has(pinfl);
};
</script>
