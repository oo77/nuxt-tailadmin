<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isVisible"
            class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl max-h-[90vh] overflow-y-auto"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="sticky top-0 z-10 border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between bg-white dark:bg-boxdark">
              <h3 class="text-xl font-semibold text-black dark:text-white">
                Детали представителя
              </h3>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Контент -->
            <div class="p-6 space-y-6">
              <!-- Статус -->
              <div class="flex items-center justify-between">
                <span
                  :class="[
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                    representative.status === 'pending' && 'bg-warning/10 text-warning',
                    representative.status === 'approved' && 'bg-success/10 text-success',
                    representative.status === 'blocked' && 'bg-danger/10 text-danger',
                  ]"
                >
                  <span
                    :class="[
                      'h-2.5 w-2.5 rounded-full',
                      representative.status === 'pending' && 'bg-warning',
                      representative.status === 'approved' && 'bg-success',
                      representative.status === 'blocked' && 'bg-danger',
                    ]"
                  ></span>
                  {{ getStatusLabel(representative.status) }}
                </span>

                <!-- Действия -->
                <div class="flex gap-2">
                  <UiButton
                    v-if="representative.status === 'pending'"
                    variant="success"
                    @click="$emit('approve', representative)"
                  >
                    Одобрить
                  </UiButton>
                  <UiButton
                    v-if="representative.status !== 'blocked'"
                    variant="warning"
                    @click="$emit('block', representative)"
                  >
                    Заблокировать
                  </UiButton>
                </div>
              </div>

              <!-- Основная информация -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Основная информация</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">ФИО</p>
                    <p class="font-medium text-black dark:text-white">{{ representative.fullName }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Телефон</p>
                    <p class="font-medium text-black dark:text-white font-mono">{{ representative.phone }}</p>
                  </div>
                  <div class="md:col-span-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">Организация</p>
                    <p class="font-medium text-black dark:text-white">{{ representative.organizationName || 'Не указана' }}</p>
                  </div>
                </div>
              </div>

              <!-- Telegram -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Telegram</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Username</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.telegramUsername ? `@${representative.telegramUsername}` : 'Не указан' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Chat ID</p>
                    <p class="font-medium text-black dark:text-white font-mono">
                      {{ representative.telegramChatId || 'Не указан' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Доступ -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Настройки доступа</h4>
                <div class="space-y-3">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Доступ к группам</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.accessGroups ? `${representative.accessGroups.length} групп` : 'Все группы организации' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Уведомления</p>
                    <span
                      :class="[
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        representative.notificationsEnabled
                          ? 'bg-success/10 text-success'
                          : 'bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-gray-400'
                      ]"
                    >
                      {{ representative.notificationsEnabled ? 'Включены' : 'Выключены' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Одобрение (если одобрен) -->
              <div
                v-if="representative.status === 'approved' && representative.approvedBy"
                class="rounded-lg border border-stroke dark:border-strokedark p-4"
              >
                <h4 class="font-medium text-black dark:text-white mb-4">Информация об одобрении</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Одобрил</p>
                    <p class="font-medium text-black dark:text-white">{{ representative.approvedByName || 'Неизвестно' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Дата одобрения</p>
                    <p class="font-medium text-black dark:text-white">{{ formatDate(representative.approvedAt) }}</p>
                  </div>
                </div>
              </div>

              <!-- Блокировка (если заблокирован) -->
              <div
                v-if="representative.status === 'blocked' && representative.blockedReason"
                class="rounded-lg border border-danger/20 bg-danger/5 p-4"
              >
                <h4 class="font-medium text-danger mb-2">Причина блокировки</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ representative.blockedReason }}</p>
              </div>

              <!-- Активность -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Активность</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p>
                    <p class="font-medium text-black dark:text-white">{{ formatDate(representative.createdAt) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Последняя активность</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.lastActivityAt ? formatDate(representative.lastActivityAt) : 'Нет данных' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Футер -->
            <div class="sticky bottom-0 border-t border-stroke px-6 py-4 dark:border-strokedark bg-white dark:bg-boxdark">
              <div class="flex justify-end">
                <UiButton variant="secondary" @click="handleClose">
                  Закрыть
                </UiButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Representative {
  id: string;
  organizationId: string;
  organizationName?: string;
  fullName: string;
  phone: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  status: 'pending' | 'approved' | 'blocked';
  accessGroups: string[] | null;
  notificationsEnabled: boolean;
  lastActivityAt: Date | null;
  approvedBy: string | null;
  approvedByName?: string;
  approvedAt: Date | null;
  blockedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  representative: Representative;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  approve: [representative: Representative];
  block: [representative: Representative];
}>();

// Состояние
const isVisible = ref(false);

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300);
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Ожидает одобрения',
    approved: 'Одобрен',
    blocked: 'Заблокирован',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return 'Не указано';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Инициализация
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 10);
});
</script>
