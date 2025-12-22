<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка информации о группе...</p>
      </div>
    </div>

    <!-- Группа не найдена -->
    <div v-else-if="!group" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Группа не найдена</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Возможно, группа была удалена или перемещена</p>
        <UiButton class="mt-6" @click="$router.push('/groups')">
          Вернуться к списку групп
        </UiButton>
      </div>
    </div>

    <!-- Содержимое -->
    <template v-else>
      <!-- Заголовок и навигация -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <NuxtLink to="/groups" class="hover:text-primary transition-colors">Учебные группы</NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900 dark:text-white">{{ group.code }}</span>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
              {{ group.code.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-black dark:text-white">{{ group.code }}</h1>
              <p class="text-gray-500 dark:text-gray-400">{{ group.course?.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UiButton variant="outline" @click="showEditModal = true">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактировать
            </UiButton>
            <UiButton variant="danger" @click="confirmDelete">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Основная информация -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Карточка информации -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Информация о группе</h3>
            
            <div class="space-y-4">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Код группы</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ group.code }}</p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Статус</label>
                <p>
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium',
                      statusClass
                    ]"
                  >
                    {{ statusText }}
                  </span>
                </p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Даты обучения</label>
                <p class="text-gray-900 dark:text-white font-medium">
                  {{ formatDate(group.startDate) }} — {{ formatDate(group.endDate) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ daysInfo }}</p>
              </div>
              
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Аудитория</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ group.classroom || '—' }}</p>
              </div>
              
              <div v-if="group.description">
                <label class="text-sm text-gray-500 dark:text-gray-400">Описание</label>
                <p class="text-gray-900 dark:text-white">{{ group.description }}</p>
              </div>
            </div>
          </div>

          <!-- Карточка курса -->
          <div v-if="group.course" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Учебная программа</h3>
            
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Название</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ group.course.name }}</p>
              </div>
              
              <div class="flex gap-4">
                <div>
                  <label class="text-sm text-gray-500 dark:text-gray-400">Код</label>
                  <p class="text-gray-900 dark:text-white font-medium">{{ group.course.code }}</p>
                </div>
                <div>
                  <label class="text-sm text-gray-500 dark:text-gray-400">Часов</label>
                  <p class="text-gray-900 dark:text-white font-medium">{{ group.course.totalHours }}</p>
                </div>
              </div>
              
              <NuxtLink
                :to="`/programs/${group.courseId}`"
                class="inline-flex items-center gap-1 text-primary hover:underline text-sm"
              >
                Перейти к программе
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Слушатели -->
        <div class="lg:col-span-2">
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-black dark:text-white">Слушатели</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ group.students?.length || 0 }} человек</p>
                  </div>
                </div>
                <UiButton @click="showManageStudentsModal = true">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Управление слушателями
                </UiButton>
              </div>
            </div>

            <div v-if="!group.students || group.students.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p class="mt-4">В группе пока нет слушателей</p>
              <UiButton class="mt-4" @click="showManageStudentsModal = true">
                Добавить слушателей
              </UiButton>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Слушатель
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ПИНФЛ
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Организация
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Должность
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Дата зачисления
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr
                    v-for="gs in group.students"
                    :key="gs.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success font-semibold">
                          {{ getInitials(gs.student?.fullName) }}
                        </div>
                        <span class="font-medium text-gray-900 dark:text-white">{{ gs.student?.fullName }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{ gs.student?.pinfl }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{ gs.student?.organization }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{ gs.student?.position }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(gs.enrolledAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальные окна -->
    <GroupsGroupFormModal
      :is-open="showEditModal"
      :group="group"
      @close="showEditModal = false"
      @updated="handleGroupUpdated"
    />

    <GroupsManageStudentsModal
      :is-open="showManageStudentsModal"
      :group="group"
      @close="showManageStudentsModal = false"
      @updated="loadGroup"
    />
  </div>
</template>

<script setup lang="ts">
import type { StudyGroup } from '~/types/group';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuthFetch();
const toast = useNotification();

// State
const loading = ref(true);
const group = ref<StudyGroup | null>(null);
const showEditModal = ref(false);
const showManageStudentsModal = ref(false);

// Computed
const statusClass = computed(() => {
  if (!group.value) return '';
  
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive) {
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }

  if (endDate < today) {
    return 'bg-warning/10 text-warning';
  }

  if (startDate > today) {
    return 'bg-info/10 text-info';
  }

  return 'bg-success/10 text-success';
});

const statusText = computed(() => {
  if (!group.value) return '';
  
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive) {
    return 'Неактивна';
  }

  if (endDate < today) {
    return 'Завершена';
  }

  if (startDate > today) {
    return 'Ожидает начала';
  }

  return 'В процессе';
});

const daysInfo = computed(() => {
  if (!group.value) return '';
  
  const today = new Date();
  const startDate = new Date(group.value.startDate);
  const endDate = new Date(group.value.endDate);
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (startDate > today) {
    const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return `Начнётся через ${daysUntilStart} дн.`;
  }
  
  if (endDate < today) {
    return `Завершено (${totalDays} дн.)`;
  }
  
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return `${daysPassed} из ${totalDays} дн.`;
});

// Methods
const loadGroup = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const response = await authFetch<{ success: boolean; group?: StudyGroup; message?: string }>(
      `/api/groups/${id}`
    );

    if (response.success && response.group) {
      group.value = response.group;
    } else {
      group.value = null;
    }
  } catch (error) {
    console.error('Error loading group:', error);
    group.value = null;
  } finally {
    loading.value = false;
  }
};

const handleGroupUpdated = (updatedGroup: StudyGroup) => {
  group.value = updatedGroup;
  showEditModal.value = false;
  loadGroup(); // Перезагружаем для получения связанных данных
};

const confirmDelete = () => {
  if (confirm(`Вы уверены, что хотите удалить группу "${group.value?.code}"?\n\nВсе слушатели будут удалены из этой группы.`)) {
    deleteGroup();
  }
};

const deleteGroup = async () => {
  if (!group.value) return;

  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/groups/${group.value.id}`,
      { method: 'DELETE' }
    );

    if (response.success) {
      toast.success('Группа успешно удалена');
      router.push('/groups');
    } else {
      toast.error(response.message || 'Ошибка при удалении группы');
    }
  } catch (error) {
    toast.error('Произошла ошибка при удалении');
  }
};

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getInitials = (name?: string): string => {
  if (!name) return '??';
  const parts = name.split(' ');
  const first = parts[0] || '';
  const second = parts[1] || '';
  if (first.length > 0 && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Initialize
onMounted(() => {
  loadGroup();
});

// Watch for route changes
watch(() => route.params.id, () => {
  loadGroup();
});
</script>
