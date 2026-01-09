<script setup lang="ts">
/**
 * Виджет "Неотмеченные занятия" для дашборда инструктора
 * Показывает список занятий, требующих отметки посещаемости
 */

import { 
  MARKING_STATUS_LABELS, 
  MARKING_STATUS_COLORS, 
  MARKING_STATUS_ICONS,
  type AttendanceMarkingStatusRecord,
  type MarkingStatistics,
} from '~/types/attendanceMarking';

const { authFetch } = useAuthFetch();

// Состояние
const loading = ref(true);
const pendingEvents = ref<AttendanceMarkingStatusRecord[]>([]);
const statistics = ref<MarkingStatistics | null>(null);

// Загрузка данных
async function loadData() {
  loading.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      pending: AttendanceMarkingStatusRecord[];
      statistics: MarkingStatistics;
    }>('/api/attendance/marking/pending');

    if (response.success) {
      pendingEvents.value = response.pending;
      statistics.value = response.statistics;
    }
  } catch (error) {
    console.error('Error loading pending markings:', error);
  } finally {
    loading.value = false;
  }
}

// Форматирование даты
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Форматирование оставшегося времени
function getTimeRemaining(deadlineStr: string): string {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    if (hours < 24) {
      return `Просрочено ${hours}ч`;
    }
    const days = Math.floor(hours / 24);
    return `Просрочено ${days}д`;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `Осталось ${hours}ч`;
  }
  const days = Math.floor(hours / 24);
  return `Осталось ${days}д`;
}

// Получить класс для строки в зависимости от статуса
function getRowClass(event: AttendanceMarkingStatusRecord): string {
  switch (event.status) {
    case 'overdue':
      return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500';
    case 'pending':
      const now = new Date();
      const deadline = new Date(event.deadline);
      if (now > deadline) {
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500';
      }
      return 'bg-gray-50 dark:bg-gray-800/50';
    default:
      return 'bg-gray-50 dark:bg-gray-800/50';
  }
}

// Загрузка при монтировании
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <!-- Заголовок -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Icon name="heroicons:clipboard-document-check" class="w-5 h-5 text-primary-600" />
        Посещаемость к отметке
        <span 
          v-if="statistics && statistics.pending > 0" 
          class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white"
        >
          {{ statistics.pending }}
        </span>
      </h3>
      
      <button
        @click="loadData"
        class="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Обновить"
      >
        <Icon name="heroicons:arrow-path" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Статистика -->
    <div v-if="statistics" class="grid grid-cols-4 gap-2 mb-4">
      <div class="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p class="text-lg font-bold text-gray-900 dark:text-white">{{ statistics.pending }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Ожидают</p>
      </div>
      <div class="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ statistics.overdue }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Просрочено</p>
      </div>
      <div class="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ statistics.late }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">С опозданием</p>
      </div>
      <div class="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ statistics.onTime }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Вовремя</p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Пустой список -->
    <div 
      v-else-if="pendingEvents.length === 0" 
      class="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      <Icon name="heroicons:check-circle" class="w-12 h-12 mx-auto mb-2 text-green-500" />
      <p class="font-medium">Все занятия отмечены</p>
      <p class="text-sm">Нет занятий, требующих отметки посещаемости</p>
    </div>

    <!-- Список занятий -->
    <ul v-else class="space-y-2">
      <li 
        v-for="event in pendingEvents.slice(0, 5)" 
        :key="event.id"
        :class="getRowClass(event)"
        class="flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-sm"
      >
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ event.event?.title || 'Занятие' }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(event.event?.endTime ?? null) }}
            <span v-if="event.event?.groupCode" class="ml-2">
              • {{ event.event.groupCode }}
            </span>
          </p>
        </div>
        
        <div class="flex items-center gap-3 ml-4">
          <div class="text-right">
            <span 
              :class="MARKING_STATUS_COLORS[event.status]"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
            >
              <Icon :name="MARKING_STATUS_ICONS[event.status]" class="w-3 h-3" />
              {{ MARKING_STATUS_LABELS[event.status] }}
            </span>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ getTimeRemaining(event.deadline) }}
            </p>
          </div>
          
          <NuxtLink 
            :to="`/groups/journal/${event.event?.groupId}?eventId=${event.scheduleEventId}`"
            class="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            title="Перейти к журналу"
          >
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </li>
    </ul>

    <!-- Ссылка "показать все" -->
    <NuxtLink 
      v-if="pendingEvents.length > 0"
      to="/attendance/pending" 
      class="block text-center mt-4 text-sm text-primary-600 hover:text-primary-700 hover:underline"
    >
      Показать все {{ pendingEvents.length > 5 ? `(${pendingEvents.length})` : '' }} →
    </NuxtLink>
  </div>
</template>
