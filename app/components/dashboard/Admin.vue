<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Добро пожаловать, {{ user?.name || 'Администратор' }}!
        </h2>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {{ currentDate }}
        </p>
      </div>
      <NuxtLink to="/settings">
        <UiButton variant="outline" class="flex items-center gap-2">
          <IconsSettingsIcon class="w-5 h-5" />
          Настройки системы
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
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего студентов</h3>
            <div class="flex items-center gap-2">
              <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.totalStudents || 0 }}</p>
              <span v-if="stats?.studentsTrend" class="text-xs font-medium text-success">
                +{{ stats.studentsTrend }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <IconsInstructorIcon class="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Преподаватели</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.totalInstructors || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <IconsUserGroupIcon class="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активные группы</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.activeGroups || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <IconsCertificateIcon class="w-6 h-6 text-info" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Сертификаты за месяц</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.certificatesThisMonth || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Системная статистика -->
      <div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconsBarChartIcon class="w-5 h-5 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Статистика системы</h3>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Всего пользователей</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.totalUsers || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <IconsUserCircleIcon class="w-6 h-6 text-primary" />
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Зарегистрировано сегодня</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.todayRegistrations || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <IconsPlusIcon class="w-6 h-6 text-success" />
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Активных сессий</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.activeSessions || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <IconsGridIcon class="w-6 h-6 text-warning" />
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Логов сегодня</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.todayLogs || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                <IconsListIcon class="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Системные уведомления -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <IconsBellIcon class="w-5 h-5 text-warning" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Системные уведомления</h3>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.systemAlerts?.length" class="flex flex-col items-center justify-center py-8 text-center">
            <div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <IconsCheckIcon class="h-6 w-6 text-success" />
            </div>
            <p class="text-sm text-gray-500">Нет системных уведомлений</p>
          </div>
          <div v-else class="flex flex-col gap-3">
            <div 
              v-for="(alert, index) in stats.systemAlerts" 
              :key="index"
              class="flex items-start gap-3 p-3 rounded-lg"
              :class="getAlertClass(alert.type)"
            >
              <IconsWarningIcon v-if="alert.type === 'warning'" class="w-5 h-5 text-warning flex-shrink-0" />
              <IconsInfoCircleIcon v-else-if="alert.type === 'info'" class="w-5 h-5 text-info flex-shrink-0" />
              <IconsErrorIcon v-else-if="alert.type === 'error'" class="w-5 h-5 text-danger flex-shrink-0" />
              <IconsSuccessIcon v-else class="w-5 h-5 text-success flex-shrink-0" />
              <div class="flex-1">
                <p class="text-sm font-medium text-black dark:text-white">{{ alert.message }}</p>
                <p v-if="alert.action" class="text-xs text-primary hover:underline cursor-pointer mt-1">
                  {{ alert.action }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Последние действия -->
    <div class="mt-6 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconsListIcon class="w-5 h-5 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Последние действия</h3>
        </div>
        <NuxtLink to="/activity-logs" class="text-sm text-primary hover:underline">
          Все логи
        </NuxtLink>
      </div>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-8">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
        <div v-else-if="!stats?.recentActivities?.length" class="text-center text-gray-500 py-4">
          Нет недавних действий
        </div>
        <div v-else class="flex flex-col gap-3">
          <div 
            v-for="activity in stats.recentActivities" 
            :key="activity.id"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span 
              class="flex h-2 w-2 rounded-full flex-shrink-0"
              :class="getActivityDotClass(activity.action)"
            ></span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-black dark:text-white truncate">
                <span class="font-medium">{{ activity.user_name }}</span>
                <span class="text-gray-500 mx-1">•</span>
                <span class="text-gray-600 dark:text-gray-400">{{ activity.action }}</span>
              </p>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatRelativeTime(activity.created_at) }}</p>
            </div>
          </div>
        </div>
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
          <IconsAcademicCapIcon v-else-if="action.icon === 'academic'" class="w-4 h-4" />
          <IconsSettingsIcon v-else-if="action.icon === 'settings'" class="w-4 h-4" />
          <IconsListIcon v-else-if="action.icon === 'list'" class="w-4 h-4" />
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
  { to: '/users/create', label: 'Создать пользователя', icon: 'plus' },
  { to: '/programs/create', label: 'Создать курс', icon: 'academic' },
  { to: '/settings', label: 'Настройки', icon: 'settings' },
  { to: '/activity-logs', label: 'Логи', icon: 'list' },
];

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch('/api/admin/dashboard');
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch admin dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return date.toLocaleDateString('ru-RU');
};

const getAlertClass = (type) => {
  const classes = {
    warning: 'bg-warning/10 border border-warning/30',
    info: 'bg-info/10 border border-info/30',
    error: 'bg-danger/10 border border-danger/30',
    success: 'bg-success/10 border border-success/30'
  };
  return classes[type] || classes.info;
};

const getActivityDotClass = (action) => {
  if (action.includes('создал') || action.includes('добавил')) return 'bg-success';
  if (action.includes('удалил')) return 'bg-danger';
  if (action.includes('изменил') || action.includes('обновил')) return 'bg-warning';
  if (action.includes('вход')) return 'bg-primary';
  return 'bg-gray-400';
};

onMounted(() => {
  fetchDashboardStats();
});
</script>
