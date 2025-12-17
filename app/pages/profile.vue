<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Профиль пользователя
      </h2>
    </div>

    <!-- Профиль Header -->
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
                src="https://ui-avatars.com/api/?name=Admin+User&size=128&background=465fff&color=fff&bold=true" 
                alt="Profile" 
                class="h-full w-full object-cover"
              />
            </div>
            <button class="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg transition-all hover:bg-primary-600 dark:border-gray-900">
              <Camera class="h-5 w-5" />
            </button>
          </div>

          <!-- User Info -->
          <div class="flex-1 text-center sm:text-left">
            <h3 class="mb-1 text-2xl font-bold text-white dark:text-gray-900">
              Администратор
            </h3>
            <p class="mb-2 text-gray-600 dark:text-gray-400">
              admin@example.com
            </p>
            <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                <span class="h-2 w-2 rounded-full bg-success"></span>
                Активен
              </span>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <ShieldCheck class="h-4 w-4" />
                Администратор
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <UiButton variant="outline" size="md">
              <Mail class="h-4 w-4" />
              Написать
            </UiButton>
            <UiButton variant="primary" size="md">
              <Settings class="h-4 w-4" />
              Настройки
            </UiButton>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users class="h-6 w-6 text-primary" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Всего пользователей</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle class="h-6 w-6 text-success" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Активных сессий</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Clock class="h-6 w-6 text-warning" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Последний вход</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">2 часа назад</p>
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
            v-for="tab in tabs"
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
        <!-- Обзор -->
        <div v-show="activeTab === 'overview'" class="p-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Личная информация -->
            <div>
              <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Личная информация
              </h3>
              <div class="space-y-3">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p>
                  <p class="font-medium text-gray-900 dark:text-white">Администратор Системы</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p class="font-medium text-gray-900 dark:text-white">admin@example.com</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p>
                  <p class="font-medium text-gray-900 dark:text-white">+998 (90) 123-45-67</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Роль</p>
                  <p class="font-medium text-gray-900 dark:text-white">Администратор</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p>
                  <p class="font-medium text-gray-900 dark:text-white">15 января 2024</p>
                </div>
              </div>
            </div>

            <!-- Последняя активность -->
            <div>
              <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Последняя активность
              </h3>
              <div class="space-y-3">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <UserPlus class="h-5 w-5 text-primary" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 dark:text-white">Добавлен новый пользователь</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">2 часа назад</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <FileText class="h-5 w-5 text-success" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 dark:text-white">Импортированы данные студентов</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">5 часов назад</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <Settings class="h-5 w-5 text-warning" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 dark:text-white">Изменены настройки системы</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">1 день назад</p>
                    </div>
                  </div>
                </div>

                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-danger/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                      <AlertCircle class="h-5 w-5 text-danger" />
                    </div>
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 dark:text-white">Неудачная попытка входа</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">2 дня назад</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Редактировать профиль -->
        <div v-show="activeTab === 'edit'" class="p-6">
          <h3 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Редактировать профиль
          </h3>
          <form class="space-y-5">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <!-- Имя -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Имя
                </label>
                <input 
                  type="text" 
                  value="Администратор"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                />
              </div>

              <!-- Фамилия -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Фамилия
                </label>
                <input 
                  type="text" 
                  value="Системы"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                />
              </div>
            </div>

            <!-- Email -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input 
                type="email" 
                value="admin@example.com"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
              />
            </div>

            <!-- Телефон -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Телефон
              </label>
              <input 
                type="tel" 
                value="+998 (90) 123-45-67"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
              />
            </div>

            <!-- О себе -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                О себе
              </label>
              <textarea 
                rows="4"
                placeholder="Расскажите о себе..."
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              ></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <UiButton variant="outline" size="md" type="button">
                Отмена
              </UiButton>
              <UiButton variant="primary" size="md" type="submit">
                Сохранить изменения
              </UiButton>
            </div>
          </form>
        </div>

        <!-- Безопасность -->
        <div v-show="activeTab === 'security'" class="p-6">
          <h3 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Настройки безопасности
          </h3>
          <div class="space-y-6">
            <!-- Изменить пароль -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <h4 class="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                <Lock class="h-5 w-5" />
                Изменить пароль
              </h4>
              <div class="space-y-4">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Текущий пароль
                  </label>
                  <input 
                    type="password" 
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Новый пароль
                  </label>
                  <input 
                    type="password" 
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Подтвердите новый пароль
                  </label>
                  <input 
                    type="password" 
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>
                <div class="flex justify-end pt-2">
                  <UiButton variant="primary" size="md">
                    Обновить пароль
                  </UiButton>
                </div>
              </div>
            </div>

            <!-- Активные сессии -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <h4 class="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                <Monitor class="h-5 w-5" />
                Активные сессии
              </h4>
              <div class="space-y-3">
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-900">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Monitor class="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">Windows 11 - Chrome</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">192.168.1.1 • Активна сейчас</p>
                    </div>
                  </div>
                  <span class="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    Текущая
                  </span>
                </div>

                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-900">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Smartphone class="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">iPhone 14 - Safari</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">192.168.1.105 • 2 часа назад</p>
                    </div>
                  </div>
                  <UiButton variant="danger" size="sm">
                    Завершить
                  </UiButton>
                </div>
              </div>
            </div>

            <!-- Двухфакторная аутентификация -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ShieldCheck class="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 class="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                      Двухфакторная аутентификация
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Дополнительный уровень защиты вашего аккаунта
                    </p>
                  </div>
                </div>
                <label class="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" class="peer sr-only" />
                  <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  User, 
  Edit, 
  Lock,
  Camera,
  Mail,
  Settings,
  Users,
  CheckCircle,
  Clock,
  UserPlus,
  FileText,
  AlertCircle,
  ShieldCheck,
  Monitor,
  Smartphone
} from 'lucide-vue-next';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Профиль пользователя | TailAdmin - Nuxt Tailwind CSS Dashboard',
});

// Активная вкладка
const activeTab = ref('overview');

// Конфигурация вкладок
const tabs = [
  {
    id: 'overview',
    label: 'Обзор',
    icon: User,
  },
  {
    id: 'edit',
    label: 'Редактировать',
    icon: Edit,
  },
  {
    id: 'security',
    label: 'Безопасность',
    icon: Lock,
  },
];
</script>
