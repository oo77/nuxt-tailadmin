<template>
  <UiModal
    :is-open="isOpen"
    @close="$emit('close')"
    :title="`Сертификат ${certificate?.certificateNumber || ''}`"
    size="lg"
  >
    <div v-if="certificate" class="space-y-6">
      <!-- Статус и общие данные -->
      <div class="flex items-center justify-between p-4 rounded-lg" :class="certificate.status === 'issued' ? 'bg-success/10' : 'bg-danger/10'">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'h-12 w-12 rounded-full flex items-center justify-center',
              certificate.status === 'issued' ? 'bg-success/20' : 'bg-danger/20'
            ]"
          >
            <svg
              v-if="certificate.status === 'issued'"
              class="h-6 w-6 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg
              v-else
              class="h-6 w-6 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-lg" :class="certificate.status === 'issued' ? 'text-success' : 'text-danger'">
              {{ certificate.status === 'issued' ? 'Сертификат выдан' : 'Сертификат отозван' }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ formatDate(certificate.issueDate) }}
            </p>
          </div>
        </div>
        <span class="font-mono text-lg font-bold text-primary">
          {{ certificate.certificateNumber }}
        </span>
      </div>

      <!-- Предупреждения (если есть) -->
      <div
        v-if="certificate.hasWarnings"
        class="p-4 bg-warning/10 border border-warning/20 rounded-lg"
      >
        <div class="flex items-center gap-2 mb-2">
          <svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-medium text-warning">Выдан с предупреждениями</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Этот сертификат был выдан несмотря на несоответствие некоторым требованиям (например, недостаточная посещаемость или отсутствие оценок).
        </p>
      </div>

      <!-- Причина отзыва -->
      <div
        v-if="certificate.status === 'revoked' && certificate.revokeReason"
        class="p-4 bg-danger/10 border border-danger/20 rounded-lg"
      >
        <p class="font-medium text-danger mb-1">Причина отзыва:</p>
        <p class="text-gray-600 dark:text-gray-400">{{ certificate.revokeReason }}</p>
        <p class="text-sm text-gray-500 mt-2">
          Дата отзыва: {{ formatDate(certificate.revokedAt) }}
        </p>
      </div>

      <!-- Информация о слушателе -->
      <div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark">
          <h4 class="font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Слушатель
          </h4>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">ФИО</p>
              <p class="font-medium text-black dark:text-white">{{ certificate.student.fullName }}</p>
            </div>
            <div v-if="certificate.student.pinfl">
              <p class="text-sm text-gray-500 dark:text-gray-400">ПИНФЛ</p>
              <p class="font-mono text-black dark:text-white">{{ certificate.student.pinfl }}</p>
            </div>
            <div v-if="certificate.student.organization">
              <p class="text-sm text-gray-500 dark:text-gray-400">Организация</p>
              <p class="text-black dark:text-white">{{ certificate.student.organization }}</p>
            </div>
            <div v-if="certificate.student.position">
              <p class="text-sm text-gray-500 dark:text-gray-400">Должность</p>
              <p class="text-black dark:text-white">{{ certificate.student.position }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Информация о курсе -->
      <div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark">
          <h4 class="font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Курс
          </h4>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">Название курса</p>
              <p class="font-medium text-black dark:text-white">{{ certificate.course.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Код курса</p>
              <p class="font-mono text-black dark:text-white">{{ certificate.course.code }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Группа</p>
              <p class="font-mono text-black dark:text-white">{{ certificate.group.code }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Информация о выдаче -->
      <div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark">
          <h4 class="font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Информация о выдаче
          </h4>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Шаблон</p>
              <p class="text-black dark:text-white">{{ certificate.template.name }}</p>
            </div>
            <div v-if="certificate.issuedBy">
              <p class="text-sm text-gray-500 dark:text-gray-400">Выдал</p>
              <p class="text-black dark:text-white">{{ certificate.issuedBy.name }}</p>
            </div>
            <div v-if="certificate.issuedAt">
              <p class="text-sm text-gray-500 dark:text-gray-400">Дата и время выдачи</p>
              <p class="text-black dark:text-white">{{ formatDateTime(certificate.issuedAt) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Создано</p>
              <p class="text-black dark:text-white">{{ formatDateTime(certificate.createdAt) }}</p>
            </div>
          </div>
          <div v-if="certificate.notes">
            <p class="text-sm text-gray-500 dark:text-gray-400">Примечания</p>
            <p class="text-black dark:text-white">{{ certificate.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Действия -->
      <div class="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
        <UiButton variant="secondary" @click="$emit('close')">
          Закрыть
        </UiButton>
        <a
          v-if="certificate.pdfFileUrl"
          :href="certificate.pdfFileUrl"
          target="_blank"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white font-medium hover:bg-primary/90 transition-colors"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Скачать PDF
        </a>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
interface Props {
  certificate: any;
  isOpen: boolean;
}

defineProps<Props>();
defineEmits<{
  close: [];
}>();

function formatDate(date: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(date: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
