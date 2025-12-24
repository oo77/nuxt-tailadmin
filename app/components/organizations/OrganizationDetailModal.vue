<template>
  <UiModal :is-open="isOpen" @close="handleClose" size="lg">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-black dark:text-white">
            {{ organization?.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Код: {{ organization?.code }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="organization" class="space-y-6">
        <!-- Статус -->
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            :class="organization.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
          >
            {{ organization.isActive ? 'Активна' : 'Неактивна' }}
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
            {{ organization.studentsCount }} слушателей
          </span>
        </div>

        <!-- Информация -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Краткое название -->
          <div v-if="organization.shortName">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Краткое название
            </h4>
            <p class="text-black dark:text-white">{{ organization.shortName }}</p>
          </div>

          <!-- Телефон -->
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Контактный телефон
            </h4>
            <p class="text-black dark:text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {{ organization.contactPhone || 'Не указан' }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email
            </h4>
            <p class="text-black dark:text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ organization.contactEmail || 'Не указан' }}
            </p>
          </div>

          <!-- Адрес -->
          <div class="md:col-span-2" v-if="organization.address">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Адрес
            </h4>
            <p class="text-black dark:text-white flex items-start gap-2">
              <svg class="w-4 h-4 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ organization.address }}
            </p>
          </div>
        </div>

        <!-- Описание -->
        <div v-if="organization.description">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Описание
          </h4>
          <div class="bg-gray-50 dark:bg-meta-4 rounded-lg p-4">
            <p class="text-black dark:text-white whitespace-pre-wrap">{{ organization.description }}</p>
          </div>
        </div>

        <!-- Даты -->
        <div class="border-t border-stroke dark:border-strokedark pt-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Создана:</span>
              <span class="ml-2 text-black dark:text-white">{{ formatDate(organization.createdAt) }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Обновлена:</span>
              <span class="ml-2 text-black dark:text-white">{{ formatDate(organization.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UiButton variant="outline" @click="emit('edit')">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Редактировать
        </UiButton>
        <UiButton variant="primary" @click="handleClose">
          Закрыть
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
interface Organization {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  description: string | null;
  isActive: boolean;
  studentsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

defineProps<{
  organization: Organization | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit'): void;
}>();

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleClose = () => {
  emit('close');
};
</script>
