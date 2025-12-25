<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка журнала...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <svg class="mx-auto h-16 w-16 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Ошибка загрузки</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">{{ error }}</p>
        <UiButton class="mt-6" @click="loadJournal">
          Попробовать снова
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
          <NuxtLink :to="`/groups/${groupId}`" class="hover:text-primary transition-colors">{{ groupCode }}</NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900 dark:text-white">Журнал</span>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-info/10 text-info">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-black dark:text-white">{{ disciplineName || 'Журнал' }}</h1>
              <p class="text-gray-500 dark:text-gray-400">
                <span v-if="instructorName">{{ instructorName }} • </span>
                Журнал посещаемости и оценок
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <!-- Статистика -->
            <div class="hidden lg:flex items-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Студентов</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ summary?.totalStudents || 0 }}</p>
              </div>
              <div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Занятий</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ summary?.totalEvents || 0 }}</p>
              </div>
              <div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Ср. посещ.</p>
                <p class="text-lg font-bold" :class="getAttendanceColor(summary?.averageAttendance || 0)">
                  {{ (summary?.averageAttendance || 0).toFixed(1) }}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Пустое состояние - нет занятий -->
      <div v-if="columns.length === 0" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Занятия не найдены</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
          Для этой дисциплины ещё нет запланированных занятий.<br>
          Добавьте занятия в расписание, чтобы вести журнал.
        </p>
        <NuxtLink 
          :to="`/schedule?groupId=${groupId}`"
          class="inline-block mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Перейти к расписанию
        </NuxtLink>
      </div>

      <!-- Таблица журнала -->
      <div v-else class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-max">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <!-- Заголовок студента -->
                <th class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                  Слушатель
                </th>
                <!-- Заголовки занятий -->
                <th 
                  v-for="column in columns" 
                  :key="column.scheduleEvent.id"
                  class="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span 
                      class="inline-block w-2 h-2 rounded-full"
                      :class="{
                        'bg-blue-500': column.scheduleEvent.eventType === 'theory',
                        'bg-green-500': column.scheduleEvent.eventType === 'practice',
                        'bg-orange-500': column.scheduleEvent.eventType === 'assessment',
                        'bg-gray-500': column.scheduleEvent.eventType === 'other',
                      }"
                    ></span>
                    <span class="text-xs">{{ formatColumnDate(column.scheduleEvent.date) }}</span>
                    <span class="text-[10px] text-gray-400">{{ formatTimeRange(column.scheduleEvent.startTime, column.scheduleEvent.endTime) }}</span>
                  </div>
                </th>
                <!-- Итоги -->
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] bg-gray-100 dark:bg-gray-700">
                  Посещ. %
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] bg-gray-100 dark:bg-gray-700">
                  Ср. оценка
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] bg-gray-100 dark:bg-gray-700">
                  Итог
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr 
                v-for="row in rows" 
                :key="row.student.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <!-- Имя студента -->
                <td class="sticky left-0 z-10 bg-white dark:bg-boxdark px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div class="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success text-sm font-semibold">
                      {{ getInitials(row.student.fullName) }}
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[150px]" :title="row.student.fullName">
                      {{ row.student.fullName }}
                    </span>
                  </div>
                </td>
                <!-- Ячейки посещаемости/оценок -->
                <td 
                  v-for="(cell, cellIndex) in row.cells" 
                  :key="cell.scheduleEventId"
                  class="px-2 py-3 text-center"
                >
                  <AttendanceCell
                    v-if="columns[cellIndex]"
                    :cell="cell"
                    :column="columns[cellIndex]!"
                    :student-id="row.student.id"
                    @update="handleCellUpdate"
                  />
                </td>
                <!-- Процент посещаемости -->
                <td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">
                  <span 
                    class="inline-block px-2 py-1 rounded text-sm font-medium"
                    :class="getAttendanceColor(row.attendancePercent)"
                  >
                    {{ row.attendancePercent.toFixed(1) }}%
                  </span>
                </td>
                <!-- Средняя оценка -->
                <td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">
                  <span v-if="row.averageGrade !== undefined" class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ row.averageGrade.toFixed(0) }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <!-- Итоговая оценка -->
                <td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">
                  <FinalGradeCell
                    :final-grade="row.finalGrade"
                    :student-id="row.student.id"
                    :group-id="groupId"
                    :discipline-id="disciplineId"
                    :attendance-percent="row.attendancePercent"
                    @update="handleFinalGradeUpdate"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Легенда -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span class="font-medium">Типы занятий:</span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            Теория
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            Практика
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-orange-500"></span>
            Проверка знаний (с оценкой)
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import AttendanceCell from '~/components/attendance/AttendanceCell.vue';
import FinalGradeCell from '~/components/attendance/FinalGradeCell.vue';

definePageMeta({
  layout: 'default',
});

interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: 'theory' | 'practice' | 'assessment' | 'other';
    academicHours: number;
  };
  hasGrade: boolean;
}

interface JournalCell {
  studentId: string;
  scheduleEventId: string;
  attendance?: {
    id: string;
    hoursAttended: number;
    maxHours: number;
    notes: string | null;
  };
  grade?: {
    id: string;
    grade: number;
    notes: string | null;
  };
}

interface FinalGrade {
  id: string;
  finalGrade?: number;
  attendancePercent?: number;
  status: 'in_progress' | 'passed' | 'failed' | 'not_allowed';
  notes?: string;
}

interface JournalRow {
  student: {
    id: string;
    fullName: string;
    organization: string | null;
  };
  cells: JournalCell[];
  totalHoursAttended: number;
  totalMaxHours: number;
  attendancePercent: number;
  averageGrade?: number;
  assessmentCount: number;
  finalGrade?: FinalGrade;
}

interface JournalSummary {
  totalStudents: number;
  totalEvents: number;
  averageAttendance: number;
  passedCount: number;
  failedCount: number;
  inProgressCount: number;
}

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useNotification();

// Route params - используем slug с разделителем _
const slug = computed(() => route.params.slug as string);
const groupId = computed(() => slug.value?.split('_')[0] || '');
const disciplineId = computed(() => slug.value?.split('_')[1] || '');

// State
const loading = ref(true);
const error = ref<string | null>(null);
const columns = ref<JournalColumn[]>([]);
const rows = ref<JournalRow[]>([]);
const summary = ref<JournalSummary | null>(null);
const groupCode = ref('');
const disciplineName = ref('');
const instructorName = ref('');

// Load journal data
const loadJournal = async () => {
  loading.value = true;
  error.value = null;
  
  if (!groupId.value || !disciplineId.value) {
    error.value = 'Неверный URL журнала';
    loading.value = false;
    return;
  }
  
  try {
    const response = await authFetch<{
      success: boolean;
      columns: JournalColumn[];
      rows: JournalRow[];
      summary: JournalSummary;
      message?: string;
    }>(`/api/attendance/journal?groupId=${groupId.value}&disciplineId=${disciplineId.value}`);
    
    if (response.success) {
      columns.value = response.columns;
      rows.value = response.rows;
      summary.value = response.summary;
    } else {
      error.value = response.message || 'Ошибка загрузки журнала';
    }
  } catch (err: any) {
    console.error('Error loading journal:', err);
    error.value = err.message || 'Ошибка загрузки журнала';
  } finally {
    loading.value = false;
  }
};

// Load group and discipline info
const loadMeta = async () => {
  if (!groupId.value || !disciplineId.value) return;
  
  try {
    // Загружаем информацию о группе
    const groupResponse = await authFetch<{ 
      success: boolean; 
      group?: { code: string };
    }>(`/api/groups/${groupId.value}`);
    
    if (groupResponse.success && groupResponse.group) {
      groupCode.value = groupResponse.group.code;
    }
    
    // Загружаем дисциплины группы (имеют инструкторов)
    const disciplinesResponse = await authFetch<{ 
      success: boolean; 
      disciplines?: Array<{ 
        id: string; 
        name: string; 
        instructors?: Array<{ 
          id: string;
          fullName: string; 
          isPrimary: boolean;
        }>;
      }>;
    }>(`/api/groups/${groupId.value}/disciplines`);
    
    if (disciplinesResponse.success && disciplinesResponse.disciplines) {
      // Ищем нужную дисциплину
      const discipline = disciplinesResponse.disciplines.find(
        (d) => d.id === disciplineId.value
      );
      
      if (discipline) {
        disciplineName.value = discipline.name;
        
        // Формируем список инструкторов
        if (discipline.instructors && discipline.instructors.length > 0) {
          // Сначала основные, потом остальные
          const sorted = [...discipline.instructors].sort((a, b) => 
            (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
          );
          
          // Показываем имена (до 2-х инструкторов)
          const names = sorted.slice(0, 2).map(i => i.fullName);
          if (sorted.length > 2) {
            instructorName.value = `${names.join(', ')} и ещё ${sorted.length - 2}`;
          } else {
            instructorName.value = names.join(', ');
          }
        }
      } else {
        disciplineName.value = 'Дисциплина';
      }
    }
  } catch (err) {
    console.error('Error loading meta:', err);
    disciplineName.value = 'Дисциплина';
  }
};

// Helpers
const formatColumnDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const formatTimeRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startStr = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${startStr}-${endStr}`;
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (first.length > 0 && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAttendanceColor = (percent: number) => {
  if (percent >= 75) return 'text-success bg-success/10';
  if (percent >= 50) return 'text-warning bg-warning/10';
  return 'text-danger bg-danger/10';
};

// Event handlers
const handleCellUpdate = async (_data: { studentId: string; scheduleEventId: string; type: 'attendance' | 'grade' }) => {
  await loadJournal();
};

const handleFinalGradeUpdate = async () => {
  await loadJournal();
};

// Initialize
onMounted(async () => {
  await Promise.all([loadJournal(), loadMeta()]);
});

// Watch for route changes
watch(slug, async () => {
  await Promise.all([loadJournal(), loadMeta()]);
});
</script>
