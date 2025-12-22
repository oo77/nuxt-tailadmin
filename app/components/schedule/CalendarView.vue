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
      <h2 class="text-xl font-semibold text-black dark:text-white">
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
    <div class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка расписания...</span>
      </div>
      
      <FullCalendar
        v-else
        ref="calendarRef"
        :options="calendarOptions"
        class="schedule-calendar"
      />
    </div>

    <!-- Модальное окно события -->
    <ScheduleEventModal
      :is-open="showEventModal"
      :event="selectedEvent"
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
import type { CalendarOptions, EventClickArg, DateSelectArg, DatesSetArg } from '@fullcalendar/core';
import type { ScheduleEvent, CalendarEvent, EVENT_COLORS } from '~/types/schedule';

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

// Refs
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

// State
const loading = ref(true);
const events = ref<ScheduleEvent[]>([]);
const groups = ref<Group[]>([]);
const instructors = ref<Instructor[]>([]);
const classrooms = ref<Classroom[]>([]);
const currentView = ref('dayGridMonth');
const currentTitle = ref('');
const showEventModal = ref(false);
const selectedEvent = ref<ScheduleEvent | null>(null);
const defaultEventStart = ref<Date | undefined>(undefined);
const defaultEventEnd = ref<Date | undefined>(undefined);

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

// Преобразование событий для календаря
const calendarEvents = computed(() => {
  return events.value.map((event): CalendarEvent => {
    const defaultColors = { bg: '#3C50E0', border: '#3C50E0', text: '#ffffff' };
    const colors = eventColors[event.color] ?? defaultColors;
    
    return {
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      allDay: event.isAllDay,
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
  });
});

// Опции календаря
const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: currentView.value,
  locale: ruLocale,
  headerToolbar: false, // Используем свою панель управления
  height: 'auto',
  events: calendarEvents.value,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  nowIndicator: true,
  slotMinTime: '06:00:00',
  slotMaxTime: '22:00:00',
  slotDuration: '00:30:00',
  allDaySlot: true,
  allDayText: 'Весь день',
  
  // Обработчики событий
  eventClick: handleEventClick,
  select: handleDateSelect,
  datesSet: handleDatesSet,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  
  // Кастомизация отображения событий
  eventContent: (arg) => {
    const props = arg.event.extendedProps;
    let html = `<div class="fc-event-main-content">
      <div class="fc-event-title">${arg.event.title}</div>`;
    
    if (props.groupCode || props.classroomName) {
      html += `<div class="fc-event-info text-xs opacity-80">`;
      if (props.groupCode) {
        html += `<span>${props.groupCode}</span>`;
      }
      if (props.classroomName) {
        html += `<span class="ml-1">📍${props.classroomName}</span>`;
      }
      html += `</div>`;
    }
    
    html += `</div>`;
    return { html };
  },
}));

// Методы
const handlePrev = () => {
  const api = calendarRef.value?.getApi();
  api?.prev();
};

const handleNext = () => {
  const api = calendarRef.value?.getApi();
  api?.next();
};

const handleViewChange = (view: string) => {
  currentView.value = view;
  const api = calendarRef.value?.getApi();
  api?.changeView(view);
};

const handleDatesSet = (arg: DatesSetArg) => {
  currentTitle.value = arg.view.title;
  currentView.value = arg.view.type;
  loadEvents(arg.start, arg.end);
};

const handleEventClick = (arg: EventClickArg) => {
  const event = events.value.find(e => e.id === arg.event.id);
  if (event) {
    selectedEvent.value = event;
    showEventModal.value = true;
  }
};

const handleDateSelect = (arg: DateSelectArg) => {
  selectedEvent.value = null;
  defaultEventStart.value = arg.start;
  defaultEventEnd.value = arg.end;
  showEventModal.value = true;
};

const handleEventDrop = async (info: any) => {
  const event = events.value.find(e => e.id === info.event.id);
  if (!event) return;

  try {
    await authFetch(`/api/schedule/${event.id}`, {
      method: 'PUT',
      body: {
        startTime: info.event.start.toISOString(),
        endTime: info.event.end?.toISOString() || new Date(info.event.start.getTime() + 60 * 60 * 1000).toISOString(),
      },
    });

    notification.show({
      type: 'success',
      title: 'Событие перемещено',
      message: 'Время занятия успешно обновлено',
    });

    await loadEvents();
  } catch (error: any) {
    console.error('Error updating event:', error);
    info.revert();
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || 'Не удалось переместить событие',
    });
  }
};

const handleEventResize = async (info: any) => {
  const event = events.value.find(e => e.id === info.event.id);
  if (!event) return;

  try {
    await authFetch(`/api/schedule/${event.id}`, {
      method: 'PUT',
      body: {
        endTime: info.event.end.toISOString(),
      },
    });

    notification.show({
      type: 'success',
      title: 'Событие обновлено',
      message: 'Длительность занятия успешно изменена',
    });

    await loadEvents();
  } catch (error: any) {
    console.error('Error updating event:', error);
    info.revert();
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || 'Не удалось изменить событие',
    });
  }
};

const openAddModal = (start?: Date) => {
  selectedEvent.value = null;
  defaultEventStart.value = start || new Date();
  defaultEventEnd.value = new Date((start || new Date()).getTime() + 60 * 60 * 1000);
  showEventModal.value = true;
};

const closeEventModal = () => {
  showEventModal.value = false;
  selectedEvent.value = null;
  defaultEventStart.value = undefined;
  defaultEventEnd.value = undefined;
};

const handleEventSaved = async () => {
  closeEventModal();
  await loadEvents();
};

const handleEventDeleted = async () => {
  closeEventModal();
  await loadEvents();
};

const handleFilterChange = () => {
  loadEvents();
};

const resetFilters = () => {
  filters.value = {
    groupId: '',
    instructorId: '',
    classroomId: '',
  };
  loadEvents();
};

// Загрузка данных
const loadEvents = async (start?: Date, end?: Date) => {
  try {
    const api = calendarRef.value?.getApi();
    const viewStart = start || api?.view.activeStart;
    const viewEnd = end || api?.view.activeEnd;

    const params = new URLSearchParams();
    if (viewStart) params.append('startDate', viewStart.toISOString());
    if (viewEnd) params.append('endDate', viewEnd.toISOString());
    if (filters.value.groupId) params.append('groupId', filters.value.groupId);
    if (filters.value.instructorId) params.append('instructorId', filters.value.instructorId);
    if (filters.value.classroomId) params.append('classroomId', filters.value.classroomId);

    const response = await authFetch<{ success: boolean; events: ScheduleEvent[] }>(
      `/api/schedule?${params.toString()}`
    );

    if (response.success) {
      events.value = response.events;
    }
  } catch (error) {
    console.error('Error loading events:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось загрузить расписание',
    });
  } finally {
    loading.value = false;
  }
};

const loadSelectData = async () => {
  try {
    // Загружаем группы
    const groupsResponse = await authFetch<{ success: boolean; groups: any[] }>('/api/groups?limit=1000&isActive=true');
    if (groupsResponse.success && groupsResponse.groups) {
      groups.value = groupsResponse.groups.map(g => ({
        id: g.id,
        code: g.code,
      }));
    }

    // Загружаем инструкторов
    const instructorsResponse = await authFetch<{ success: boolean; instructors: Instructor[] }>('/api/instructors?limit=1000&isActive=true');
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

// Lifecycle
onMounted(() => {
  loadSelectData();
});
</script>

<style>
/* Кастомизация FullCalendar */
.schedule-calendar {
  --fc-border-color: theme('colors.stroke');
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
  border: 1px solid theme('colors.stroke');
  color: theme('colors.gray.700');
  padding: 0.5rem 1rem;
  font-weight: 500;
}

.dark .schedule-calendar .fc-button {
  border-color: #3d4d5f;
  color: #aeb7c0;
}

.schedule-calendar .fc-button:hover {
  background-color: theme('colors.gray.100');
}

.dark .schedule-calendar .fc-button:hover {
  background-color: theme('colors.meta-4');
}

.schedule-calendar .fc-button-active {
  background-color: theme('colors.primary') !important;
  color: white !important;
  border-color: theme('colors.primary') !important;
}

.schedule-calendar .fc-daygrid-day-number,
.schedule-calendar .fc-col-header-cell-cushion {
  color: theme('colors.gray.700');
}

.dark .schedule-calendar .fc-daygrid-day-number,
.dark .schedule-calendar .fc-col-header-cell-cushion {
  color: #aeb7c0;
}

.schedule-calendar .fc-event {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.8125rem;
}

.schedule-calendar .fc-event:hover {
  opacity: 0.9;
}

.schedule-calendar .fc-timegrid-slot {
  height: 2.5rem;
}

.schedule-calendar .fc-timegrid-slot-label {
  font-size: 0.75rem;
}

.schedule-calendar .fc-daygrid-day.fc-day-today {
  background-color: var(--fc-today-bg-color);
}

.schedule-calendar .fc-list-event:hover td {
  background-color: theme('colors.gray.50');
}

.dark .schedule-calendar .fc-list-event:hover td {
  background-color: theme('colors.meta-4');
}

.schedule-calendar .fc-event-main-content {
  overflow: hidden;
}

.schedule-calendar .fc-event-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedule-calendar .fc-event-info {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
