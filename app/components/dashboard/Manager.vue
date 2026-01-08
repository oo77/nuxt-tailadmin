<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Добрый день, {{ user?.name || 'Менеджер' }}!
        </h2>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {{ currentDate }}
          <span v-if="stats?.activeGroups > 0">
            • В работе {{ stats.activeGroups }} групп(ы)
          </span>
        </p>
      </div>
      <NuxtLink to="/groups">
        <UiButton class="flex items-center gap-2">
          <IconsUserGroupIcon class="w-5 h-5" />
          Все группы
        </UiButton>
      </NuxtLink>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <IconsUserGroupIcon class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активные группы</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.activeGroups || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <IconsUserCircleIcon class="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Студенты на курсах</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.studentsOnCourses || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <IconsClipboardCheckIcon class="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Тесты сегодня</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.testsToday || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <IconsCertificateIcon class="w-6 h-6 text-info" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">К выдаче сертификатов</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.certificatesPending || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Группы в работе -->
      <div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconsUserGroupIcon class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Группы в работе</h3>
          </div>
          <NuxtLink to="/groups" class="text-sm text-primary hover:underline">
            Все группы
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.groups?.length" class="text-center text-gray-500 py-4">
            Нет активных групп
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NuxtLink 
              v-for="group in stats.groups" 
              :key="group.id"
              :to="`/groups/${group.id}`"
              class="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:bg-gray-50 hover:border-primary dark:hover:bg-gray-800"
            >
              <h4 class="font-bold text-black dark:text-white mb-1">{{ group.code }}</h4>
              <p class="text-sm text-gray-500 mb-2">{{ group.course_name }}</p>
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="text-gray-400">{{ group.student_count }} студентов</span>
                <span class="text-gray-400">До {{ formatShortDate(group.end_date) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-600 dark:text-gray-400">Прогресс</span>
                <span class="font-medium text-primary">{{ group.progress }}%</span>
              </div>
              <div class="relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div 
                  class="absolute left-0 h-full rounded-full bg-primary transition-all"
                  :style="{ width: `${group.progress}%` }"
                ></div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Расписание на сегодня -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <IconsCalenderIcon class="w-5 h-5 text-success" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Сегодня</h3>
          </div>
          <NuxtLink to="/schedule" class="text-sm text-primary hover:underline">
            Календарь
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.todaySchedule?.length" class="text-center text-gray-500 py-4">
            Нет занятий на сегодня
          </div>
          <div v-else class="flex flex-col gap-3">
            <div 
              v-for="event in stats.todaySchedule" 
              :key="event.id"
              class="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <span class="text-sm font-bold text-primary">
                    {{ formatTime(event.start_time) }}
                  </span>
                  <h5 class="text-sm font-medium text-black dark:text-white mt-1">
                    {{ event.title }}
                  </h5>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ event.group_code }}
                    <span v-if="event.instructor_name"> • {{ event.instructor_name }}</span>
                  </p>
                </div>
                <span 
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="getEventTypeClass(event.event_type)"
                >
                  {{ getEventTypeLabel(event.event_type) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Завершаются в ближайшие 7 дней -->
    <div 
      v-if="stats?.groupsEndingSoon?.length"
      class="mt-6 rounded-lg bg-warning/5 border border-warning/30 shadow-md overflow-hidden"
    >
      <div class="border-b border-warning/30 py-4 px-6 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <IconsWarningIcon class="w-5 h-5 text-warning" />
          </div>
          <h3 class="text-lg font-semibold text-warning">
            Завершаются в ближайшие 7 дней
          </h3>
          <span class="bg-warning text-white text-xs px-2 py-0.5 rounded-full">
            {{ stats.groupsEndingSoon.length }}
          </span>
        </div>
      </div>
      <div class="p-6">
        <div class="flex flex-col gap-3">
          <div 
            v-for="group in stats.groupsEndingSoon" 
            :key="group.id"
            class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-3">
              <span 
                class="flex h-2.5 w-2.5 rounded-full"
                :class="getDaysUntilEndClass(group.end_date)"
              ></span>
              <div>
                <h5 class="font-medium text-black dark:text-white">{{ group.code }}</h5>
                <p class="text-xs text-gray-500">
                  {{ formatDate(group.end_date) }} ({{ getDaysUntilEnd(group.end_date) }})
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ group.student_count }} сертификатов
              </span>
              <NuxtLink 
                :to="`/groups/${group.id}/certificates`"
                class="block text-xs text-primary hover:underline mt-0.5"
              >
                Подготовить
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Требуют внимания -->
    <div 
      v-if="stats?.alerts?.length"
      class="mt-6 rounded-lg bg-danger/5 border border-danger/30 shadow-md overflow-hidden"
    >
      <div class="border-b border-danger/30 py-4 px-6">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center">
            <IconsErrorIcon class="w-5 h-5 text-danger" />
          </div>
          <h3 class="text-lg font-semibold text-danger">
            Требуют внимания
          </h3>
        </div>
      </div>
      <div class="p-6">
        <ul class="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li v-for="(alert, index) in stats.alerts" :key="index">
            {{ alert }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="mt-6 rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-black dark:text-white">Быстрые действия</h3>
      </div>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-primary hover:text-white hover:border-primary"
        >
          <IconsPlusIcon v-if="action.icon === 'plus'" class="w-4 h-4" />
          <IconsArchiveIcon v-else-if="action.icon === 'archive'" class="w-4 h-4" />
          <IconsCertificateIcon v-else-if="action.icon === 'certificate'" class="w-4 h-4" />
          <IconsCalenderIcon v-else-if="action.icon === 'calendar'" class="w-4 h-4" />
          {{ action.label }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const { user } = useAuth();
const { authFetch } = useAuthFetch();

const stats = ref(null);
const loading = ref(true);

const currentDate = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const quickActions = [
  { to: '/groups/create', label: 'Создать группу', icon: 'plus' },
  { to: '/database/import', label: 'Импорт студентов', icon: 'archive' },
  { to: '/certificates', label: 'Сертификаты', icon: 'certificate' },
  { to: '/schedule', label: 'Расписание', icon: 'calendar' },
];

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch('/api/manager/dashboard');
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch manager dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const formatShortDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const getEventTypeLabel = (type) => {
  const map = {
    theory: 'Лекция',
    practice: 'Практика',
    assessment: 'Тест',
    other: 'Другое'
  };
  return map[type] || type;
};

const getEventTypeClass = (type) => {
  const map = {
    theory: 'bg-primary/10 text-primary',
    practice: 'bg-success/10 text-success',
    assessment: 'bg-warning/10 text-warning',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  };
  return map[type] || map.other;
};

const getDaysUntilEnd = (endDate) => {
  const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'сегодня';
  if (days === 1) return 'завтра';
  return `${days} дней`;
};

const getDaysUntilEndClass = (endDate) => {
  const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days <= 1) return 'bg-danger animate-pulse';
  if (days <= 3) return 'bg-warning';
  return 'bg-success';
};

onMounted(() => {
  fetchDashboardStats();
});
</script>
