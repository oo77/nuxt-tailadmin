<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="error" 
      class="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center"
    >
      <AlertCircle class="mx-auto h-12 w-12 text-danger" />
      <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Ошибка загрузки
      </h3>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        {{ error }}
      </p>
      <UiButton variant="primary" class="mt-4" @click="loadUser">
        Попробовать снова
      </UiButton>
    </div>

    <!-- User Profile -->
    <template v-else-if="userData">
      <!-- Кнопка назад -->
      <div class="mb-6">
        <NuxtLink 
          to="/users"
          class="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft class="h-4 w-4" />
          Назад к списку пользователей
        </NuxtLink>
      </div>

      <!-- Header с градиентом -->
      <div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <!-- Cover Image -->
        <div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600">
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Profile Info -->
        <div class="px-6 pb-6">
          <div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <!-- Avatar -->
            <div class="relative">
              <div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900">
                <img 
                  :src="avatarUrl" 
                  :alt="userData.name" 
                  class="h-full w-full object-cover"
                />
              </div>
            </div>

            <!-- User Info -->
            <div class="flex-1 text-center sm:text-left">
              <h3 class="mb-1 text-2xl font-bold text-white dark:text-gray-900">
                {{ userData.name }}
              </h3>
              <p class="mb-2 text-gray-600 dark:text-gray-400">
                {{ userData.email }}
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span 
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                  :class="getRoleBadgeClass(userData.role)"
                >
                  <ShieldCheck class="h-4 w-4" />
                  {{ getRoleLabel(userData.role) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ formatDate(userData.created_at) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <Activity class="h-6 w-6 text-success" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Всего действий</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ activityStats?.totalActions || 0 }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Clock class="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Последняя активность</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ activityStats?.lastActivity ? formatRelativeTime(activityStats.lastActivity) : 'Нет данных' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex flex-col gap-6">
        <!-- Tabs Navigation -->
        <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in availableTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
              ]"
            >
              <span class="flex items-center justify-center gap-2">
                <component :is="tab.icon" class="h-5 w-5" />
                {{ tab.label }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <!-- Информация -->
          <div v-show="activeTab === 'info'" class="p-6">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <!-- Личная информация -->
              <div>
                <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Личная информация
                </h3>
                <div class="space-y-3">
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p>
                    <p class="font-medium text-gray-900 dark:text-white">{{ userData.name }}</p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p class="font-medium text-gray-900 dark:text-white">{{ userData.email }}</p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.phone || '—' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">ПИНФЛ</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.pinfl || '—' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Рабочая информация -->
              <div>
                <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Рабочая информация
                </h3>
                <div class="space-y-3">
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Роль в системе</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ getRoleLabel(userData.role) }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Место работы</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.workplace || '—' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Должность</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.position || '—' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Обновлено</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ formatDate(userData.updated_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Журнал действий (только для админа) -->
          <div v-show="activeTab === 'activity'" class="p-6">
            <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Журнал действий
            </h3>

            <!-- Загрузка журнала -->
            <div v-if="isLoadingActivity" class="flex items-center justify-center py-12">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>

            <!-- Пустой журнал -->
            <div 
              v-else-if="activityLogs.length === 0" 
              class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50"
            >
              <Activity class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-4 text-gray-600 dark:text-gray-400">
                Пока нет записей в журнале
              </p>
            </div>

            <!-- Список действий -->
            <div v-else class="space-y-3">
              <div 
                v-for="log in activityLogs" 
                :key="log.id"
                class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div class="flex items-start gap-3">
                  <div 
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    :class="getActionIconClass(log.actionType)"
                  >
                    <component :is="getActionIcon(log.actionType)" class="h-5 w-5" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ getActionLabel(log.actionType) }} {{ getEntityLabel(log.entityType) }}
                      <span v-if="log.entityName" class="text-primary">"{{ log.entityName }}"</span>
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ formatRelativeTime(log.createdAt) }}
                    </p>
                    <p v-if="log.ipAddress" class="mt-1 text-xs text-gray-500">
                      IP: {{ log.ipAddress }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Пагинация -->
              <div v-if="activityTotalPages > 1" class="mt-4 flex justify-center gap-2">
                <UiButton 
                  variant="outline" 
                  size="sm" 
                  :disabled="activityPage === 1"
                  @click="loadActivityPage(activityPage - 1)"
                >
                  Назад
                </UiButton>
                <span class="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ activityPage }} из {{ activityTotalPages }}
                </span>
                <UiButton 
                  variant="outline" 
                  size="sm" 
                  :disabled="activityPage === activityTotalPages"
                  @click="loadActivityPage(activityPage + 1)"
                >
                  Далее
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  User, 
  Activity,
  ArrowLeft,
  AlertCircle, 
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Upload,
  Download,
} from 'lucide-vue-next';
import type { UserPublic, UserRole } from '~/types/auth';
import type { 
  ActivityLog, 
  ActionType, 
  EntityType,
  ACTION_TYPE_LABELS,
  ENTITY_TYPE_LABELS,
} from '~/types/activityLog';

// Meta
definePageMeta({
  layout: 'default',
});

// Route and Auth
const route = useRoute();
const { user: currentUser } = useAuth();
const { authFetch } = useAuthFetch();
const notification = useNotification();

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const userData = ref<UserPublic | null>(null);
const activeTab = ref('info');

// Activity Log State
const activityLogs = ref<ActivityLog[]>([]);
const activityStats = ref<{
  totalActions: number;
  lastActivity: Date | null;
} | null>(null);
const activityPage = ref(1);
const activityTotalPages = ref(1);
const isLoadingActivity = ref(false);

// Computed
const userId = computed(() => route.params.id as string);

const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');

const avatarUrl = computed(() => {
  if (!userData.value?.name) return '';
  const name = encodeURIComponent(userData.value.name);
  return `https://ui-avatars.com/api/?name=${name}&size=128&background=465fff&color=fff&bold=true`;
});

const availableTabs = computed(() => {
  const tabs = [
    { id: 'info', label: 'Информация', icon: User },
  ];
  
  // Журнал действий только для админа
  if (isAdmin.value) {
    tabs.push({ id: 'activity', label: 'Журнал действий', icon: Activity });
  }
  
  return tabs;
});

// Methods
const getRoleLabel = (role?: UserRole | string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Администратор',
    MANAGER: 'Модератор',
    TEACHER: 'Инструктор',
    STUDENT: 'Студент',
  };
  return labels[role || ''] || role || '';
};

const getRoleBadgeClass = (role?: UserRole | string): string => {
  const classes: Record<string, string> = {
    ADMIN: 'bg-danger/10 text-danger',
    MANAGER: 'bg-warning/10 text-warning',
    TEACHER: 'bg-primary/10 text-primary',
    STUDENT: 'bg-success/10 text-success',
  };
  return classes[role || ''] || 'bg-gray-100 text-gray-600';
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatRelativeTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  
  return formatDate(date);
};

const getActionLabel = (action: ActionType): string => {
  const labels: Record<ActionType, string> = {
    CREATE: 'Создал',
    UPDATE: 'Обновил',
    DELETE: 'Удалил',
    LOGIN: 'Вошёл в систему',
    LOGOUT: 'Вышел из системы',
    IMPORT: 'Импортировал',
    EXPORT: 'Экспортировал',
  };
  return labels[action] || action;
};

const getEntityLabel = (entity: EntityType): string => {
  const labels: Record<EntityType, string> = {
    USER: 'пользователя',
    STUDENT: 'студента',
    CERTIFICATE: 'сертификат',
    COURSE: 'курс',
    DISCIPLINE: 'дисциплину',
    INSTRUCTOR: 'инструктора',
    FILE: 'файл',
    FOLDER: 'папку',
    SYSTEM: 'системные настройки',
  };
  return labels[entity] || entity;
};

const getActionIcon = (action: ActionType) => {
  const icons: Record<ActionType, any> = {
    CREATE: Plus,
    UPDATE: Pencil,
    DELETE: Trash2,
    LOGIN: LogIn,
    LOGOUT: LogOut,
    IMPORT: Upload,
    EXPORT: Download,
  };
  return icons[action] || Activity;
};

const getActionIconClass = (action: ActionType): string => {
  const classes: Record<ActionType, string> = {
    CREATE: 'bg-success/10 text-success',
    UPDATE: 'bg-primary/10 text-primary',
    DELETE: 'bg-danger/10 text-danger',
    LOGIN: 'bg-info/10 text-info',
    LOGOUT: 'bg-warning/10 text-warning',
    IMPORT: 'bg-success/10 text-success',
    EXPORT: 'bg-info/10 text-info',
  };
  return classes[action] || 'bg-gray-100 text-gray-600';
};

const loadUser = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await authFetch<{ success: boolean; user: UserPublic; message?: string }>(
      `/api/users/${userId.value}`
    );
    
    if (response.success && response.user) {
      userData.value = response.user;
      
      // Загружаем статистику активности, если админ
      if (isAdmin.value) {
        await loadActivityStats();
        await loadActivityLogs();
      }
    } else {
      error.value = response.message || 'Не удалось загрузить данные пользователя';
    }
  } catch (err: any) {
    console.error('Error loading user:', err);
    error.value = err?.data?.message || err?.message || 'Ошибка загрузки пользователя';
  } finally {
    isLoading.value = false;
  }
};

const loadActivityStats = async () => {
  try {
    const response = await authFetch<{
      success: boolean;
      stats: { totalActions: number; lastActivity: Date | null };
    }>(`/api/activity-logs/user/${userId.value}?stats=true&limit=1`);
    
    if (response.success && response.stats) {
      activityStats.value = response.stats;
    }
  } catch (err) {
    console.error('Error loading activity stats:', err);
  }
};

const loadActivityLogs = async () => {
  isLoadingActivity.value = true;
  
  try {
    const response = await authFetch<{
      success: boolean;
      data: ActivityLog[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/activity-logs/user/${userId.value}?page=${activityPage.value}&limit=10`);
    
    if (response.success) {
      activityLogs.value = response.data;
      activityTotalPages.value = response.totalPages;
    }
  } catch (err) {
    console.error('Error loading activity logs:', err);
  } finally {
    isLoadingActivity.value = false;
  }
};

const loadActivityPage = (page: number) => {
  activityPage.value = page;
  loadActivityLogs();
};

// Head
useHead({
  title: computed(() => userData.value?.name 
    ? `${userData.value.name} | Профиль пользователя` 
    : 'Профиль пользователя'
  ),
});

// Lifecycle
onMounted(() => {
  loadUser();
});
</script>
