<template>
  <UiModal
    :is-open="isOpen"
    :title="isEditMode ? 'Редактировать занятие' : 'Добавить занятие'"
    size="xl"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- ШАГ 1: Выбор группы -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Учебная группа <span class="text-danger">*</span>
        </label>
        <div class="relative">
          <select
            v-model="form.groupId"
            @change="handleGroupChange"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
            :class="{ 'border-danger': errors.groupId }"
          >
            <option value="">Выберите группу</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.code }} — {{ group.courseName }}
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p v-if="errors.groupId" class="mt-1 text-sm text-danger">{{ errors.groupId }}</p>
        
        <!-- Информация о датах группы -->
        <div v-if="selectedGroupInfo" class="mt-2 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Период обучения:</span>
            {{ formatDate(selectedGroupInfo.startDate) }} — {{ formatDate(selectedGroupInfo.endDate) }}
          </p>
        </div>
      </div>

      <!-- ШАГ 2: Выбор дисциплины (зависит от группы) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Дисциплина <span class="text-danger">*</span>
        </label>
        <div class="relative">
          <select
            v-model="form.disciplineId"
            @change="handleDisciplineChange"
            :disabled="!form.groupId || loadingDisciplines"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{ 'border-danger': errors.disciplineId }"
          >
            <option value="">{{ !form.groupId ? 'Сначала выберите группу' : 'Выберите дисциплину' }}</option>
            <option v-for="discipline in disciplines" :key="discipline.id" :value="discipline.id">
              {{ discipline.name }}
            </option>
          </select>
          <svg v-if="!loadingDisciplines" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          <div v-else class="absolute right-3 top-1/2 -translate-y-1/2">
            <div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          </div>
        </div>
        <p v-if="errors.disciplineId" class="mt-1 text-sm text-danger">{{ errors.disciplineId }}</p>

        <!-- Информация о часах дисциплины -->
        <div v-if="selectedDiscipline" class="mt-2 p-3 bg-gray-50 dark:bg-meta-4 rounded-lg space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Оставшиеся часы:</p>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center p-2 rounded-lg" :class="getHoursClass('theory')">
              <div class="text-xs text-gray-500 dark:text-gray-400">Теория</div>
              <div class="font-semibold">
                {{ selectedDiscipline.remainingHours.theory }} / {{ selectedDiscipline.totalHours.theory }} ч.
              </div>
            </div>
            <div class="text-center p-2 rounded-lg" :class="getHoursClass('practice')">
              <div class="text-xs text-gray-500 dark:text-gray-400">Практика</div>
              <div class="font-semibold">
                {{ selectedDiscipline.remainingHours.practice }} / {{ selectedDiscipline.totalHours.practice }} ч.
              </div>
            </div>
            <div class="text-center p-2 rounded-lg" :class="getHoursClass('assessment')">
              <div class="text-xs text-gray-500 dark:text-gray-400">Проверка знаний</div>
              <div class="font-semibold">
                {{ selectedDiscipline.remainingHours.assessment }} / {{ selectedDiscipline.totalHours.assessment }} ч.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ШАГ 3: Тип события (определяет какие часы списываются) -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Тип занятия <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.eventType"
              @change="validateHours"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              :class="{ 'border-danger': errors.eventType }"
            >
              <option value="theory">Теория</option>
              <option value="practice">Практика</option>
              <option value="assessment">Проверка знаний</option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <p v-if="errors.eventType" class="mt-1 text-sm text-danger">{{ errors.eventType }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Цвет
          </label>
          <div class="flex gap-3 py-2">
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

      <!-- ШАГ 4: Выбор инструктора (зависит от дисциплины) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Инструктор <span class="text-danger">*</span>
        </label>
        <div class="relative">
          <select
            v-model="form.instructorId"
            :disabled="!form.disciplineId"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{ 'border-danger': errors.instructorId }"
          >
            <option value="">{{ !form.disciplineId ? 'Сначала выберите дисциплину' : 'Выберите инструктора' }}</option>
            <option 
              v-for="instructor in disciplineInstructors" 
              :key="instructor.id" 
              :value="instructor.id"
            >
              {{ instructor.fullName }}{{ instructor.isPrimary ? ' (основной)' : '' }}
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p v-if="errors.instructorId" class="mt-1 text-sm text-danger">{{ errors.instructorId }}</p>
        <p v-if="form.disciplineId && disciplineInstructors.length === 0" class="mt-1 text-sm text-warning">
          У этой дисциплины нет назначенных инструкторов
        </p>
      </div>

      <!-- ШАГ 5: Дата занятия -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Дата занятия <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.date"
          type="date"
          :min="selectedGroupInfo?.startDate"
          :max="selectedGroupInfo?.endDate"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          :class="{ 'border-danger': errors.date }"
        />
        <p v-if="errors.date" class="mt-1 text-sm text-danger">{{ errors.date }}</p>
      </div>

      <!-- ШАГ 6: Выбор времени (пары или точное время) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Время занятия <span class="text-danger">*</span>
        </label>

        <!-- Переключатель режима выбора времени -->
        <div class="flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden mb-4">
          <button
            type="button"
            @click="timeMode = 'pairs'"
            class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              timeMode === 'pairs'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
            ]"
          >
            По парам
          </button>
          <button
            type="button"
            @click="timeMode = 'exact'"
            class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              timeMode === 'exact'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
            ]"
          >
            Точное время
          </button>
        </div>

        <!-- Режим: Пары -->
        <div v-if="timeMode === 'pairs'" class="space-y-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Выберите одну или несколько пар (можно выбрать несколько подряд)
          </p>
          <div class="grid grid-cols-4 gap-2">
            <label
              v-for="pair in lessonPairs"
              :key="pair.number"
              class="relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all"
              :class="[
                selectedPairs.includes(pair.number)
                  ? 'border-primary bg-primary/10 dark:bg-primary/20'
                  : 'border-stroke dark:border-strokedark hover:border-primary/50'
              ]"
            >
              <input
                type="checkbox"
                :value="pair.number"
                v-model="selectedPairs"
                @change="handlePairChange"
                class="sr-only"
              />
              <div class="text-center">
                <div class="text-sm font-medium">{{ pair.number }} пара</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ pair.startTime }} - {{ pair.endTime }}
                </div>
              </div>
              <div
                v-if="selectedPairs.includes(pair.number)"
                class="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
              >
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </label>
          </div>
          
          <!-- Отображение итогового времени при выборе пар -->
          <div v-if="selectedPairs.length > 0" class="p-3 bg-success/10 dark:bg-success/20 rounded-lg">
            <p class="text-sm">
              <span class="font-medium">Выбрано:</span>
              {{ selectedPairs.length }} {{ getPairWord(selectedPairs.length) }}
              ({{ computedDuration }} ч.) • {{ computedTimeRange }}
            </p>
          </div>
        </div>

        <!-- Режим: Точное время -->
        <div v-else class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Начало</label>
            <input
              v-model="form.startTime"
              type="time"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              :class="{ 'border-danger': errors.startTime }"
            />
            <p v-if="errors.startTime" class="mt-1 text-sm text-danger">{{ errors.startTime }}</p>
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Окончание</label>
            <input
              v-model="form.endTime"
              type="time"
              class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              :class="{ 'border-danger': errors.endTime }"
            />
            <p v-if="errors.endTime" class="mt-1 text-sm text-danger">{{ errors.endTime }}</p>
          </div>
        </div>

        <p v-if="errors.time" class="mt-1 text-sm text-danger">{{ errors.time }}</p>
        
        <!-- Предупреждение о превышении часов -->
        <div v-if="hoursWarning" class="mt-2 p-3 bg-warning/10 dark:bg-warning/20 rounded-lg border border-warning/30">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-sm text-warning">{{ hoursWarning }}</p>
          </div>
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

      <!-- Описание -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Описание / Заметки
        </label>
        <textarea
          v-model="form.description"
          rows="2"
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
          <UiButton @click="handleSubmit" :disabled="submitting || !!hoursWarning">
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
    :message="`Вы уверены, что хотите удалить это занятие?`"
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

interface Discipline {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  orderIndex: number;
  totalHours: {
    theory: number;
    practice: number;
    assessment: number;
  };
  usedHours: {
    theory: number;
    practice: number;
    assessment: number;
  };
  remainingHours: {
    theory: number;
    practice: number;
    assessment: number;
  };
  instructors: Array<{
    id: string;
    fullName: string;
    email: string | null;
    isPrimary: boolean;
  }>;
}

interface GroupInfo {
  id: string;
  courseId: string;
  startDate: string;
  endDate: string;
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

// ===================
// ДАННЫЕ ДЛЯ СЕЛЕКТОВ
// ===================

const groups = ref<Group[]>([]);
const disciplines = ref<Discipline[]>([]);
const classrooms = ref<Classroom[]>([]);
const selectedGroupInfo = ref<GroupInfo | null>(null);
const loadingDisciplines = ref(false);

// ===================
// ПАРЫ (LESSON PAIRS)
// ===================

const lessonPairs = [
  { number: 1, startTime: '08:30', endTime: '09:50' },
  { number: 2, startTime: '10:00', endTime: '11:20' },
  { number: 3, startTime: '11:30', endTime: '12:50' },
  { number: 4, startTime: '13:20', endTime: '14:40' },
  { number: 5, startTime: '14:50', endTime: '16:10' },
  { number: 6, startTime: '16:20', endTime: '17:40' },
  { number: 7, startTime: '17:50', endTime: '19:10' },
  { number: 8, startTime: '19:20', endTime: '20:40' },
];

const timeMode = ref<'pairs' | 'exact'>('pairs');
const selectedPairs = ref<number[]>([]);

// ===================
// ФОРМА
// ===================

const form = ref({
  groupId: '',
  disciplineId: '',
  instructorId: '',
  classroomId: '',
  eventType: 'theory' as ScheduleEventType,
  color: 'primary' as ScheduleEventColor,
  date: '',
  startTime: '',
  endTime: '',
  description: '',
});

const errors = ref<Record<string, string>>({});
const submitting = ref(false);
const showDeleteConfirm = ref(false);
const deleting = ref(false);
const hoursWarning = ref<string | null>(null);

// ===================
// COMPUTED
// ===================

const isEditMode = computed(() => !!props.event);

const selectedDiscipline = computed(() => {
  if (!form.value.disciplineId) return null;
  return disciplines.value.find(d => d.id === form.value.disciplineId) || null;
});

const disciplineInstructors = computed(() => {
  return selectedDiscipline.value?.instructors || [];
});

const computedTimeRange = computed(() => {
  if (selectedPairs.value.length === 0) return '';
  
  const sorted = [...selectedPairs.value].sort((a, b) => a - b);
  const first = lessonPairs.find(p => p.number === sorted[0]);
  const last = lessonPairs.find(p => p.number === sorted[sorted.length - 1]);
  
  if (!first || !last) return '';
  return `${first.startTime} - ${last.endTime}`;
});

const computedDuration = computed(() => {
  if (timeMode.value === 'pairs') {
    // Каждая пара = 1.5 академических часа (90 минут / 45 = 2 ак. часа)
    return selectedPairs.value.length * 2;
  }
  
  if (!form.value.startTime || !form.value.endTime) return 0;
  
  const startParts = form.value.startTime.split(':').map(Number);
  const endParts = form.value.endTime.split(':').map(Number);
  
  const startH = startParts[0] ?? 0;
  const startM = startParts[1] ?? 0;
  const endH = endParts[0] ?? 0;
  const endM = endParts[1] ?? 0;
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (endMinutes <= startMinutes) return 0;
  
  // Переводим в академические часы (1 ак. час = 45 минут)
  return Math.ceil((endMinutes - startMinutes) / 45);
});

// ===================
// ОПЦИИ
// ===================

const colorOptions = [
  { value: 'primary' as ScheduleEventColor, bg: 'bg-primary', label: 'Синий' },
  { value: 'success' as ScheduleEventColor, bg: 'bg-success', label: 'Зелёный' },
  { value: 'warning' as ScheduleEventColor, bg: 'bg-warning', label: 'Оранжевый' },
  { value: 'danger' as ScheduleEventColor, bg: 'bg-danger', label: 'Красный' },
];

// ===================
// МЕТОДЫ
// ===================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getPairWord = (count: number): string => {
  if (count === 1) return 'пара';
  if (count >= 2 && count <= 4) return 'пары';
  return 'пар';
};

const getHoursClass = (type: 'theory' | 'practice' | 'assessment'): string => {
  if (!selectedDiscipline.value) return 'bg-gray-100 dark:bg-boxdark';
  
  const remaining = selectedDiscipline.value.remainingHours[type];
  const total = selectedDiscipline.value.totalHours[type];
  
  if (total === 0) return 'bg-gray-100 dark:bg-boxdark';
  if (remaining === 0) return 'bg-danger/10 text-danger';
  if (remaining <= total * 0.2) return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
};

// Загрузка групп
const loadGroups = async () => {
  try {
    const response = await authFetch<{ success: boolean; groups: any[] }>('/api/groups?limit=1000&isActive=true');
    if (response.success && response.groups) {
      groups.value = response.groups.map(g => ({
        id: g.id,
        code: g.code,
        courseName: g.course?.name || '',
      }));
    }
  } catch (error) {
    console.error('Error loading groups:', error);
  }
};

// Загрузка аудиторий
const loadClassrooms = async () => {
  try {
    const response = await authFetch<{ success: boolean; classrooms: Classroom[] }>('/api/classrooms');
    if (response.success) {
      classrooms.value = response.classrooms;
    }
  } catch (error) {
    console.error('Error loading classrooms:', error);
  }
};

// Загрузка дисциплин группы
const loadGroupDisciplines = async (groupId: string) => {
  if (!groupId) {
    disciplines.value = [];
    selectedGroupInfo.value = null;
    return;
  }

  loadingDisciplines.value = true;
  try {
    const response = await authFetch<{ 
      success: boolean; 
      disciplines: Discipline[]; 
      group: GroupInfo;
    }>(`/api/groups/${groupId}/disciplines`);
    
    if (response.success) {
      disciplines.value = response.disciplines;
      selectedGroupInfo.value = response.group;
    }
  } catch (error) {
    console.error('Error loading group disciplines:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось загрузить дисциплины группы',
    });
  } finally {
    loadingDisciplines.value = false;
  }
};

// Обработчик смены группы
const handleGroupChange = () => {
  form.value.disciplineId = '';
  form.value.instructorId = '';
  disciplines.value = [];
  
  if (form.value.groupId) {
    loadGroupDisciplines(form.value.groupId);
  } else {
    selectedGroupInfo.value = null;
  }
  
  validateHours();
};

// Обработчик смены дисциплины
const handleDisciplineChange = () => {
  form.value.instructorId = '';
  
  // Автовыбор основного инструктора
  if (selectedDiscipline.value?.instructors.length) {
    const primary = selectedDiscipline.value.instructors.find(i => i.isPrimary);
    if (primary) {
      form.value.instructorId = primary.id;
    }
  }
  
  validateHours();
};

// Обработчик выбора пар
const handlePairChange = () => {
  // Сортируем выбранные пары
  selectedPairs.value.sort((a, b) => a - b);
  validateHours();
};

// Валидация часов
const validateHours = () => {
  hoursWarning.value = null;
  
  if (!selectedDiscipline.value || !form.value.eventType) return;
  
  const eventType = form.value.eventType;
  
  // Проверяем, что тип события поддерживает часы (не 'other')
  if (eventType !== 'theory' && eventType !== 'practice' && eventType !== 'assessment') {
    return;
  }
  
  const remainingHours = selectedDiscipline.value.remainingHours[eventType];
  const plannedHours = computedDuration.value;
  
  if (plannedHours > remainingHours) {
    const typeNames: Record<'theory' | 'practice' | 'assessment', string> = {
      theory: 'теории',
      practice: 'практики',
      assessment: 'проверки знаний',
    };
    hoursWarning.value = `Превышение лимита часов! Для ${typeNames[eventType]} осталось ${remainingHours} ч., а запланировано ${plannedHours} ч.`;
  }
};

// Валидация формы
const validate = (): boolean => {
  errors.value = {};

  if (!form.value.groupId) {
    errors.value.groupId = 'Выберите группу';
  }

  if (!form.value.disciplineId) {
    errors.value.disciplineId = 'Выберите дисциплину';
  }

  if (!form.value.instructorId) {
    errors.value.instructorId = 'Выберите инструктора';
  }

  if (!form.value.date) {
    errors.value.date = 'Укажите дату занятия';
  } else if (selectedGroupInfo.value) {
    const date = form.value.date;
    if (date < selectedGroupInfo.value.startDate || date > selectedGroupInfo.value.endDate) {
      errors.value.date = 'Дата должна быть в пределах периода обучения группы';
    }
  }

  if (timeMode.value === 'pairs') {
    if (selectedPairs.value.length === 0) {
      errors.value.time = 'Выберите хотя бы одну пару';
    }
  } else {
    if (!form.value.startTime) {
      errors.value.startTime = 'Укажите время начала';
    }
    if (!form.value.endTime) {
      errors.value.endTime = 'Укажите время окончания';
    }
    if (form.value.startTime && form.value.endTime && form.value.endTime <= form.value.startTime) {
      errors.value.endTime = 'Время окончания должно быть позже начала';
    }
  }

  if (hoursWarning.value) {
    errors.value.time = 'Исправьте превышение лимита часов';
  }

  return Object.keys(errors.value).length === 0;
};

// Вспомогательная функция для создания ISO строки с сохранением локального времени
const toLocalISOString = (dateStr: string, timeStr: string): string => {
  // dateStr = "2025-12-23", timeStr = "10:00"
  // Создаём ISO строку напрямую, без конвертации в UTC
  return `${dateStr}T${timeStr}:00.000Z`;
};

// Формирование данных для отправки
const getSubmitData = () => {
  let startTimeStr: string;
  let endTimeStr: string;

  if (timeMode.value === 'pairs') {
    const sorted = [...selectedPairs.value].sort((a, b) => a - b);
    const first = lessonPairs.find(p => p.number === sorted[0])!;
    const last = lessonPairs.find(p => p.number === sorted[sorted.length - 1])!;
    
    startTimeStr = toLocalISOString(form.value.date, first.startTime);
    endTimeStr = toLocalISOString(form.value.date, last.endTime);
  } else {
    startTimeStr = toLocalISOString(form.value.date, form.value.startTime);
    endTimeStr = toLocalISOString(form.value.date, form.value.endTime);
  }

  // Название занятия = название дисциплины
  const title = selectedDiscipline.value?.name || 'Занятие';

  return {
    title,
    description: form.value.description.trim() || undefined,
    groupId: form.value.groupId,
    disciplineId: form.value.disciplineId,
    instructorId: form.value.instructorId,
    classroomId: form.value.classroomId || undefined,
    startTime: startTimeStr,
    endTime: endTimeStr,
    isAllDay: false,
    color: form.value.color,
    eventType: form.value.eventType,
  };
};

// Отправка формы
const handleSubmit = async () => {
  // Защита от двойного клика
  if (submitting.value) {
    return;
  }
  
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
    const data = getSubmitData();
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
        title: isEditMode.value ? 'Занятие обновлено' : 'Занятие создано',
        message: `Занятие "${response.event.title}" успешно ${isEditMode.value ? 'обновлено' : 'добавлено'}`,
      });
      emit('saved', response.event);
    }
  } catch (error: any) {
    console.error('Error saving event:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || error.message || 'Не удалось сохранить занятие',
    });
  } finally {
    submitting.value = false;
  }
};

// Удаление
const handleDelete = () => {
  if (!props.event) return;
  showDeleteConfirm.value = true;
};

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
        title: 'Занятие удалено',
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
      message: error.data?.statusMessage || error.message || 'Не удалось удалить занятие',
    });
  } finally {
    deleting.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

// Инициализация формы
const initForm = () => {
  timeMode.value = 'pairs';
  selectedPairs.value = [];
  hoursWarning.value = null;
  errors.value = {};

  if (props.event) {
    // Редактирование существующего
    // Извлекаем дату и время напрямую из ISO строки без конвертации часовых поясов
    // props.event.startTime = "2025-12-23T10:00:00.000Z"
    const startTimeStr = props.event.startTime;
    const endTimeStr = props.event.endTime;
    
    // Парсим ISO строку напрямую
    const datePart = startTimeStr.substring(0, 10); // "2025-12-23"
    const startTimePart = startTimeStr.substring(11, 16); // "10:00"
    const endTimePart = endTimeStr.substring(11, 16); // "11:20"
    
    form.value = {
      groupId: props.event.groupId || '',
      disciplineId: props.event.disciplineId || '',
      instructorId: props.event.instructorId || '',
      classroomId: props.event.classroomId || '',
      eventType: props.event.eventType,
      color: props.event.color,
      date: datePart,
      startTime: startTimePart,
      endTime: endTimePart,
      description: props.event.description || '',
    };

    // Загружаем дисциплины если есть группа
    if (form.value.groupId) {
      loadGroupDisciplines(form.value.groupId);
    }

    // Переключаем на точное время для редактирования
    timeMode.value = 'exact';
  } else {
    // Создание нового
    const now = props.defaultStart ?? new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    form.value = {
      groupId: '',
      disciplineId: '',
      instructorId: '',
      classroomId: '',
      eventType: 'theory',
      color: 'primary',
      date: dateStr,
      startTime: '',
      endTime: '',
      description: '',
    };

    disciplines.value = [];
    selectedGroupInfo.value = null;
  }
};

// ===================
// WATCHERS
// ===================

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadGroups();
    loadClassrooms();
    initForm();
  }
});

// Пересчёт часов при изменении времени или типа
watch([() => form.value.startTime, () => form.value.endTime, () => selectedPairs.value.length], () => {
  validateHours();
});
</script>
