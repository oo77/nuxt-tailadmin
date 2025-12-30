<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Управление пользователями
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Создание и управление учётными записями
        </p>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="flex flex-col gap-6">
      <!-- Tabs Navigation -->
      <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 relative',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
            ]"
          >
            <span class="flex items-center justify-center gap-2">
              {{ tab.label }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <!-- Администраторы Tab (только для ADMIN) -->
        <div v-if="isAdmin" v-show="activeTab === 'admin'" class="p-6">
          <UsersUserManagementPanel :role="UserRole.ADMIN" />
        </div>

        <!-- Модераторы Tab (только для ADMIN) -->
        <div v-if="isAdmin" v-show="activeTab === 'manager'" class="p-6">
          <UsersUserManagementPanel :role="UserRole.MANAGER" />
        </div>

        <!-- Инструкторы Tab (для ADMIN и MANAGER) -->
        <div v-show="activeTab === 'instructors'" class="p-6">
          <UsersInstructorManagementPanel />
        </div>

        <!-- Студенты Tab (для ADMIN и MANAGER) -->
        <div v-show="activeTab === 'students'" class="p-6">
          <DatabaseStudentManagementPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { UserRole } from '~/types/auth';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

// Получаем информацию о текущем пользователе
const { user } = useAuth();

// Проверка роли
const isAdmin = computed(() => user.value?.role === 'ADMIN');
const isManager = computed(() => user.value?.role === 'MANAGER');

// Все вкладки
const allTabs = [
  {
    id: 'admin',
    label: 'Администраторы',
    roles: ['ADMIN'], // Видна только админам
  },
  {
    id: 'manager',
    label: 'Модераторы',
    roles: ['ADMIN'], // Видна только админам
  },
  {
    id: 'instructors',
    label: 'Инструкторы',
    roles: ['ADMIN', 'MANAGER'], // Видна админам и модераторам
  },
  {
    id: 'students',
    label: 'Студенты',
    roles: ['ADMIN', 'MANAGER'], // Видна админам и модераторам
  },
];

// Фильтруем вкладки по роли пользователя
const visibleTabs = computed(() => {
  const userRole = user.value?.role || '';
  return allTabs.filter(tab => tab.roles.includes(userRole));
});

// Активная вкладка — первая из видимых
const activeTab = ref<string>('');

// Устанавливаем первую доступную вкладку при загрузке
watchEffect(() => {
  if (visibleTabs.value.length > 0 && !activeTab.value) {
    activeTab.value = visibleTabs.value[0].id;
  }
});
</script>
