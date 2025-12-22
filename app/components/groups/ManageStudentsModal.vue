<template>
  <UiModal :is-open="isOpen" title="Управление слушателями" size="lg" @close="$emit('close')">
    <div class="space-y-6">
      <!-- Информация о группе -->
      <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ group?.code }}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ group?.course?.name }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-4">
          <button
            type="button"
            @click="activeTab = 'list'"
            :class="[
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'list'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Текущие слушатели ({{ currentStudents.length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'add'"
            :class="[
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'add'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Добавить слушателей
          </button>
        </nav>
      </div>

      <!-- Список текущих слушателей -->
      <div v-if="activeTab === 'list'" class="space-y-4">
        <div v-if="currentStudents.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="mt-4">В группе пока нет слушателей</p>
          <button
            type="button"
            @click="activeTab = 'add'"
            class="mt-4 text-primary hover:underline"
          >
            Добавить слушателей
          </button>
        </div>

        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="gs in currentStudents"
            :key="gs.id"
            class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/10 text-success font-semibold text-lg">
                {{ getInitials(gs.student?.fullName) }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ gs.student?.fullName }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {{ gs.student?.pinfl }} • {{ gs.student?.organization }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  Добавлен: {{ formatDate(gs.enrolledAt) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="openTransferModal(gs)"
                class="p-2 text-gray-500 hover:text-primary transition-colors"
                title="Переместить в другую группу"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
              <button
                type="button"
                @click="removeStudentConfirm(gs)"
                class="p-2 text-gray-500 hover:text-danger transition-colors"
                title="Удалить из группы"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Добавление слушателей -->
      <div v-if="activeTab === 'add'" class="space-y-4">
        <GroupsStudentMultiSelect
          v-model="newStudentIds"
          :exclude-ids="existingStudentIds"
        />
        
        <div v-if="newStudentIds.length > 0" class="flex justify-end">
          <UiButton
            :loading="addingStudents"
            @click="addStudents"
          >
            Добавить выбранных ({{ newStudentIds.length }})
          </UiButton>
        </div>
      </div>

      <!-- Модальное окно переноса -->
      <UiModal
        :is-open="showTransferModal"
        title="Переместить слушателя"
        size="sm"
        @close="showTransferModal = false"
      >
        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Выберите группу для перемещения слушателя 
            <strong>{{ studentToTransfer?.student?.fullName }}</strong>:
          </p>
          
          <div v-if="loadingGroups" class="text-center py-4">
            <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          </div>
          
          <div v-else class="space-y-2 max-h-60 overflow-y-auto">
            <button
              v-for="g in availableGroups"
              :key="g.id"
              type="button"
              @click="transferStudentToGroup(g.id)"
              class="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p class="font-medium text-gray-900 dark:text-white">{{ g.code }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ g.courseName }}</p>
            </button>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <UiButton variant="outline" @click="showTransferModal = false">
              Отмена
            </UiButton>
          </div>
        </template>
      </UiModal>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UiButton variant="outline" @click="$emit('close')">
          Закрыть
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { GroupStudent } from '~/types/group';

const props = defineProps<{
  isOpen: boolean;
  group: {
    id: string;
    code: string;
    course?: { name: string };
    students?: GroupStudent[];
  } | null;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

// State
const activeTab = ref<'list' | 'add'>('list');
const newStudentIds = ref<string[]>([]);
const addingStudents = ref(false);
const showTransferModal = ref(false);
const studentToTransfer = ref<GroupStudent | null>(null);
const availableGroups = ref<Array<{ id: string; code: string; courseName: string }>>([]);
const loadingGroups = ref(false);

// Computed
const currentStudents = computed(() => props.group?.students || []);
const existingStudentIds = computed(() => currentStudents.value.map(s => s.studentId));

// Methods
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

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const addStudents = async () => {
  if (newStudentIds.value.length === 0 || !props.group) return;

  addingStudents.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string; conflicts?: any[] }>(
      `/api/groups/${props.group.id}/students`,
      {
        method: 'POST',
        body: { studentIds: newStudentIds.value },
      }
    );

    if (response.success) {
      toast.success(response.message || 'Слушатели успешно добавлены');
      newStudentIds.value = [];
      activeTab.value = 'list';
      emit('updated');
    } else if (response.conflicts && response.conflicts.length > 0) {
      const conflictNames = response.conflicts.map((c: any) => c.studentName).join(', ');
      toast.error(`Конфликт дат для: ${conflictNames}`);
    } else {
      toast.error(response.message || 'Ошибка добавления слушателей');
    }
  } catch (error) {
    toast.error('Ошибка при добавлении слушателей');
  } finally {
    addingStudents.value = false;
  }
};

const removeStudentConfirm = (gs: GroupStudent) => {
  if (confirm(`Удалить слушателя "${gs.student?.fullName}" из группы?`)) {
    removeStudent(gs.studentId);
  }
};

const removeStudent = async (studentId: string) => {
  if (!props.group) return;

  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/groups/${props.group.id}/students/${studentId}`,
      { method: 'DELETE' }
    );

    if (response.success) {
      toast.success('Слушатель удалён из группы');
      emit('updated');
    } else {
      toast.error(response.message || 'Ошибка удаления слушателя');
    }
  } catch (error) {
    toast.error('Ошибка при удалении слушателя');
  }
};

const openTransferModal = async (gs: GroupStudent) => {
  studentToTransfer.value = gs;
  showTransferModal.value = true;
  
  // Загружаем список доступных групп
  loadingGroups.value = true;
  try {
    const response = await authFetch<{ success: boolean; groups: any[] }>(
      '/api/groups/select',
      { params: { excludeGroupId: props.group?.id } }
    );

    if (response.success) {
      availableGroups.value = response.groups;
    }
  } catch (error) {
    console.error('Error loading groups:', error);
    availableGroups.value = [];
  } finally {
    loadingGroups.value = false;
  }
};

const transferStudentToGroup = async (toGroupId: string) => {
  if (!props.group || !studentToTransfer.value) return;

  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/groups/${props.group.id}/students/transfer`,
      {
        method: 'POST',
        body: {
          studentId: studentToTransfer.value.studentId,
          toGroupId,
        },
      }
    );

    if (response.success) {
      toast.success(response.message || 'Слушатель успешно перемещён');
      showTransferModal.value = false;
      studentToTransfer.value = null;
      emit('updated');
    } else {
      toast.error(response.message || 'Ошибка перемещения слушателя');
    }
  } catch (error) {
    toast.error('Ошибка при перемещении слушателя');
  }
};

// Reset state when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'list';
    newStudentIds.value = [];
  }
});
</script>
