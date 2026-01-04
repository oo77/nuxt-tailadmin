<template>
  <div class="min-h-screen bg-gray-100 dark:bg-boxdark-2">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Загрузка теста...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div class="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Ошибка загрузки</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
        <UiButton @click="navigateTo('/tests/my')">
          Вернуться к списку тестов
        </UiButton>
      </div>
    </div>

    <!-- Тест завершён -->
    <div v-else-if="isCompleted" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div class="text-center mb-8">
          <div :class="[
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
            session?.passed ? 'bg-success/10' : 'bg-danger/10'
          ]">
            <svg v-if="session?.passed" class="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ session?.passed ? 'Тест пройден!' : 'Тест не сдан' }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ session?.passed ? 'Поздравляем с успешным прохождением теста!' : 'К сожалению, вы не набрали проходной балл.' }}
          </p>
        </div>

        <!-- Результаты -->
        <div class="bg-gray-50 dark:bg-meta-4 rounded-xl p-6 mb-6">
          <div class="text-center mb-4">
            <div :class="[
              'text-5xl font-bold mb-1',
              session?.passed ? 'text-success' : 'text-danger'
            ]">
              {{ session?.score_percent !== null ? Math.round(session.score_percent) : 0 }}%
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Ваш результат
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-white dark:bg-boxdark rounded-lg p-3">
              <div class="text-lg font-bold text-gray-900 dark:text-white">
                {{ session?.total_points || 0 }} / {{ session?.max_points || 0 }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Баллов набрано</div>
            </div>
            <div class="bg-white dark:bg-boxdark rounded-lg p-3">
              <div class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatTime(session?.time_spent_seconds || 0) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Время прохождения</div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <UiButton variant="outline" class="flex-1" @click="navigateTo('/tests/my')">
            К списку тестов
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Прохождение теста -->
    <div v-else class="flex flex-col min-h-screen">
      <!-- Верхняя панель -->
      <header class="bg-white dark:bg-boxdark shadow-sm sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 class="font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {{ templateInfo?.name || 'Тест' }}
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Вопрос {{ currentQuestionIndex + 1 }} из {{ questionsCount }}
                </p>
              </div>
            </div>

            <!-- Таймер -->
            <div v-if="timeLimit" :class="[
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
              timerWarning ? 'bg-danger/10 text-danger animate-pulse' : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300'
            ]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="tabular-nums">{{ formatTimer(remainingTime) }}</span>
            </div>
          </div>

          <!-- Прогресс-бар -->
          <div class="mt-3 mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Прогресс:</span>
            <span class="font-medium">{{ answeredCount }}/{{ questionsCount }}</span>
          </div>
          <div class="w-full h-2 bg-gray-200 dark:bg-meta-4 rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>
      </header>

      <!-- Основной контент -->
      <main class="flex-1 py-6">
        <div class="max-w-3xl mx-auto px-4">
          <!-- Карточка вопроса -->
          <div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden">
            <!-- Заголовок вопроса -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  {{ currentQuestionIndex + 1 }}
                </div>
                <div class="flex-1">
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {{ currentQuestion?.question_text }}
                  </h2>
                  <div v-if="currentQuestion?.points" class="mt-2 inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {{ currentQuestion.points }} {{ pluralize(currentQuestion.points, 'балл', 'балла', 'баллов') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Варианты ответа -->
            <div class="p-6">
              <div v-if="currentQuestion?.question_type === 'single'" class="space-y-3">
                <label
                  v-for="option in currentQuestion.options?.options"
                  :key="option.id"
                  :class="[
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                    currentAnswerData?.selectedOption === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-meta-4'
                  ]"
                >
                  <div :class="[
                    'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    currentAnswerData?.selectedOption === option.id
                      ? 'border-primary bg-primary'
                      : 'border-gray-300 dark:border-gray-600'
                  ]">
                    <div v-if="currentAnswerData?.selectedOption === option.id" class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <span class="flex-1 text-gray-900 dark:text-white">{{ option.text }}</span>
                  <input
                    type="radio"
                    :name="`question-${currentQuestion.id}`"
                    :value="option.id"
                    v-model="currentAnswerData.selectedOption"
                    class="sr-only"
                    @change="autoSaveAnswer"
                  />
                </label>
              </div>

              <!-- TODO: Другие типы вопросов (multiple, text, order, match) -->
            </div>
          </div>

          <!-- Навигация по вопросам -->
          <div class="mt-6 flex flex-wrap gap-2 bg-white dark:bg-boxdark rounded-xl p-4 shadow">
            <button
              v-for="(q, idx) in questionsCount"
              :key="idx"
              @click="goToQuestion(idx)"
              :class="[
                'w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200',
                idx === currentQuestionIndex
                  ? 'bg-primary text-white shadow-lg scale-110'
                  : isQuestionAnswered(idx)
                    ? 'bg-success/10 text-success hover:bg-success/20'
                    : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>
      </main>

      <!-- Нижняя панель -->
      <footer class="bg-white dark:bg-boxdark border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
        <div class="max-w-3xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <UiButton
              v-if="templateInfo?.allow_back !== false"
              variant="outline"
              :disabled="currentQuestionIndex === 0"
              @click="prevQuestion"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </UiButton>
            <div v-else></div>

            <UiButton
              v-if="currentQuestionIndex < questionsCount - 1"
              @click="nextQuestion"
            >
              Далее
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </UiButton>
            <UiButton
              v-else
              variant="success"
              @click="confirmFinish"
              :loading="finishing"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Завершить тест
            </UiButton>
          </div>
        </div>
      </footer>
    </div>

    <!-- Предупреждение о нарушении (антипрокторинг) -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="showViolationWarning" 
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div class="bg-white dark:bg-boxdark rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-shake">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  Нарушение обнаружено!
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Переключение вкладок запрещено во время теста
                </p>
              </div>
            </div>
            <div class="bg-danger/10 rounded-lg p-3 mb-4">
              <p class="text-sm text-danger">
                Нарушений: {{ violationsCount }} из {{ maxViolations }}
              </p>
              <p v-if="violationsCount >= maxViolations - 1" class="text-sm text-danger mt-1 font-medium">
                Следующее нарушение приведёт к автоматическому завершению теста!
              </p>
            </div>
            <UiButton class="w-full" @click="dismissViolationWarning">
              Продолжить тест
            </UiButton>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модальное окно подтверждения завершения -->
    <UiConfirmModal
      :is-open="showFinishModal"
      title="Завершить тест?"
      :message="getFinishMessage()"
      confirm-text="Завершить"
      cancel-text="Отмена"
      :variant="unansweredCount > 0 ? 'warning' : 'primary'"
      :loading="finishing"
      @confirm="finishTest"
      @cancel="showFinishModal = false"
    />

    <!-- Уведомления -->
    <UiNotification
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="notification.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

definePageMeta({
  layout: false, // Полноэкранный режим
});

const route = useRoute();
const { authFetch } = useAuthFetch();

// ID сессии из URL
const sessionId = computed(() => route.params.id);

// Состояние
const loading = ref(true);
const error = ref(null);
const session = ref(null);
const questions = ref([]);
const answers = ref({});
const templateInfo = ref(null);
const currentQuestionIndex = ref(0);
const finishing = ref(false);

// Таймер
const timeLimit = ref(null); // в минутах
const remainingTime = ref(0); // в секундах
let timerInterval = null;

// Антипрокторинг
const proctoringEnabled = ref(false);
const proctoringSettings = ref(null);
const violationsCount = ref(0);
const showViolationWarning = ref(false);
const maxViolations = computed(() => proctoringSettings.value?.maxViolations || 3);

// Модальные окна
const showFinishModal = ref(false);

// Уведомления
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

// Вычисляемые свойства
const questionsCount = computed(() => questions.value.length);

const currentQuestion = computed(() => 
  questions.value[currentQuestionIndex.value] || null
);

const currentAnswerData = computed({
  get: () => {
    const qId = currentQuestion.value?.id;
    if (!qId) return { selectedOption: null };
    return answers.value[qId] || { selectedOption: null };
  },
  set: (val) => {
    const qId = currentQuestion.value?.id;
    if (qId) {
      answers.value[qId] = val;
    }
  }
});

const answeredCount = computed(() => 
  Object.values(answers.value).filter(a => 
    a && (a.selectedOption || a.selectedOptions?.length || a.text)
  ).length
);

const unansweredCount = computed(() => questionsCount.value - answeredCount.value);

const progressPercent = computed(() => 
  questionsCount.value > 0 ? (answeredCount.value / questionsCount.value) * 100 : 0
);

const isCompleted = computed(() => 
  session.value?.status === 'completed' || 
  session.value?.status === 'timeout' ||
  session.value?.status === 'violation'
);

const timerWarning = computed(() => remainingTime.value > 0 && remainingTime.value <= 60);

// Загрузка данных
const loadSession = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch(`/api/tests/sessions/${sessionId.value}?include_questions=true&include_answers=true`);

    if (!response.success) {
      error.value = response.message || 'Сессия не найдена';
      return;
    }

    session.value = response.session;
    questions.value = response.questions || [];

    // Восстанавливаем ответы
    if (response.answers) {
      for (const ans of response.answers) {
        answers.value[ans.question_id] = ans.answer_data;
      }
    }

    // Восстанавливаем позицию
    if (session.value.current_question_index !== undefined) {
      currentQuestionIndex.value = session.value.current_question_index;
    }

    // Загружаем информацию о шаблоне теста (если сессия активна)
    if (!isCompleted.value) {
      await loadTemplateInfo();
      initTimer();
      initProctoring();
    }
  } catch (err) {
    console.error('Ошибка загрузки сессии:', err);
    error.value = 'Произошла ошибка при загрузке теста';
  } finally {
    loading.value = false;
  }
};

const loadTemplateInfo = async () => {
  try {
    // Получаем информацию из сессии start если есть
    // Или делаем дополнительный запрос
    // Пока используем заглушку
    templateInfo.value = {
      name: session.value?.template_name || 'Тест',
      allow_back: true,
      time_limit_minutes: null,
      proctoring_enabled: false,
      proctoring_settings: null,
    };

    // Проверяем, нужно ли получить время из API
    // Если сессия только что создана, информация должна быть в localStorage или повторном запросе
  } catch (err) {
    console.error('Ошибка загрузки информации о шаблоне:', err);
  }
};

// Таймер
const initTimer = () => {
  if (!timeLimit.value) return;

  const startTime = new Date(session.value.started_at).getTime();
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const totalSeconds = timeLimit.value * 60;
  remainingTime.value = Math.max(0, totalSeconds - elapsed);

  if (remainingTime.value <= 0) {
    handleTimeout();
    return;
  }

  timerInterval = setInterval(() => {
    remainingTime.value--;
    if (remainingTime.value <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
};

const handleTimeout = async () => {
  showNotification('warning', 'Время вышло', 'Тест будет автоматически завершён');
  await finishTest();
};

// Антипрокторинг
const initProctoring = () => {
  if (!proctoringEnabled.value) return;

  // Отслеживаем переключение вкладок
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);

  // Блокируем правый клик если настроено
  if (proctoringSettings.value?.blockRightClick) {
    document.addEventListener('contextmenu', preventContextMenu);
  }

  // Блокируем копирование если настроено
  if (proctoringSettings.value?.blockCopyPaste) {
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
  }
};

const cleanupProctoring = () => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('blur', handleWindowBlur);
  document.removeEventListener('contextmenu', preventContextMenu);
  document.removeEventListener('copy', preventCopy);
  document.removeEventListener('paste', preventPaste);
};

const handleVisibilityChange = () => {
  if (document.hidden && !isCompleted.value) {
    recordViolation('visibility_change');
  }
};

const handleWindowBlur = () => {
  if (!isCompleted.value) {
    recordViolation('tab_switch');
  }
};

const preventContextMenu = (e) => {
  e.preventDefault();
  recordViolation('right_click');
};

const preventCopy = (e) => {
  e.preventDefault();
  recordViolation('copy_paste');
};

const preventPaste = (e) => {
  e.preventDefault();
  recordViolation('copy_paste');
};

const recordViolation = async (type) => {
  violationsCount.value++;
  showViolationWarning.value = true;

  try {
    await authFetch(`/api/tests/sessions/${sessionId.value}/violation`, {
      method: 'POST',
      body: {
        type,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Ошибка записи нарушения:', err);
  }

  // Автозавершение при превышении лимита
  if (violationsCount.value >= maxViolations.value && proctoringSettings.value?.autoSubmitOnViolation) {
    showViolationWarning.value = false;
    showNotification('error', 'Тест завершён', 'Превышен лимит нарушений');
    await finishTest();
  }
};

const dismissViolationWarning = () => {
  showViolationWarning.value = false;
};

// Навигация
const nextQuestion = () => {
  if (currentQuestionIndex.value < questionsCount.value - 1) {
    saveCurrentAnswer();
    currentQuestionIndex.value++;
  }
};

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    saveCurrentAnswer();
    currentQuestionIndex.value--;
  }
};

const goToQuestion = (index) => {
  saveCurrentAnswer();
  currentQuestionIndex.value = index;
};

const isQuestionAnswered = (index) => {
  const q = questions.value[index];
  if (!q) return false;
  const ans = answers.value[q.id];
  return ans && (ans.selectedOption || ans.selectedOptions?.length || ans.text);
};

// Сохранение ответа
const saveCurrentAnswer = async () => {
  const question = currentQuestion.value;
  const answer = answers.value[question?.id];
  
  if (!question || !answer) return;

  try {
    await authFetch(`/api/tests/sessions/${sessionId.value}/answer`, {
      method: 'POST',
      body: {
        question_id: question.id,
        answer_data: answer,
        question_index: currentQuestionIndex.value,
      },
    });
  } catch (err) {
    console.error('Ошибка сохранения ответа:', err);
  }
};

const autoSaveAnswer = () => {
  // Debounced autosave
  saveCurrentAnswer();
};

// Завершение теста
const confirmFinish = () => {
  saveCurrentAnswer();
  showFinishModal.value = true;
};

const getFinishMessage = () => {
  if (unansweredCount.value > 0) {
    return `У вас есть ${unansweredCount.value} ${pluralize(unansweredCount.value, 'неотвеченный вопрос', 'неотвеченных вопроса', 'неотвеченных вопросов')}. Вы уверены, что хотите завершить тест?`;
  }
  return 'Вы отвечили на все вопросы. Завершить тест и посмотреть результаты?';
};

const finishTest = async () => {
  finishing.value = true;
  showFinishModal.value = false;

  try {
    await saveCurrentAnswer();

    const response = await authFetch(`/api/tests/sessions/${sessionId.value}/finish`, {
      method: 'POST',
    });

    if (response.success) {
      session.value = {
        ...session.value,
        status: 'completed',
        ...response.results,
      };
      cleanupProctoring();
      if (timerInterval) clearInterval(timerInterval);
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось завершить тест');
    }
  } catch (err) {
    console.error('Ошибка завершения теста:', err);
    showNotification('error', 'Ошибка', 'Произошла ошибка при завершении теста');
  } finally {
    finishing.value = false;
  }
};

// Утилиты
const formatTimer = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} мин ${s} сек`;
};

const pluralize = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

// Lifecycle
onMounted(() => {
  loadSession();
});

onUnmounted(() => {
  cleanupProctoring();
  if (timerInterval) clearInterval(timerInterval);
});

// Предупреждение при закрытии страницы
if (import.meta.client) {
  window.addEventListener('beforeunload', (e) => {
    if (!isCompleted.value && answeredCount.value > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
