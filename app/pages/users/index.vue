<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Управление пользователями
      </h2>
    </div>

    <!-- Вкладки для ролей -->
    <div class="flex flex-col gap-6">
      <!-- Tabs Navigation -->
      <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.role"
            @click="activeTab = tab.role"
            :disabled="tab.disabled"
            :class="[
              'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
              activeTab === tab.role
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
              tab.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent',
            ]"
          >
            <span class="flex items-center justify-center gap-2">
              {{ tab.label }}
              <span
                v-if="tab.disabled"
                class="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-300"
              >
                Скоро
              </span>
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <!-- Админ Tab -->
        <div v-show="activeTab === 'ADMIN'" class="p-6">
          <UsersUserManagementPanel :role="activeTab" />
        </div>

        <!-- Модератор Tab -->
        <div v-show="activeTab === 'MANAGER'" class="p-6">
          <div class="text-center py-12 text-gray-500 dark:text-gray-400">
            <p class="text-lg font-medium">Управление модераторами</p>
            <p class="mt-2">Функционал в разработке</p>
          </div>
        </div>

        <!-- Учитель Tab -->
        <div v-show="activeTab === 'TEACHER'" class="p-6">
          <div class="text-center py-12 text-gray-500 dark:text-gray-400">
            <p class="text-lg font-medium">Управление учителями</p>
            <p class="mt-2">Функционал в разработке</p>
          </div>
        </div>

        <!-- Студент Tab -->
        <div v-show="activeTab === 'STUDENT'" class="p-6">
          <div class="text-center py-12 text-gray-500 dark:text-gray-400">
            <p class="text-lg font-medium">Управление студентами</p>
            <p class="mt-2">Функционал в разработке</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { UserRole } from '~/types/auth';

// Определяем мета-данные страницы
definePageMeta({
  middleware: 'auth',
  layout: 'default',
});

// Активная вкладка
const activeTab = ref<UserRole>(UserRole.ADMIN);

// Конфигурация вкладок
const tabs = [
  {
    role: UserRole.ADMIN,
    label: 'Администраторы',
    disabled: false,
  },
  {
    role: UserRole.MANAGER,
    label: 'Модераторы',
    disabled: true, // Пока отключено
  },
  {
    role: UserRole.TEACHER,
    label: 'Учителя',
    disabled: true, // Пока отключено
  },
  {
    role: UserRole.STUDENT,
    label: 'Студенты',
    disabled: true, // Пока отключено
  },
];
</script>
