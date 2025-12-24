<template>
  <div class="calendar-wrapper">
    <!-- Верхняя панель управления -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <!-- Навигация по датам -->
        <button
          @click="handlePrev"
          class="p-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          title="Назад"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <!-- Кнопка "Сегодня" -->
        <button
          @click="handleToday"
          class="px-3 py-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors text-sm font-medium"
          title="Сегодня"
        >
          Сегодня
        </button>
        
        <button
          @click="handleNext"
          class="p-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          title="Вперёд"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <!-- Кнопка добавления события -->
        <UiButton @click="openAddModal()" class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Добавить занятие
        </UiButton>
      </div>

      <!-- Заголовок с текущей датой -->
      <h2 class="text-xl font-semibold text-black dark:text-white order-first sm:order-0">
        {{ currentTitle }}
      </h2>

      <!-- Переключатель видов -->
      <div class="flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
        <button
          v-for="view in viewOptions"
          :key="view.value"
          @click="handleViewChange(view.value)"
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            currentView === view.value
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
          ]"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Фильтр по группе -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Группа
          </label>
          <div class="relative">
            <select
              v-model="filters.groupId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все группы</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.code }}
              </option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Фильтр по инструктору -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Инструктор
          </label>
          <div class="relative">
            <select
              v-model="filters.instructorId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все инструкторы</option>
              <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
                {{ instructor.fullName }}
              </option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Фильтр по аудитории -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Аудитория
          </label>
          <div class="relative">
            <select
              v-model="filters.classroomId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все аудитории</option>
              <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
                {{ classroom.name }}
              </option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Сброс фильтров -->
        <div class="flex items-end">
          <button
            v-if="hasActiveFilters"
            @click="resetFilters"
            class="w-full px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>

    <!-- Календарь -->
    <div class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 relative min-h-[500px]">
      <!-- Overlay загрузки поверх календаря -->
      <div v-if="loading" class="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-10 flex items-center justify-center rounded-lg">
        <div class="flex items-center gap-3">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <span class="text-gray-600 dark:text-gray-400">Загрузка расписания...</span>
        </div>
      </div>
      
      <!-- Подсказка о горячих клавишах -->
      <div class="mb-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-4">
        <span>💡 <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[10px]">CTRL</kbd> + перетаскивание = копирование занятия</span>
      </div>
      
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
        class="schedule-calendar"
      />
    </div>

    <!-- Модальное окно просмотра деталей события -->
    <ScheduleEventDetailModal
      :is-open="showDetailModal"
      :event="selectedEvent"
      @close="closeDetailModal"
      @edit="handleEditFromDetail"
    />

    <!-- Модальное окно создания/редактирования события -->
    <ScheduleEventModal
      :is-open="showEventModal"
      :event="editingEvent"
      :default-start="defaultEventStart"
      :default-end="defaultEventEnd"
      @close="closeEventModal"
      @saved="handleEventSaved"
      @deleted="handleEventDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import type { CalendarOptions, EventInput, EventClickArg, DateSelectArg, DatesSetArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { ScheduleEvent } from '~/types/schedule';
import { dateToLocalIsoString, formatDateOnly } from '~/utils/dateTime';

interface Group {
  id: string;
  code: string;
}

interface Instructor {
  id: string;
  fullName: string;
}

interface Classroom {
  id: string;
  name: string;
}

const { authFetch } = useAuthFetch();
const notification = useNotification();

// Настройки расписания (академические пары)
const {
  periods,
  settings: scheduleSettings,
  loadSettings: loadScheduleSettings,
  getFirstPeriodStart,
  getLastPeriodEnd,
  getNearestPeriod,
  getPeriodByTime,
} = useScheduleSettings();

// Refs
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

// State
const loading = ref(true);
const isInitialized = ref(false);
const loadingAbortController = ref<AbortController | null>(null);
const events = ref<ScheduleEvent[]>([]);
const groups = ref<Group[]>([]);
const instructors = ref<Instructor[]>([]);
const classrooms = ref<Classroom[]>([]);
const currentView = ref('dayGridMonth');
const currentTitle = ref('');
const showEventModal = ref(false);
const showDetailModal = ref(false);
const selectedEvent = ref<ScheduleEvent | null>(null);
const editingEvent = ref<ScheduleEvent | null>(null);
const defaultEventStart = ref<Date | undefined>(undefined);
const defaultEventEnd = ref<Date | undefined>(undefined);

// Храним текущий диапазон дат
const currentDateRange = ref<{ start: Date; end: Date } | null>(null);

const filters = ref({
  groupId: '',
  instructorId: '',
  classroomId: '',
});

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.groupId || filters.value.instructorId || filters.value.classroomId;
});

const viewOptions = [
  { value: 'dayGridMonth', label: 'Месяц' },
  { value: 'timeGridWeek', label: 'Неделя' },
  { value: 'timeGridDay', label: 'День' },
  { value: 'listWeek', label: 'Список' },
];

// Цвета событий
const eventColors: Record<string, { bg: string; border: string; text: string }> = {
  primary: { bg: '#3C50E0', border: '#3C50E0', text: '#ffffff' },
  success: { bg: '#10B981', border: '#10B981', text: '#ffffff' },
  warning: { bg: '#F59E0B', border: '#F59E0B', text: '#ffffff' },
  danger: { bg: '#EF4444', border: '#EF4444', text: '#ffffff' },
};

// Преобразование события для FullCalendar
const transformEventForCalendar = (event: ScheduleEvent): EventInput => {
  const defaultColors = { bg: '#3C50E0', border: '#3C50E0', text: '#ffffff' };
  const colors = eventColors[event.color] ?? defaultColors;
  
  // Формируем заголовок с аудиторией если она указана
  const titleWithClassroom = event.classroom?.name 
    ? `${event.title} (${event.classroom.name})`
    : event.title;
  
  return {
    id: event.id,
    title: titleWithClassroom,
    start: event.startTime,
    end: event.endTime,
    allDay: false,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    extendedProps: {
      description: event.description || undefined,
      groupId: event.groupId || undefined,
      groupCode: event.group?.code,
      instructorId: event.instructorId || undefined,
      instructorName: event.instructor?.fullName,
      classroomId: event.classroomId || undefined,
      classroomName: event.classroom?.name,
      eventType: event.eventType,
      color: event.color,
    },
  };
};

// Обработчики событий календаря
const onEventClick = (arg: EventClickArg) => {
  const event = events.value.find(e => e.id === arg.event.id);
  if (event) {
    selectedEvent.value = event;
    showDetailModal.value = true;
  }
};

const onDateSelect = (arg: DateSelectArg) => {
  editingEvent.value = null;
  
  // Привязка к академическим парам при выборе времени
  const shouldSnap = scheduleSettings.value.snap_to_periods === 'true';
  
  if (shouldSnap && (currentView.value === 'timeGridWeek' || currentView.value === 'timeGridDay')) {
    const startTimeStr = `${String(arg.start.getHours()).padStart(2, '0')}:${String(arg.start.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(arg.end.getHours()).padStart(2, '0')}:${String(arg.end.getMinutes()).padStart(2, '0')}`;
    
    const nearestStartPeriod = getNearestPeriod(startTimeStr);
    const nearestEndPeriod = getPeriodByTime(endTimeStr) || getNearestPeriod(endTimeStr);
    
    if (nearestStartPeriod) {
      const parts = nearestStartPeriod.startTime.split(':').map(Number);
      const startH = parts[0] ?? 0;
      const startM = parts[1] ?? 0;
      arg.start.setHours(startH, startM, 0, 0);
    }
    
    if (nearestEndPeriod) {
      const endParts = nearestEndPeriod.endTime.split(':').map(Number);
      const endH = endParts[0] ?? 0;
      const endM = endParts[1] ?? 0;
      arg.end.setHours(endH, endM, 0, 0);
    }
  }
  
  defaultEventStart.value = arg.start;
  defaultEventEnd.value = arg.end;
  showEventModal.value = true;
};

const onDatesSet = (arg: DatesSetArg) => {
  currentTitle.value = arg.view.title;
  currentView.value = arg.view.type;
  
  const prevRange = currentDateRange.value;
  currentDateRange.value = { start: arg.start, end: arg.end };
  
  // Первая инициализация
  if (!isInitialized.value) {
    isInitialized.value = true;
    // События уже могут быть загружены в onMounted — просто обновляем календарь
    if (events.value.length > 0) {
      updateCalendarEvents();
      return;
    }
  }
  
  // Загружаем только если диапазон изменился
  const rangeChanged = !prevRange || 
    formatDateOnly(arg.start) !== formatDateOnly(prevRange.start) || 
    formatDateOnly(arg.end) !== formatDateOnly(prevRange.end);
  
  if (rangeChanged) {
    loadEvents(arg.start, arg.end);
  }
};

const onEventDrop = async (info: EventDropArg) => {
  const event = events.value.find(e => e.id === info.event.id);
  if (!event) return;

  // Проверяем, был ли зажат CTRL - тогда дублируем вместо перемещения
  const isCopyMode = info.jsEvent.ctrlKey || info.jsEvent.metaKey;

  try {
    if (isCopyMode) {
      // Режим копирования - создаём новое событие
      info.revert(); // Возвращаем оригинал на место
      
      const newStartTime = info.event.start ? dateToLocalIsoString(info.event.start) : undefined;
      const newEndTime = info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(new Date(info.event.start!.getTime() + 60 * 60 * 1000));
      
      await authFetch('/api/schedule', {
        method: 'POST',
        body: {
          title: event.title,
          description: event.description,
          groupId: event.groupId,
          disciplineId: event.disciplineId,
          instructorId: event.instructorId,
          classroomId: event.classroomId,
          startTime: newStartTime,
          endTime: newEndTime,
          isAllDay: event.isAllDay,
          color: event.color,
          eventType: event.eventType,
        },
      });

      notification.show({
        type: 'success',
        title: 'Занятие скопировано',
        message: 'Создана копия занятия на новую дату/время',
      });
    } else {
      // Режим перемещения - обновляем существующее событие
      await authFetch(`/api/schedule/${event.id}`, {
        method: 'PUT',
        body: {
          startTime: info.event.start ? dateToLocalIsoString(info.event.start) : undefined,
          endTime: info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(new Date(info.event.start!.getTime() + 60 * 60 * 1000)),
        },
      });

      notification.show({
        type: 'success',
        title: 'Занятие перемещено',
        message: 'Время занятия успешно обновлено',
      });
    }

    if (currentDateRange.value) {
      loadEvents(currentDateRange.value.start, currentDateRange.value.end);
    }
  } catch (error: any) {
    console.error('Error updating event:', error);
    info.revert();
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || 'Не удалось выполнить операцию',
    });
  }
};

const onEventResize = async (info: EventResizeDoneArg) => {
  const event = events.value.find(e => e.id === info.event.id);
  if (!event) return;

  try {
    await authFetch(`/api/schedule/${event.id}`, {
      method: 'PUT',
      body: {
        endTime: info.event.end ? dateToLocalIsoString(info.event.end) : undefined,
      },
    });

    notification.show({
      type: 'success',
      title: 'Занятие обновлено',
      message: 'Длительность занятия успешно изменена',
    });

    if (currentDateRange.value) {
      loadEvents(currentDateRange.value.start, currentDateRange.value.end);
    }
  } catch (error: any) {
    console.error('Error updating event:', error);
    info.revert();
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || 'Не удалось изменить занятие',
    });
  }
};

// Вычисляемые настройки календаря на основе академических пар
const slotMinTime = computed(() => {
  const firstStart = getFirstPeriodStart.value;
  // Добавляем буфер в 30 минут до первой пары
  const parts = firstStart.split(':').map(Number);
  const h = parts[0] ?? 9;
  const m = parts[1] ?? 0;
  const bufferMinutes = h * 60 + m - 30;
  const hours = Math.floor(bufferMinutes / 60);
  const mins = bufferMinutes % 60;
  return `${String(Math.max(0, hours)).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
});

const slotMaxTime = computed(() => {
  const lastEnd = getLastPeriodEnd.value;
  // Добавляем буфер в 30 минут после последней пары
  const parts = lastEnd.split(':').map(Number);
  const h = parts[0] ?? 18;
  const m = parts[1] ?? 20;
  const bufferMinutes = h * 60 + m + 30;
  const hours = Math.floor(bufferMinutes / 60);
  const mins = bufferMinutes % 60;
  return `${String(Math.min(24, hours)).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
});

// Длительность слота - 10 минут для точной сетки
const slotDuration = computed(() => {
  return '00:10:00';
});

// Интервал меток - каждые 10 минут, но скрываем ненужные через slotLabelContent
const slotLabelInterval = computed(() => {
  return '00:10:00';
});

// Набор времён начала пар для быстрого поиска
const periodStartTimes = computed(() => {
  return new Set(periods.value.map(p => p.startTime));
});

// Набор времён окончания пар (для визуальной границы)
const periodEndTimes = computed(() => {
  return new Set(periods.value.map(p => p.endTime));
});

// Генерация кастомных меток для слотов - показываем ТОЛЬКО для начала пар
const slotLabelContent = (arg: { date: Date; text: string }) => {
  const showNumbers = scheduleSettings.value.show_period_numbers === 'true';
  
  const timeStr = `${String(arg.date.getHours()).padStart(2, '0')}:${String(arg.date.getMinutes()).padStart(2, '0')}`;
  const period = periods.value.find(p => p.startTime === timeStr);
  
  // Если это начало пары - показываем метку
  if (period) {
    if (showNumbers) {
      // Показываем номер пары и время с диапазоном
      return {
        html: `<div class="slot-label-period">
          <span class="period-badge">${period.periodNumber}</span>
          <div class="period-info">
            <span class="period-time-main">${period.startTime}</span>
            <span class="period-time-end">–${period.endTime}</span>
          </div>
        </div>`
      };
    }
    // Просто время начала пары
    return {
      html: `<span class="period-time-start">${arg.text}</span>`
    };
  }
  
  // Для всех остальных слотов - скрываем текст, но оставляем пустой контейнер для структуры
  // Возвращаем пустую строку, чтобы скрыть ненужные метки
  return '';
};

// Привязка событий к академическим парам при перетаскивании
const snapToGrid = (date: Date): Date => {
  const shouldSnap = scheduleSettings.value.snap_to_periods === 'true';
  if (!shouldSnap) return date;
  
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const nearestPeriod = getNearestPeriod(timeStr);
  
  if (nearestPeriod) {
    const parts = nearestPeriod.startTime.split(':').map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const newDate = new Date(date);
    newDate.setHours(h, m, 0, 0);
    return newDate;
  }
  
  return date;
};

// ДИНАМИЧЕСКИЕ опции календаря - используем computed
const calendarOptions = computed<CalendarOptions>(() => {
  // Длительность пары для привязки при перетаскивании
  const periodDuration = parseInt(scheduleSettings.value.period_duration_minutes || '40', 10);
  const snapDurationValue = `00:${String(periodDuration).padStart(2, '0')}:00`;
  
  return {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: ruLocale,
    headerToolbar: false,
    height: 'auto',
    timeZone: 'local', // Используем локальное время для избежания сдвига дат
    
    // События будут управляться через API календаря
    events: [],
    
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: 3,
    moreLinkClick: 'popover',
    weekends: true,
    nowIndicator: true,
    slotMinTime: slotMinTime.value,
    slotMaxTime: slotMaxTime.value,
    slotDuration: slotDuration.value,
    slotLabelInterval: slotLabelInterval.value,
    allDaySlot: false,
    
    // Привязка к сетке при перетаскивании - привязываем к длительности пары
    snapDuration: snapDurationValue,
    
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    
    // Кастомные метки слотов с номерами пар
    slotLabelContent,
    
    eventClick: onEventClick,
    select: onDateSelect,
    datesSet: onDatesSet,
    eventDrop: onEventDrop,
    eventResize: onEventResize,
  };
});

// Навигация
const handlePrev = () => {
  const api = calendarRef.value?.getApi();
  api?.prev();
};

const handleNext = () => {
  const api = calendarRef.value?.getApi();
  api?.next();
};

const handleToday = () => {
  const api = calendarRef.value?.getApi();
  api?.today();
};

const handleViewChange = (view: string) => {
  currentView.value = view;
  const api = calendarRef.value?.getApi();
  api?.changeView(view);
};

// Загрузка событий
const loadEvents = async (start?: Date, end?: Date) => {
  if (loadingAbortController.value) {
    loadingAbortController.value.abort();
  }
  
  const controller = new AbortController();
  loadingAbortController.value = controller;
  
  loading.value = true;
  
  try {
    const api = calendarRef.value?.getApi();
    const viewStart = start || api?.view.activeStart;
    const viewEnd = end || api?.view.activeEnd;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const params = new URLSearchParams();
    params.append('startDate', formatDateOnly(viewStart || defaultStart));
    params.append('endDate', formatDateOnly(viewEnd || defaultEnd));
    if (filters.value.groupId) params.append('groupId', filters.value.groupId);
    if (filters.value.instructorId) params.append('instructorId', filters.value.instructorId);
    if (filters.value.classroomId) params.append('classroomId', filters.value.classroomId);

    const response = await authFetch<{ success: boolean; events: ScheduleEvent[] }>(
      `/api/schedule?${params.toString()}`,
      { signal: controller.signal }
    );

    if (controller.signal.aborted) {
      return;
    }

    if (response.success) {
      events.value = response.events;
      
      // Обновляем события в календаре через API
      updateCalendarEvents();
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return;
    }
    
    console.error('Error loading events:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось загрузить расписание',
    });
  } finally {
    if (loadingAbortController.value === controller) {
      loading.value = false;
    }
  }
};

// Обновление событий в календаре через API (без дубликатов)
const updateCalendarEvents = () => {
  const api = calendarRef.value?.getApi();
  if (!api) return;
  
  // Сначала удаляем все существующие события
  api.removeAllEvents();
  
  // Затем добавляем новые
  const transformedEvents = events.value.map(transformEventForCalendar);
  transformedEvents.forEach(event => {
    api.addEvent(event);
  });
};

const openAddModal = (start?: Date) => {
  editingEvent.value = null;
  defaultEventStart.value = start || new Date();
  defaultEventEnd.value = new Date((start || new Date()).getTime() + 90 * 60 * 1000);
  showEventModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedEvent.value = null;
};

const handleEditFromDetail = (event: ScheduleEvent) => {
  // Закрываем модальное окно деталей и открываем окно редактирования
  showDetailModal.value = false;
  editingEvent.value = event;
  showEventModal.value = true;
};

const closeEventModal = () => {
  showEventModal.value = false;
  editingEvent.value = null;
  defaultEventStart.value = undefined;
  defaultEventEnd.value = undefined;
};

const handleEventSaved = () => {
  closeEventModal();
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const handleEventDeleted = () => {
  closeEventModal();
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const handleFilterChange = () => {
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const resetFilters = () => {
  filters.value = {
    groupId: '',
    instructorId: '',
    classroomId: '',
  };
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const loadSelectData = async () => {
  try {
    const [groupsResponse, instructorsResponse, classroomsResponse] = await Promise.all([
      authFetch<{ success: boolean; groups: any[] }>('/api/groups?limit=1000&isActive=true'),
      authFetch<{ success: boolean; instructors: Instructor[] }>('/api/instructors?limit=1000&isActive=true'),
      authFetch<{ success: boolean; classrooms: Classroom[] }>('/api/classrooms'),
    ]);

    if (groupsResponse.success && groupsResponse.groups) {
      groups.value = groupsResponse.groups.map(g => ({
        id: g.id,
        code: g.code,
      }));
    }

    if (instructorsResponse.success && instructorsResponse.instructors) {
      instructors.value = instructorsResponse.instructors;
    }

    if (classroomsResponse.success) {
      classrooms.value = classroomsResponse.classrooms;
    }
  } catch (error) {
    console.error('Error loading select data:', error);
  }
};

// Lifecycle
onMounted(async () => {
  // Вычисляем диапазон дат для текущего месяца заранее
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Загружаем ВСЁ параллельно для мгновенной загрузки
  await Promise.all([
    loadScheduleSettings(),
    loadSelectData(),
    // Предзагружаем события для текущего месяца
    loadEvents(monthStart, monthEnd),
  ]);
  
  // Устанавливаем флаг инициализации если FullCalendar ещё не сделал это
  if (!isInitialized.value) {
    isInitialized.value = true;
  }
  
  // Если события загрузились раньше календаря — обновляем когда календарь готов
  nextTick(() => {
    updateCalendarEvents();
  });
});

onUnmounted(() => {
  if (loadingAbortController.value) {
    loadingAbortController.value.abort();
  }
});
</script>

<style>
/* Кастомизация FullCalendar */
.schedule-calendar {
  --fc-border-color: #e2e8f0;
  --fc-today-bg-color: rgba(60, 80, 224, 0.05);
  --fc-neutral-bg-color: transparent;
  --fc-page-bg-color: transparent;
  --fc-event-border-color: transparent;
}

.dark .schedule-calendar {
  --fc-border-color: #3d4d5f;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  color: #aeb7c0;
}

.schedule-calendar .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.schedule-calendar .fc-button {
  background-color: transparent;
  border: 1px solid #e2e8f0;
  color: #374151;
  padding: 0.5rem 1rem;
  font-weight: 500;
}

.dark .schedule-calendar .fc-button {
  border-color: #3d4d5f;
  color: #aeb7c0;
}

.schedule-calendar .fc-button:hover {
  background-color: #f3f4f6;
}

.dark .schedule-calendar .fc-button:hover {
  background-color: #313d4a;
}

.schedule-calendar .fc-button-active {
  background-color: #3C50E0 !important;
  color: white !important;
  border-color: #3C50E0 !important;
}

.schedule-calendar .fc-daygrid-day-number,
.schedule-calendar .fc-col-header-cell-cushion {
  color: #374151;
  text-decoration: none;
}

.dark .schedule-calendar .fc-daygrid-day-number,
.dark .schedule-calendar .fc-col-header-cell-cushion {
  color: #aeb7c0;
}

.schedule-calendar .fc-event {
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.8125rem;
  overflow: hidden;
  border: none !important;
  padding: 2px 4px;
}

.schedule-calendar .fc-event:hover {
  opacity: 0.9;
}

.schedule-calendar .fc-timegrid-event {
  border-radius: 4px !important;
  min-height: 20px;
}

.schedule-calendar .fc-timegrid-event .fc-event-main {
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.schedule-calendar .fc-timegrid-event .fc-event-time {
  font-size: 0.75rem;
  font-weight: 600;
}

.schedule-calendar .fc-timegrid-event .fc-event-title {
  font-size: 0.8125rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedule-calendar .fc-timegrid-slot {
  height: 2.5rem;
}

.schedule-calendar .fc-timegrid-slot-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.dark .schedule-calendar .fc-timegrid-slot-label {
  color: #9ca3af;
}

.schedule-calendar .fc-daygrid-day.fc-day-today {
  background-color: rgba(60, 80, 224, 0.05);
}

.schedule-calendar .fc-timegrid-col.fc-day-today {
  background-color: rgba(60, 80, 224, 0.03);
}

.schedule-calendar .fc-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.dark .schedule-calendar .fc-list {
  border-color: #3d4d5f;
}

.schedule-calendar .fc-list-day-cushion {
  background-color: #f9fafb;
  padding: 8px 12px;
}

.dark .schedule-calendar .fc-list-day-cushion {
  background-color: #24303f;
}

.schedule-calendar .fc-list-event:hover td {
  background-color: #f3f4f6;
}

.dark .schedule-calendar .fc-list-event:hover td {
  background-color: #313d4a;
}

.schedule-calendar .fc-list-event-title {
  font-weight: 500;
}

.schedule-calendar .fc-list-event-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .schedule-calendar .fc-list-event-time {
  color: #9ca3af;
}

.schedule-calendar .fc-list-event-dot {
  border-radius: 50%;
}

.schedule-calendar .fc-col-header-cell {
  padding: 8px 0;
  font-weight: 600;
}

.schedule-calendar .fc-timegrid-now-indicator-line {
  border-color: #EF4444;
  border-width: 2px;
}

.schedule-calendar .fc-timegrid-now-indicator-arrow {
  border-color: #EF4444;
  border-top-color: transparent;
  border-bottom-color: transparent;
}

.schedule-calendar .fc-popover {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
}

.dark .schedule-calendar .fc-popover {
  background: #1c2434;
  border-color: #3d4d5f;
}

.schedule-calendar .fc-popover-header {
  background: #f9fafb;
  padding: 8px 12px;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.dark .schedule-calendar .fc-popover-header {
  background: #24303f;
  border-color: #3d4d5f;
}

.schedule-calendar .fc-list-empty {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.dark .schedule-calendar .fc-list-empty {
  color: #9ca3af;
}

.schedule-calendar .fc-daygrid-event {
  margin-top: 1px;
  margin-bottom: 1px;
}

.schedule-calendar .fc-daygrid-event .fc-event-main {
  padding: 1px 4px;
}

.schedule-calendar .fc-daygrid-event .fc-event-time {
  font-size: 0.7rem;
  margin-right: 4px;
}

.schedule-calendar .fc-daygrid-event .fc-event-title {
  font-size: 0.75rem;
  font-weight: 500;
}

/* ============================================
   СТИЛИ ДЛЯ АКАДЕМИЧЕСКИХ ПАР В КАЛЕНДАРЕ
   ============================================ */

/* Метки слотов (время начала пар) */
.schedule-calendar .slot-label-period {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  background: rgba(60, 80, 224, 0.08);
  border-radius: 6px;
  margin: 1px 0;
}

.dark .schedule-calendar .slot-label-period {
  background: rgba(60, 80, 224, 0.15);
}

/* Бейдж с номером пары */
.schedule-calendar .period-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #3C50E0 0%, #5B6EF0 100%);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(60, 80, 224, 0.3);
}

/* Информация о времени пары */
.schedule-calendar .period-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.schedule-calendar .period-time-main {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.dark .schedule-calendar .period-time-main {
  color: #e5e7eb;
}

.schedule-calendar .period-time-end {
  font-size: 0.65rem;
  color: #6b7280;
}

.dark .schedule-calendar .period-time-end {
  color: #9ca3af;
}

/* Время начала пары (без номера) */
.schedule-calendar .period-time-start {
  font-weight: 600;
  color: #3C50E0;
}

.dark .schedule-calendar .period-time-start {
  color: #5B6EF0;
}

/* Расширяем слоты с метками для лучшего отображения */
.schedule-calendar .fc-timegrid-slot-label-frame {
  min-width: 75px;
}

/* Скрываем пустые метки (промежуточные слоты) */
.schedule-calendar .fc-timegrid-slot-label-cushion:empty {
  display: none;
}

/* Улучшенная граница между периодами */
.schedule-calendar .fc-timegrid-slot {
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.dark .schedule-calendar .fc-timegrid-slot {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

/* Выделяем строки с номерами пар */
.schedule-calendar .fc-timegrid-slot-label:has(.slot-label-period) {
  background: transparent !important;
}

.schedule-calendar .fc-timegrid-slot-label:has(.slot-label-period) + td.fc-timegrid-slot-lane,
.schedule-calendar .fc-timegrid-slot:has(.slot-label-period) ~ .fc-timegrid-slot-lane {
  border-top: 1px solid rgba(60, 80, 224, 0.2) !important;
}

/* ============================================
   РАЗДЕЛИТЕЛЬ БОЛЬШОГО ПЕРЕРЫВА (ОБЕД)
   ============================================ */

/* Визуальное разделение после большого перерыва - 7 пара в 14:00 */
.schedule-calendar .fc-timegrid-slot[data-time="14:00:00"],
.schedule-calendar .fc-timegrid-slot-lane[data-time="14:00:00"] {
  border-top: 3px solid #f59e0b !important;
  position: relative;
}

/* Метка перерыва после 6й пары */
.schedule-calendar .fc-timegrid-slot-label[data-time="13:20:00"]::after {
  content: '🍽️ Обед';
  display: block;
  font-size: 0.6rem;
  color: #f59e0b;
  font-weight: 600;
  margin-top: 4px;
  padding: 2px 4px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 4px;
}

/* ============================================
   УСТАРЕВШИЕ СТИЛИ (для обратной совместимости)
   ============================================ */

/* Старые кастомные метки */
.schedule-calendar .slot-label-custom {
  display: flex;
  align-items: center;
  gap: 6px;
}

.schedule-calendar .slot-label-custom .period-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #3C50E0 0%, #5B6EF0 100%);
  color: white;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.schedule-calendar .slot-label-custom .period-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.dark .schedule-calendar .slot-label-custom .period-time {
  color: #9ca3af;
}
</style>
