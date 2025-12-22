<template>
  <UiModal
    :is-open="isOpen"
    :title="isEditMode ? 'Редактировать занятие' : 'Добавить занятие'"
    size="lg"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Название события -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Название занятия <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          :class="{ 'border-danger': errors.title }"
          placeholder="Введите название занятия"
        />
        <p v-if="errors.title" class="mt-1 text-sm text-danger">{{ errors.title }}</p>
      </div>

      <!-- Тип события и Цвет -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Тип события
          </label>
          <div class="relative">
            <select
              v-model="form.eventType"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
            >
              <option value="theory">Теория</option>
              <option value="practice">Практика</option>
              <option value="assessment">Проверка знаний</option>
              <option value="other">Другое</option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Цвет
          </label>
          <div class="flex gap-3">
            <button
              v-for="color in colorOptions"
              :key="color.value"
              type="button"
              @click="form.color = color.value"
              class="w-8 h-8 rounded-full transition-transform hover:scale-110"
              :class="[
                color.bg,
                form.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-boxdark' : ''
              ]"
              :title="color.label"
            />
          </div>
        </div>
      </div>

      <!-- Группа -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Учебная группа
        </label>
        <div class="relative">
          <select
            v-model="form.groupId"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
          >
            <option value="">Не выбрана</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.code }} — {{ group.courseName }}
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Инструктор -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Инструктор
        </label>
        <div class="relative">
          <select
            v-model="form.instructorId"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
          >
            <option value="">Не выбран</option>
            <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
              {{ instructor.fullName }}
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Аудитория -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Аудитория
        </label>
        <div class="relative">
          <select
            v-model="form.classroomId"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
          >
            <option value="">Не выбрана</option>
            <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
              {{ classroom.name }} (вместимость: {{ classroom.capacity }})
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Дата и время -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Дата и время начала <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.startTime"
            type="datetime-local"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            :class="{ 'border-danger': errors.startTime }"
          />
          <p v-if="errors.startTime" class="mt-1 text-sm text-danger">{{ errors.startTime }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Дата и время окончания <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.endTime"
            type="datetime-local"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            :class="{ 'border-danger': errors.endTime }"
          />
          <p v-if="errors.endTime" class="mt-1 text-sm text-danger">{{ errors.endTime }}</p>
        </div>
      </div>

      <!-- Весь день -->
      <div class="flex items-center gap-3">
        <input
          v-model="form.isAllDay"
          type="checkbox"
          id="isAllDay"
          class="w-5 h-5 rounded border-stroke text-primary focus:ring-primary dark:border-strokedark"
        />
        <label for="isAllDay" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Событие на весь день
        </label>
      </div>

      <!-- Описание -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Описание
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
          placeholder="Дополнительная информация о занятии"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-between items-center">
        <button
          v-if="isEditMode"
          type="button"
          @click="handleDelete"
          class="px-4 py-2 text-sm font-medium text-danger hover:text-danger/80 transition-colors flex items-center gap-2"
          :disabled="submitting"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Удалить
        </button>
        <div v-else></div>

        <div class="flex gap-3">
          <UiButton variant="outline" @click="handleClose" :disabled="submitting">
            Отмена
          </UiButton>
          <UiButton @click="handleSubmit" :disabled="submitting">
            <span v-if="submitting" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Сохранение...
            </span>
            <span v-else>{{ isEditMode ? 'Сохранить' : 'Добавить' }}</span>
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>

  <!-- Модальное подтверждение удаления -->
  <UiConfirmModal
    :is-open="showDeleteConfirm"
    variant="danger"
    title="Удалить занятие?"
    :message="`Вы уверены, что хотите удалить занятие '${form.title}'?`"
    :warning="'Это действие нельзя отменить.'"
    confirm-text="Удалить"
    cancel-text="Отмена"
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import type { ScheduleEvent, ScheduleEventColor, ScheduleEventType } from '~/types/schedule';

interface Group {
  id: string;
  code: string;
  courseName: string;
}

interface Instructor {
  id: string;
  fullName: string;
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
}

interface Props {
  isOpen: boolean;
  event?: ScheduleEvent | null;
  defaultStart?: Date;
  defaultEnd?: Date;
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  defaultStart: undefined,
  defaultEnd: undefined,
});

const emit = defineEmits<{
  close: [];
  saved: [event: ScheduleEvent];
  deleted: [id: string];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

// Данные для селектов
const groups = ref<Group[]>([]);
const instructors = ref<Instructor[]>([]);
const classrooms = ref<Classroom[]>([]);

// Форма
const form = ref({
  title: '',
  description: '',
  groupId: '',
  instructorId: '',
  classroomId: '',
  startTime: '',
  endTime: '',
  isAllDay: false,
  color: 'primary' as ScheduleEventColor,
  eventType: 'theory' as ScheduleEventType,
});

const errors = ref<Record<string, string>>({});
const submitting = ref(false);
const showDeleteConfirm = ref(false);
const deleting = ref(false);

const isEditMode = computed(() => !!props.event);

const colorOptions = [
  { value: 'primary' as ScheduleEventColor, bg: 'bg-primary', label: 'Синий' },
  { value: 'success' as ScheduleEventColor, bg: 'bg-success', label: 'Зелёный' },
  { value: 'warning' as ScheduleEventColor, bg: 'bg-warning', label: 'Оранжевый' },
  { value: 'danger' as ScheduleEventColor, bg: 'bg-danger', label: 'Красный' },
];

// Форматирование даты для input datetime-local
const formatDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Загрузка данных для селектов
const loadSelectData = async () => {
  try {
    // Загружаем группы
    const groupsResponse = await authFetch<{ success: boolean; groups: any[] }>('/api/groups?limit=1000&isActive=true');
    if (groupsResponse.success && groupsResponse.groups) {
      groups.value = groupsResponse.groups.map(g => ({
        id: g.id,
        code: g.code,
        courseName: g.course?.name || '',
      }));
    }

    // Загружаем инструкторов
    const instructorsResponse = await authFetch<{ success: boolean; instructors: any[] }>('/api/instructors?limit=1000&isActive=true');
    if (instructorsResponse.success && instructorsResponse.instructors) {
      instructors.value = instructorsResponse.instructors;
    }

    // Загружаем аудитории
    const classroomsResponse = await authFetch<{ success: boolean; classrooms: Classroom[] }>('/api/classrooms');
    if (classroomsResponse.success) {
      classrooms.value = classroomsResponse.classrooms;
    }
  } catch (error) {
    console.error('Error loading select data:', error);
  }
};

// Инициализация формы
const initForm = () => {
  if (props.event) {
    form.value = {
      title: props.event.title,
      description: props.event.description || '',
      groupId: props.event.groupId || '',
      instructorId: props.event.instructorId || '',
      classroomId: props.event.classroomId || '',
      startTime: formatDateTimeLocal(new Date(props.event.startTime)),
      endTime: formatDateTimeLocal(new Date(props.event.endTime)),
      isAllDay: props.event.isAllDay,
      color: props.event.color,
      eventType: props.event.eventType,
    };
  } else {
    const now = props.defaultStart || new Date();
    const end = props.defaultEnd || new Date(now.getTime() + 60 * 60 * 1000); // +1 час
    
    form.value = {
      title: '',
      description: '',
      groupId: '',
      instructorId: '',
      classroomId: '',
      startTime: formatDateTimeLocal(now),
      endTime: formatDateTimeLocal(end),
      isAllDay: false,
      color: 'primary',
      eventType: 'theory',
    };
  }
  errors.value = {};
};

// Валидация
const validate = (): boolean => {
  errors.value = {};

  if (!form.value.title.trim()) {
    errors.value.title = 'Название обязательно';
  }

  if (!form.value.startTime) {
    errors.value.startTime = 'Время начала обязательно';
  }

  if (!form.value.endTime) {
    errors.value.endTime = 'Время окончания обязательно';
  }

  if (form.value.startTime && form.value.endTime) {
    const start = new Date(form.value.startTime);
    const end = new Date(form.value.endTime);
    if (end <= start) {
      errors.value.endTime = 'Время окончания должно быть позже начала';
    }
  }

  return Object.keys(errors.value).length === 0;
};

// Отправка формы
const handleSubmit = async () => {
  if (!validate()) {
    notification.show({
      type: 'error',
      title: 'Ошибка валидации',
      message: 'Проверьте правильность заполнения формы',
    });
    return;
  }

  submitting.value = true;

  try {
    const data = {
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
      groupId: form.value.groupId || undefined,
      instructorId: form.value.instructorId || undefined,
      classroomId: form.value.classroomId || undefined,
      startTime: new Date(form.value.startTime).toISOString(),
      endTime: new Date(form.value.endTime).toISOString(),
      isAllDay: form.value.isAllDay,
      color: form.value.color,
      eventType: form.value.eventType,
    };

    let response;

    if (isEditMode.value && props.event) {
      response = await authFetch<{ success: boolean; event: ScheduleEvent }>(
        `/api/schedule/${props.event.id}`,
        { method: 'PUT', body: data }
      );
    } else {
      response = await authFetch<{ success: boolean; event: ScheduleEvent }>(
        '/api/schedule',
        { method: 'POST', body: data }
      );
    }

    if (response.success) {
      notification.show({
        type: 'success',
        title: isEditMode.value ? 'Событие обновлено' : 'Событие создано',
        message: `Занятие "${response.event.title}" успешно ${isEditMode.value ? 'обновлено' : 'добавлено'}`,
      });
      emit('saved', response.event);
    }
  } catch (error: any) {
    console.error('Error saving event:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || error.message || 'Не удалось сохранить событие',
    });
  } finally {
    submitting.value = false;
  }
};

// Удаление события - открытие модального окна
const handleDelete = () => {
  if (!props.event) return;
  showDeleteConfirm.value = true;
};

// Подтверждение удаления
const confirmDelete = async () => {
  if (!props.event) return;

  deleting.value = true;

  try {
    const response = await authFetch<{ success: boolean }>(
      `/api/schedule/${props.event.id}`,
      { method: 'DELETE' }
    );

    if (response.success) {
      notification.show({
        type: 'success',
        title: 'Событие удалено',
        message: 'Занятие успешно удалено из расписания',
      });
      showDeleteConfirm.value = false;
      emit('deleted', props.event.id);
    }
  } catch (error: any) {
    console.error('Error deleting event:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || error.message || 'Не удалось удалить событие',
    });
  } finally {
    deleting.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadSelectData();
    initForm();
  }
});
</script>
