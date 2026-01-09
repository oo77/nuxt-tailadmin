<script setup lang="ts">
/**
 * Страница "Неотмеченные занятия" для инструкторов
 * Показывает все занятия, требующие отметки посещаемости
 */

import { 
  MARKING_STATUS_LABELS, 
  MARKING_STATUS_COLORS, 
  MARKING_STATUS_ICONS,
  type AttendanceMarkingStatusRecord,
  type MarkingStatistics,
} from '~/types/attendanceMarking';

definePageMeta({
  layout: 'default',
});

const { $authFetch } = useNuxtApp();
const { showSuccess, showError } = useNotification();

// Состояние
const loading = ref(true);
const events = ref<AttendanceMarkingStatusRecord[]>([]);
const statistics = ref<MarkingStatistics | null>(null);
const activeFilter = ref<'all' | 'pending' | 'overdue'>('pending');

// Загрузка данных
async function loadData() {
  loading.value = true;
  try {
    const response = await $authFetch<{
      success: boolean;
      statuses: AttendanceMarkingStatusRecord[];
    }>('/api/attendance/marking/status', {
      params: {
        onlyPending: activeFilter.value === 'pending' ? 'true' : undefined,
        status: activeFilter.value === 'overdue' ? 'overdue' : undefined,
      },
    });

    if (response.success) {
      events.value = response.statuses;
    }

    // Загружаем статистику
    const statsResponse = await $authFetch<{
      success: boolean;
      pending: AttendanceMarkingStatusRecord[];
      statistics: MarkingStatistics;
    }>('/api/attendance/marking/pending');

    if (statsResponse.success) {
      statistics.value = statsResponse.statistics;
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Ошибка загрузки данных');
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

// Оставшееся время до дедлайна
function getTimeRemaining(deadlineStr: string): { text: string; isOverdue: boolean; isUrgent: boolean } {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    if (hours < 24) {
      return { text: `Просрочено ${hours}ч`, isOverdue: true, isUrgent: true };
    }
    const days = Math.floor(hours / 24);
    return { text: `Просрочено ${days}д`, isOverdue: true, isUrgent: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 2) {
    return { text: `Осталось ${hours}ч`, isOverdue: false, isUrgent: true };
  }
  if (hours < 24) {
    return { text: `Осталось ${hours}ч`, isOverdue: false, isUrgent: false };
  }
  const days = Math.floor(hours / 24);
  return { text: `Осталось ${days}д`, isOverdue: false, isUrgent: false };
}

// Стиль строки на основе времени
function getRowClass(event: AttendanceMarkingStatusRecord): string {
  const timeInfo = getTimeRemaining(event.deadline);
  
  if (event.status === 'overdue') {
    return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10';
  }
  if (timeInfo.isOverdue || event.status === 'late') {
    return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
  }
  if (timeInfo.isUrgent) {
    return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10';
  }
  return 'border-l-4 border-transparent';
}

// Прогресс отметки
function getProgress(event: AttendanceMarkingStatusRecord): number {
  if (event.studentsCount === 0) return 0;
  return Math.round((event.markedCount / event.studentsCount) * 100);
}

// Загрузка при монтировании
onMounted(() => {
  loadData();
});

// Перезагрузка при смене фильтра
watch(activeFilter, () => {
  loadData();
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Заголовок -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Отметка посещаемости
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Занятия, требующие отметки посещаемости
        </p>
      </div>
      
      <button
        @click="loadData"
        :disabled="loading"
        class="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 
               border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium
               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Icon name="heroicons:arrow-path" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Обновить
      </button>
    </div>

    <!-- Статистика -->
    <div v-if="statistics" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Icon name="heroicons:clock" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ statistics.pending }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Ожидают</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Icon name="heroicons:x-circle" class="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ statistics.overdue }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Просрочено</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-yellow-600">{{ statistics.late }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">С опозданием</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600">{{ statistics.onTime }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Вовремя</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="filter in [
          { value: 'pending', label: 'Ожидают', count: statistics?.pending },
          { value: 'overdue', label: 'Просрочено', count: statistics?.overdue },
          { value: 'all', label: 'Все' },
        ]"
        :key="filter.value"
        @click="activeFilter = filter.value as any"
        :class="activeFilter === filter.value 
          ? 'bg-primary-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
        class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 
               transition-colors"
      >
        {{ filter.label }}
        <span 
          v-if="filter.count && filter.count > 0"
          class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
          :class="activeFilter === filter.value 
            ? 'bg-white/20' 
            : filter.value === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700'"
        >
          {{ filter.count }}
        </span>
      </button>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <!-- Пустой список -->
    <div 
      v-else-if="events.length === 0" 
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center"
    >
      <Icon name="heroicons:check-circle" class="w-16 h-16 mx-auto mb-4 text-green-500" />
      <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Все занятия отмечены
      </p>
      <p class="text-gray-500 dark:text-gray-400">
        Нет занятий, требующих отметки посещаемости
      </p>
    </div>

    <!-- Список занятий -->
    <div v-else class="space-y-3">
      <div 
        v-for="event in events" 
        :key="event.id"
        :class="getRowClass(event)"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 transition-all hover:shadow-md"
      >
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Информация о занятии -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Icon :name="MARKING_STATUS_ICONS[event.status]" class="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ event.event?.title || 'Занятие' }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatDate(event.event?.endTime ?? null) }}
                  <span v-if="event.event?.groupCode" class="ml-2">
                    • {{ event.event.groupCode }}
                  </span>
                </p>
                
                <!-- Прогресс отметки -->
                <div class="mt-2 flex items-center gap-3">
                  <div class="flex-1 max-w-[200px] bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all"
                      :class="getProgress(event) === 100 ? 'bg-green-500' : 'bg-primary-500'"
                      :style="{ width: `${getProgress(event)}%` }"
                    />
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ event.markedCount }}/{{ event.studentsCount }} студентов
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Статус и действия -->
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span 
                :class="MARKING_STATUS_COLORS[event.status]"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
              >
                <Icon :name="MARKING_STATUS_ICONS[event.status]" class="w-3 h-3" />
                {{ MARKING_STATUS_LABELS[event.status] }}
              </span>
              <p 
                class="text-xs mt-1"
                :class="getTimeRemaining(event.deadline).isOverdue 
                  ? 'text-red-600 font-medium' 
                  : getTimeRemaining(event.deadline).isUrgent 
                    ? 'text-orange-600' 
                    : 'text-gray-500'"
              >
                {{ getTimeRemaining(event.deadline).text }}
              </p>
            </div>
            
            <NuxtLink 
              :to="`/groups/journal/${event.event?.groupId}?eventId=${event.scheduleEventId}`"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 
                     text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Icon name="heroicons:pencil-square" class="w-4 h-4" />
              Отметить
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
