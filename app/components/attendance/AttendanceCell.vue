<template>
  <div class="inline-block">
    <!-- Ячейка для занятия с оценкой (assessment) -->
    <div v-if="column.hasGrade" class="flex flex-col items-center gap-1">
      <!-- Посещаемость -->
      <button
        class="w-10 h-6 rounded text-xs font-medium transition-all"
        :class="attendanceButtonClass"
        @click="openAttendanceModal"
        :title="attendanceTooltip"
      >
        {{ attendanceDisplay }}
      </button>
      
      <!-- Оценка -->
      <button
        class="w-10 h-6 rounded text-xs font-medium transition-all"
        :class="gradeButtonClass"
        @click="openGradeModal"
        :title="gradeTooltip"
      >
        {{ gradeDisplay }}
      </button>
    </div>
    
    <!-- Ячейка только для посещаемости -->
    <button
      v-else
      class="w-10 h-8 rounded text-xs font-medium transition-all"
      :class="attendanceButtonClass"
      @click="openAttendanceModal"
      :title="attendanceTooltip"
    >
      {{ attendanceDisplay }}
    </button>
    
    <!-- Модальное окно посещаемости -->
    <UiModal :is-open="showAttendanceModal" title="Отметка посещаемости" @close="showAttendanceModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Посещённые академические часы (из {{ maxHours }})
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="attendanceInput"
              type="number"
              step="0.5"
              min="0"
              :max="maxHours"
              class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span class="text-gray-500">а-ч</span>
          </div>
          <!-- Быстрые кнопки -->
          <div class="flex gap-2 mt-3">
            <button
              v-for="option in quickOptions"
              :key="option"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
              :class="attendanceInput === option 
                ? 'bg-primary text-white border-primary' 
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
              @click="attendanceInput = option"
            >
              {{ option }}
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Примечание (необязательно)
          </label>
          <input
            v-model="attendanceNotes"
            type="text"
            placeholder="Причина отсутствия и т.д."
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showAttendanceModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="saveAttendance">
            Сохранить
          </UiButton>
        </div>
      </div>
    </UiModal>
    
    <!-- Модальное окно оценки -->
    <UiModal :is-open="showGradeModal" title="Выставление оценки" @close="showGradeModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Оценка (0-100)
          </label>
          <input
            v-model.number="gradeInput"
            type="number"
            min="0"
            max="100"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <!-- Быстрые кнопки оценок -->
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              v-for="grade in [100, 90, 80, 70, 60, 50, 40]"
              :key="grade"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
              :class="gradeInput === grade 
                ? 'bg-primary text-white border-primary' 
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
              @click="gradeInput = grade"
            >
              {{ grade }}
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Комментарий (необязательно)
          </label>
          <input
            v-model="gradeNotes"
            type="text"
            placeholder="Комментарий к оценке"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showGradeModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="saveGrade">
            Сохранить
          </UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
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

const props = defineProps<{
  cell: JournalCell;
  column: JournalColumn;
  studentId: string;
}>();

const emit = defineEmits<{
  update: [data: { studentId: string; scheduleEventId: string; type: 'attendance' | 'grade' }];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

// State
const showAttendanceModal = ref(false);
const showGradeModal = ref(false);
const saving = ref(false);
const attendanceInput = ref(0);
const attendanceNotes = ref('');
const gradeInput = ref(0);
const gradeNotes = ref('');

// Computed
const maxHours = computed(() => props.column.scheduleEvent.academicHours);

const quickOptions = computed(() => {
  const max = maxHours.value;
  const options = [0, max];
  
  // Добавляем промежуточные значения
  if (max >= 2) {
    options.push(max / 2);
    options.push(max - 0.5);
  }
  
  return [...new Set(options)].sort((a, b) => a - b);
});

const attendanceDisplay = computed(() => {
  if (!props.cell.attendance) return '—';
  const hours = props.cell.attendance.hoursAttended;
  if (hours === 0) return '0';
  if (hours === maxHours.value) return '✓';
  return hours.toString();
});

const attendanceButtonClass = computed(() => {
  if (!props.cell.attendance) {
    return 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';
  }
  const hours = props.cell.attendance.hoursAttended;
  const max = props.cell.attendance.maxHours;
  const percent = (hours / max) * 100;
  
  if (percent >= 100) return 'bg-success/20 text-success hover:bg-success/30';
  if (percent > 0) return 'bg-warning/20 text-warning hover:bg-warning/30';
  return 'bg-danger/20 text-danger hover:bg-danger/30';
});

const attendanceTooltip = computed(() => {
  if (!props.cell.attendance) return 'Отметить посещаемость';
  const a = props.cell.attendance;
  let text = `${a.hoursAttended} из ${a.maxHours} а-ч`;
  if (a.notes) text += `\n${a.notes}`;
  return text;
});

const gradeDisplay = computed(() => {
  if (!props.cell.grade) return '—';
  return props.cell.grade.grade.toString();
});

const gradeButtonClass = computed(() => {
  if (!props.cell.grade) {
    return 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';
  }
  const grade = props.cell.grade.grade;
  
  if (grade >= 60) return 'bg-success/20 text-success hover:bg-success/30';
  if (grade >= 40) return 'bg-warning/20 text-warning hover:bg-warning/30';
  return 'bg-danger/20 text-danger hover:bg-danger/30';
});

const gradeTooltip = computed(() => {
  if (!props.cell.grade) return 'Выставить оценку';
  const g = props.cell.grade;
  let text = `Оценка: ${g.grade}`;
  if (g.notes) text += `\n${g.notes}`;
  return text;
});

// Methods
const openAttendanceModal = () => {
  attendanceInput.value = props.cell.attendance?.hoursAttended ?? maxHours.value;
  attendanceNotes.value = props.cell.attendance?.notes ?? '';
  showAttendanceModal.value = true;
};

const openGradeModal = () => {
  gradeInput.value = props.cell.grade?.grade ?? 0;
  gradeNotes.value = props.cell.grade?.notes ?? '';
  showGradeModal.value = true;
};

const saveAttendance = async () => {
  if (attendanceInput.value < 0 || attendanceInput.value > maxHours.value) {
    toast.error(`Часы должны быть от 0 до ${maxHours.value}`);
    return;
  }
  
  saving.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string }>('/api/attendance', {
      method: 'POST',
      body: {
        studentId: props.studentId,
        scheduleEventId: props.column.scheduleEvent.id,
        hoursAttended: attendanceInput.value,
        maxHours: maxHours.value,
        notes: attendanceNotes.value || undefined,
      },
    });
    
    if (response.success) {
      toast.success('Посещаемость сохранена');
      showAttendanceModal.value = false;
      emit('update', { 
        studentId: props.studentId, 
        scheduleEventId: props.column.scheduleEvent.id, 
        type: 'attendance' 
      });
    } else {
      toast.error(response.message || 'Ошибка сохранения');
    }
  } catch (error: any) {
    toast.error(error.message || 'Ошибка сохранения');
  } finally {
    saving.value = false;
  }
};

const saveGrade = async () => {
  if (gradeInput.value < 0 || gradeInput.value > 100) {
    toast.error('Оценка должна быть от 0 до 100');
    return;
  }
  
  saving.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string }>('/api/grades', {
      method: 'POST',
      body: {
        studentId: props.studentId,
        scheduleEventId: props.column.scheduleEvent.id,
        grade: gradeInput.value,
        notes: gradeNotes.value || undefined,
      },
    });
    
    if (response.success) {
      toast.success('Оценка сохранена');
      showGradeModal.value = false;
      emit('update', { 
        studentId: props.studentId, 
        scheduleEventId: props.column.scheduleEvent.id, 
        type: 'grade' 
      });
    } else {
      toast.error(response.message || 'Ошибка сохранения');
    }
  } catch (error: any) {
    toast.error(error.message || 'Ошибка сохранения');
  } finally {
    saving.value = false;
  }
};
</script>
