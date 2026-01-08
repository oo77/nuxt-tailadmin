<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Журнал действий
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          История всех действий пользователей в системе
        </p>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
      <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
        Фильтры
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Фильтр по типу действия -->
        <div>
          <label class="mb-2 block text-sm font-medium text-black dark:text-white">
            Тип действия
          </label>
          <select
            v-model="filters.actionType"
            @change="applyFilters"
            class="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
          >
            <option value="">Все действия</option>
            <option value="CREATE">Создание</option>
            <option value="UPDATE">Обновление</option>
            <option value="DELETE">Удаление</option>
            <option value="VIEW">Просмотр</option>
            <option value="LOGIN">Вход</option>
            <option value="LOGOUT">Выход</option>
            <option value="IMPORT">Импорт</option>
            <option value="EXPORT">Экспорт</option>
            <option value="APPROVE">Одобрение</option>
            <option value="REJECT">Отклонение</option>
            <option value="BLOCK">Блокировка</option>
            <option value="UNBLOCK">Разблокировка</option>
            <option value="REVOKE">Отзыв</option>
            <option value="ISSUE">Выдача</option>
            <option value="RESET_PASSWORD">Сброс пароля</option>
            <option value="ASSIGN">Назначение</option>
            <option value="UNASSIGN">Снятие назначения</option>
          </select>
        </div>

        <!-- Фильтр по типу сущности -->
        <div>
          <label class="mb-2 block text-sm font-medium text-black dark:text-white">
            Тип сущности
          </label>
          <select
            v-model="filters.entityType"
            @change="applyFilters"
            class="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
          >
            <option value="">Все сущности</option>
            <option value="USER">Пользователь</option>
            <option value="STUDENT">Студент</option>
            <option value="CERTIFICATE">Сертификат</option>
            <option value="CERTIFICATE_TEMPLATE">Шаблон сертификата</option>
            <option value="ISSUED_CERTIFICATE">Выданный сертификат</option>
            <option value="COURSE">Курс</option>
            <option value="DISCIPLINE">Дисциплина</option>
            <option value="INSTRUCTOR">Инструктор</option>
            <option value="FILE">Файл</option>
            <option value="FOLDER">Папка</option>
            <option value="SCHEDULE">Занятие</option>
            <option value="GROUP">Группа</option>
            <option value="CLASSROOM">Аудитория</option>
            <option value="ORGANIZATION">Организация</option>
            <option value="REPRESENTATIVE">Представитель</option>
            <option value="ATTENDANCE">Посещаемость</option>
            <option value="GRADE">Оценка</option>
            <option value="SYSTEM">Система</option>
          </select>
        </div>

        <!-- Фильтр по дате начала -->
        <div>
          <label class="mb-2 block text-sm font-medium text-black dark:text-white">
            Дата начала
          </label>
          <input
            v-model="filters.startDate"
            @change="applyFilters"
            type="date"
            class="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
          />
        </div>

        <!-- Фильтр по дате окончания -->
        <div>
          <label class="mb-2 block text-sm font-medium text-black dark:text-white">
            Дата окончания
          </label>
          <input
            v-model="filters.endDate"
            @change="applyFilters"
            type="date"
            class="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
          />
        </div>
      </div>

      <!-- Кнопка сброса фильтров -->
      <div class="mt-4 flex justify-end">
        <button
          @click="resetFilters"
          class="inline-flex items-center justify-center rounded-md bg-meta-3 py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 transition"
        >
          Сбросить фильтры
        </button>
      </div>
    </div>

    <!-- Таблица с логами -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div class="p-6">
        <!-- Загрузка -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>

        <!-- Таблица -->
        <div v-else-if="logs.length > 0" class="overflow-x-auto">
          <table class="w-full table-auto">
            <thead>
              <tr class="bg-gray-2 text-left dark:bg-meta-4">
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Дата и время
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Пользователь
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Действие
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Сущность
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  Название
                </th>
                <th class="py-4 px-4 font-medium text-black dark:text-white">
                  IP адрес
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in logs"
                :key="log.id"
                class="border-b border-stroke dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4 transition"
              >
                <td class="py-4 px-4 text-sm">
                  <span class="text-black dark:text-white">
                    {{ formatDateTime(log.createdAt) }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-black dark:text-white">
                      {{ log.userName || 'Неизвестно' }}
                    </span>
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                      {{ log.userEmail || log.userId }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span
                    :class="[
                      'inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium',
                      getActionTypeColor(log.actionType)
                    ]"
                  >
                    {{ getActionTypeLabel(log.actionType) }}
                  </span>
                </td>
                <td class="py-4 px-4 text-sm text-black dark:text-white">
                  {{ getEntityTypeLabel(log.entityType) }}
                </td>
                <td class="py-4 px-4 text-sm text-black dark:text-white">
                  {{ log.entityName || '—' }}
                </td>
                <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ log.ipAddress || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пустое состояние -->
        <div v-else class="py-12 text-center">
          <p class="text-gray-600 dark:text-gray-400">
            Нет записей для отображения
          </p>
        </div>

        <!-- Пагинация -->
        <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Показано {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, total) }} из {{ total }}
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'inline-flex items-center justify-center rounded-md py-2 px-4 text-center font-medium transition',
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-meta-4 dark:text-gray-600'
                  : 'bg-primary text-white hover:bg-opacity-90'
              ]"
            >
              Назад
            </button>
            
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Страница {{ currentPage }} из {{ totalPages }}
            </span>
            
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'inline-flex items-center justify-center rounded-md py-2 px-4 text-center font-medium transition',
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-meta-4 dark:text-gray-600'
                  : 'bg-primary text-white hover:bg-opacity-90'
              ]"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
  middleware: 'auth', // Требуется авторизация
});

// Используем composable для работы с логами
const {
  logs,
  loading,
  total,
  currentPage,
  pageSize,
  totalPages,
  fetchActivityLogs,
  changePage: changePageFn,
  formatDateTime,
  getActionTypeLabel,
  getEntityTypeLabel,
  getActionTypeColor,
} = useActivityLogs();

// Фильтры
const filters = ref({
  actionType: '',
  entityType: '',
  startDate: '',
  endDate: '',
});

// Применить фильтры
const applyFilters = async () => {
  await fetchActivityLogs({
    actionType: filters.value.actionType || undefined,
    entityType: filters.value.entityType || undefined,
    startDate: filters.value.startDate || undefined,
    endDate: filters.value.endDate || undefined,
    page: 1, // Сбрасываем на первую страницу при изменении фильтров
  });
};

// Сбросить фильтры
const resetFilters = async () => {
  filters.value = {
    actionType: '',
    entityType: '',
    startDate: '',
    endDate: '',
  };
  await applyFilters();
};

// Изменить страницу
const changePage = async (page: number) => {
  await changePageFn(page, {
    actionType: filters.value.actionType || undefined,
    entityType: filters.value.entityType || undefined,
    startDate: filters.value.startDate || undefined,
    endDate: filters.value.endDate || undefined,
  });
};

// Загрузить данные при монтировании
onMounted(async () => {
  await fetchActivityLogs();
});
</script>
