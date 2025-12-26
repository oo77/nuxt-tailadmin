<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Шаблоны сертификатов
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Управление шаблонами для генерации сертификатов
        </p>
      </div>
      <UiButton @click="showCreateModal = true">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Создать шаблон
      </UiButton>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Пустой список -->
    <div v-else-if="templates.length === 0" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-12 text-center">
      <div class="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Нет шаблонов
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Создайте первый шаблон сертификата для начала работы
      </p>
      <UiButton @click="showCreateModal = true">
        Создать шаблон
      </UiButton>
    </div>

    <!-- Список шаблонов -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="group rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden hover:shadow-lg transition-all duration-200"
      >
        <!-- Превью или плейсхолдер -->
        <div class="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <div v-if="template.originalFileUrl" class="absolute inset-0 flex items-center justify-center">
            <svg class="w-16 h-16 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div v-else class="text-center">
            <svg class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span class="text-sm text-gray-400">Файл не загружен</span>
          </div>

          <!-- Badges -->
          <div class="absolute top-3 left-3 flex gap-2">
            <span
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                template.isActive
                  ? 'bg-success/20 text-success'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              ]"
            >
              {{ template.isActive ? 'Активен' : 'Неактивен' }}
            </span>
          </div>

          <!-- Actions overlay -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <NuxtLink
              :to="`/certificates/templates/${template.id}`"
              class="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              title="Редактировать"
            >
              <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </NuxtLink>
            <button
              @click="confirmDelete(template)"
              class="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
              title="Удалить"
            >
              <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Контент -->
        <div class="p-5">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2 truncate">
            {{ template.name }}
          </h3>
          <p v-if="template.description" class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {{ template.description }}
          </p>

          <!-- Статистика -->
          <div class="flex flex-wrap gap-3 text-xs">
            <span class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {{ template.variables?.length || 0 }} переменных
            </span>
            <span class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ template.lastNumber }} выдано
            </span>
          </div>

          <!-- Формат номера -->
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span class="text-xs text-gray-400">Формат:</span>
            <code class="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {{ template.numberFormat }}
            </code>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка создания -->
    <CertificatesTemplateFormModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCreated"
    />

    <!-- Модалка подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление шаблона"
      message="Вы уверены, что хотите удалить этот шаблон?"
      :item-name="templateToDelete?.name"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { CertificateTemplate } from '~/types/certificate';

definePageMeta({
  layout: 'default',
  title: 'Шаблоны сертификатов',
});

useHead({
  title: 'Шаблоны сертификатов - АТЦ Платформа',
});

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// State
const loading = ref(true);
const templates = ref<CertificateTemplate[]>([]);
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const templateToDelete = ref<CertificateTemplate | null>(null);
const isDeleting = ref(false);

// Загрузка списка
const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await authFetch<{ success: boolean; templates: CertificateTemplate[] }>(
      '/api/certificates/templates'
    );
    if (response.success) {
      templates.value = response.templates;
    }
  } catch (error: any) {
    console.error('Error loading templates:', error);
    showError(error.message || 'Ошибка загрузки шаблонов');
  } finally {
    loading.value = false;
  }
};

// Обработчик создания
const handleCreated = (template: CertificateTemplate) => {
  showCreateModal.value = false;
  // Переходим на страницу редактирования созданного шаблона
  navigateTo(`/certificates/templates/${template.id}`);
};

// Подтверждение удаления
const confirmDelete = (template: CertificateTemplate) => {
  templateToDelete.value = template;
  showDeleteModal.value = true;
};

// Удаление
const handleDelete = async () => {
  if (!templateToDelete.value) return;

  isDeleting.value = true;
  try {
    await authFetch(`/api/certificates/templates/${templateToDelete.value.id}`, {
      method: 'DELETE',
    });
    showSuccess('Шаблон успешно удалён');
    await loadTemplates();
  } catch (error: any) {
    console.error('Error deleting template:', error);
    showError(error.data?.message || error.message || 'Ошибка удаления');
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
    templateToDelete.value = null;
  }
};

// Загружаем при монтировании
onMounted(() => {
  loadTemplates();
});
</script>
