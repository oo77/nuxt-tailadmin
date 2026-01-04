<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Навигация -->
    <div class="mb-6">
      <NuxtLink
        :to="`/groups/${groupId}`"
        class="inline-flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Назад к группе
      </NuxtLink>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Контент -->
    <template v-else-if="group">
      <!-- Заголовок -->
      <div class="mb-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-title-md2 font-bold text-black dark:text-white">
              Выдача сертификатов
            </h2>
            <p class="mt-1 text-gray-500 dark:text-gray-400">
              Группа {{ group.code }} • {{ group.course?.name }}
            </p>
          </div>

          <!-- Настройки выдачи -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Информация о шаблоне -->
            <div v-if="template" class="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="text-sm font-medium">{{ template.name }}</span>
            </div>
            
            <!-- Предупреждение если нет шаблона -->
            <div v-else class="flex items-center gap-2 px-3 py-2 bg-warning/10 text-warning rounded-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span class="text-sm font-medium">Шаблон не назначен для курса</span>
              <NuxtLink 
                :to="`/programs/edit/${group.course?.id}`" 
                class="text-xs underline hover:no-underline"
              >
                Настроить
              </NuxtLink>
            </div>

            <!-- Дата выдачи -->
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Дата выдачи:</label>
              <input
                v-model="issueDate"
                type="date"
                class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <!-- Срок действия (показываем только информацию из курса) -->
            <div v-if="group.course?.certificateValidityMonths" class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Срок: {{ group.course.certificateValidityMonths }} мес.
              </span>
            </div>
            <div v-else class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-sm text-gray-600 dark:text-gray-400">Бессрочный</span>
            </div>
          </div>
        </div>

        <!-- Статистика -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
            <p class="text-sm text-gray-500 dark:text-gray-400">Всего слушателей</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalStudents }}</p>
          </div>
          <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
            <p class="text-sm text-gray-500 dark:text-gray-400">Допущены</p>
            <p class="text-2xl font-bold text-success">{{ stats.eligible }}</p>
          </div>
          <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
            <p class="text-sm text-gray-500 dark:text-gray-400">С предупреждениями</p>
            <p class="text-2xl font-bold text-warning">{{ stats.withWarnings }}</p>
          </div>
          <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
            <p class="text-sm text-gray-500 dark:text-gray-400">Выдано</p>
            <p class="text-2xl font-bold text-primary">{{ stats.issued }}</p>
          </div>
          <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
            <p class="text-sm text-gray-500 dark:text-gray-400">Отозвано</p>
            <p class="text-2xl font-bold text-danger">{{ stats.revoked }}</p>
          </div>
        </div>

        <!-- Кнопки массовых действий -->
        <div class="flex flex-wrap gap-3 mt-6">
          <!-- Выдать всем допущенным -->
          <UiButton 
            @click="openBulkIssueModal('eligible')" 
            :disabled="!template || eligibleWithoutCertificate === 0 || isIssuing"
            variant="primary"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Выдать всем допущенным ({{ eligibleWithoutCertificate }})
          </UiButton>
          
          <!-- Выдать выбранным -->
          <UiButton 
            @click="openBulkIssueModal('selected')" 
            :disabled="!template || selectedStudentIds.length === 0 || isIssuing"
            variant="outline"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Выдать выбранным ({{ selectedStudentIds.length }})
          </UiButton>
        </div>
      </div>

      <!-- Таблица журнала -->
      <div class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th class="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isPartialSelected"
                    @change="toggleSelectAll"
                    class="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Слушатель
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Посещаемость
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Дисциплин
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ср. балл
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Допуск
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Сертификат
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="row in journal"
                :key="row.student.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <!-- Чекбокс -->
                <td class="px-4 py-4">
                  <input
                    type="checkbox"
                    :checked="selectedStudentIds.includes(row.student.id)"
                    :disabled="row.certificate?.status === 'issued'"
                    @change="toggleStudent(row.student.id)"
                    class="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                  />
                </td>

                <!-- Слушатель -->
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                      {{ getInitials(row.student.fullName) }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-medium text-gray-900 dark:text-white truncate">
                        {{ row.student.fullName }}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {{ row.student.organization }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Посещаемость -->
                <td class="px-4 py-4 text-center">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-sm font-medium',
                      row.totalAttendancePercent >= 75
                        ? 'bg-success/10 text-success'
                        : row.totalAttendancePercent >= 50
                          ? 'bg-warning/10 text-warning'
                          : 'bg-danger/10 text-danger'
                    ]"
                  >
                    {{ row.totalAttendancePercent.toFixed(0) }}%
                  </span>
                </td>

                <!-- Дисциплин пройдено -->
                <td class="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  {{ row.eligibility.completedDisciplines }}/{{ row.eligibility.totalDisciplines }}
                </td>

                <!-- Средний балл -->
                <td class="px-4 py-4 text-center">
                  <span v-if="row.averageGrade !== null" class="font-medium text-gray-900 dark:text-white">
                    {{ row.averageGrade.toFixed(1) }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>

                <!-- Допуск -->
                <td class="px-4 py-4 text-center">
                  <div v-if="row.eligibility.isEligible" class="flex items-center justify-center gap-1 text-success">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm">Допущен</span>
                  </div>
                  <button
                    v-else
                    @click="showWarnings(row)"
                    class="flex items-center justify-center gap-1 text-warning hover:text-warning/80"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="text-sm">{{ row.eligibility.warnings.length }} замеч.</span>
                  </button>
                </td>

                <!-- Статус сертификата -->
                <td class="px-4 py-4 text-center">
                  <span
                    v-if="row.certificate"
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      row.certificate.status === 'issued'
                        ? 'bg-success/10 text-success'
                        : row.certificate.status === 'revoked'
                          ? 'bg-danger/10 text-danger'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    ]"
                  >
                    {{ certificateStatusLabels[row.certificate.status] }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">Не выдан</span>
                </td>

                <!-- Действия -->
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <!-- Скачать (показываем для выданных сертификатов) -->
                    <a
                      v-if="row.certificate?.status === 'issued'"
                      :href="`/api/certificates/download/${row.certificate.id}`"
                      target="_blank"
                      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary transition-colors"
                      title="Скачать сертификат"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>

                    <!-- Выдать -->
                    <button
                      v-if="!row.certificate || row.certificate.status !== 'issued'"
                      @click="issueSingle(row)"
                      :disabled="!template || isIssuing || issuingStudentId === row.student.id"
                      class="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Выдать сертификат"
                    >
                      <!-- Спиннер при выдаче этому студенту -->
                      <svg v-if="issuingStudentId === row.student.id" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Модалка предупреждений -->
    <CertificatesWarningsModal
      :is-open="warningsModalOpen"
      :student="selectedStudent"
      :warnings="selectedWarnings"
      @close="warningsModalOpen = false"
      @confirm="handleIssueWithWarnings"
    />

    <!-- Модалка результатов (для одиночной выдачи) -->
    <CertificatesResultsModal
      :is-open="resultsModalOpen"
      :results="issueResults"
      @close="resultsModalOpen = false"
    />

    <!-- Модалка массовой выдачи с прогресс-баром -->
    <CertificatesBulkIssueModal
      ref="bulkIssueModalRef"
      :is-open="bulkIssueModalOpen"
      :students-count="bulkIssueStudentIds.length"
      :template-name="template?.name || ''"
      @close="bulkIssueModalOpen = false"
      @confirm="executeBulkIssue"
      @complete="handleBulkIssueComplete"
    />
  </div>
</template>

<script setup lang="ts">
import type { 
  CertificateTemplate, 
  CertificateJournalRow, 
  IssueWarning,
  CertificateJournalResponse,
  IssueCertificatesResponse,
} from '~/types/certificate';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Route params
const groupId = computed(() => route.params.id as string);

// State
const loading = ref(true);
const group = ref<CertificateJournalResponse['group'] | null>(null);
const journal = ref<CertificateJournalRow[]>([]);
const stats = ref({
  totalStudents: 0,
  eligible: 0,
  withWarnings: 0,
  issued: 0,
  revoked: 0,
});

// Template (теперь берётся из курса)
const template = ref<CertificateTemplate | null>(null);

// Issue settings
const issueDate = ref(new Date().toISOString().split('T')[0]); // Сегодняшняя дата

// Selection
const selectedStudentIds = ref<string[]>([]);

// Issue state
const isIssuing = ref(false);
const issuingStudentId = ref<string | null>(null);
const issueResults = ref<IssueCertificatesResponse['results']>([]);
const resultsModalOpen = ref(false);

// Bulk issue modal
const bulkIssueModalOpen = ref(false);
const bulkIssueModalRef = ref<any>(null);
const bulkIssueStudentIds = ref<string[]>([]);
const bulkIssueMode = ref<'eligible' | 'selected'>('eligible');

// Warnings modal
const warningsModalOpen = ref(false);
const selectedStudent = ref<CertificateJournalRow['student'] | null>(null);
const selectedWarnings = ref<IssueWarning[]>([]);
const pendingIssueStudentId = ref<string | null>(null);

// Labels
const certificateStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  issued: 'Выдан',
  revoked: 'Отозван',
};

// Computed
const isAllSelected = computed(() => {
  const available = journal.value.filter(r => r.certificate?.status !== 'issued');
  return available.length > 0 && available.every(r => selectedStudentIds.value.includes(r.student.id));
});

const isPartialSelected = computed(() => {
  if (isAllSelected.value) return false;
  return selectedStudentIds.value.length > 0;
});

// Количество допущенных без сертификата
const eligibleWithoutCertificate = computed(() => {
  return journal.value.filter(r => 
    r.eligibility.isEligible && 
    r.certificate?.status !== 'issued'
  ).length;
});

// Title
useHead(() => ({
  title: group.value 
    ? `Выдача сертификатов — ${group.value.code}`
    : 'Загрузка...',
}));

// Load data
const loadData = async () => {
  loading.value = true;
  try {
    const journalRes = await authFetch<CertificateJournalResponse>(`/api/certificates/issue/${groupId.value}`);

    if (journalRes.success) {
      group.value = journalRes.group;
      journal.value = journalRes.journal;
      stats.value = journalRes.stats;
      template.value = journalRes.template;
    }
  } catch (e: any) {
    console.error('Error loading data:', e);
    showError(e.message || 'Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

// Helpers
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
};

// Selection handlers
const toggleSelectAll = () => {
  const available = journal.value.filter(r => r.certificate?.status !== 'issued');
  if (isAllSelected.value) {
    selectedStudentIds.value = [];
  } else {
    selectedStudentIds.value = available.map(r => r.student.id);
  }
};

const toggleStudent = (studentId: string) => {
  const idx = selectedStudentIds.value.indexOf(studentId);
  if (idx === -1) {
    selectedStudentIds.value.push(studentId);
  } else {
    selectedStudentIds.value.splice(idx, 1);
  }
};

// Show warnings
const showWarnings = (row: CertificateJournalRow) => {
  selectedStudent.value = row.student;
  selectedWarnings.value = row.eligibility.warnings;
  pendingIssueStudentId.value = null;
  warningsModalOpen.value = true;
};

// Issue single
const issueSingle = (row: CertificateJournalRow) => {
  if (isIssuing.value || issuingStudentId.value) return;

  if (!template.value) {
    showError('Шаблон сертификата не назначен для курса');
    return;
  }

  if (!row.eligibility.isEligible) {
    selectedStudent.value = row.student;
    selectedWarnings.value = row.eligibility.warnings;
    pendingIssueStudentId.value = row.student.id;
    warningsModalOpen.value = true;
    return;
  }

  issuingStudentId.value = row.student.id;
  issueToStudents([row.student.id], false);
};

// Issue with warnings
const handleIssueWithWarnings = () => {
  if (isIssuing.value || issuingStudentId.value) return;

  if (pendingIssueStudentId.value) {
    issuingStudentId.value = pendingIssueStudentId.value;
    issueToStudents([pendingIssueStudentId.value], true);
  }
  warningsModalOpen.value = false;
};

// Открыть модалку массовой выдачи
const openBulkIssueModal = (mode: 'eligible' | 'selected') => {
  // Защита от открытия во время обработки
  if (isIssuing.value) {
    console.warn('[Certificates] Выдача уже выполняется');
    return;
  }

  if (!template.value) {
    showError('Шаблон сертификата не назначен для курса');
    return;
  }

  bulkIssueMode.value = mode;
  
  if (mode === 'eligible') {
    // Все допущенные без сертификата
    bulkIssueStudentIds.value = journal.value
      .filter(r => r.eligibility.isEligible && r.certificate?.status !== 'issued')
      .map(r => r.student.id);
  } else {
    // Выбранные
    bulkIssueStudentIds.value = [...selectedStudentIds.value];
  }

  if (bulkIssueStudentIds.value.length === 0) {
    showError('Нет студентов для выдачи сертификатов');
    return;
  }

  bulkIssueModalOpen.value = true;
};

// Выполнить массовую выдачу с прогрессом
const executeBulkIssue = async () => {
  // Защита от двойного вызова
  if (isIssuing.value) {
    console.warn('[Certificates] executeBulkIssue уже выполняется, пропускаем');
    return;
  }
  
  if (!template.value || !bulkIssueModalRef.value) return;

  isIssuing.value = true;
  bulkIssueModalRef.value.startProcessing();

  const results: IssueCertificatesResponse['results'] = [];
  const processedStudentIds = new Set<string>(); // Защита от дублирования
  
  // Получаем данные студентов для отображения имён
  const studentRows = journal.value.filter(r => 
    bulkIssueStudentIds.value.includes(r.student.id)
  );

  console.log(`[Certificates] Начинаем массовую выдачу: ${studentRows.length} студентов`);

  for (let i = 0; i < studentRows.length; i++) {
    const row = studentRows[i];
    
    // Пропускаем если уже обработали этого студента
    if (processedStudentIds.has(row.student.id)) {
      console.warn(`[Certificates] Студент ${row.student.fullName} уже обработан, пропускаем`);
      continue;
    }
    
    processedStudentIds.add(row.student.id);
    
    // Обновляем прогресс
    bulkIssueModalRef.value.updateProgress(row.student.fullName, i + 1);

    try {
      const response = await authFetch<IssueCertificatesResponse>(
        `/api/certificates/issue/${groupId.value}`,
        {
          method: 'POST',
          body: {
            templateId: template.value.id,
            studentIds: [row.student.id],
            issueDate: issueDate.value,
            expiryMode: group.value?.course?.certificateValidityMonths ? 'auto' : 'none',
            overrideWarnings: !row.eligibility.isEligible,
          },
        }
      );

      if (response.success && response.results.length > 0) {
        const result = response.results[0];
        results.push(result);
        bulkIssueModalRef.value.addResult(result);
      }
    } catch (e: any) {
      console.error(`Error issuing certificate for ${row.student.fullName}:`, e);
      const errorResult = {
        studentId: row.student.id,
        studentName: row.student.fullName,
        success: false,
        error: e.data?.message || e.message || 'Ошибка выдачи',
      };
      results.push(errorResult);
      bulkIssueModalRef.value.addResult(errorResult);
    }

    // Небольшая задержка между запросами для снижения нагрузки
    if (i < studentRows.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Завершаем обработку
  bulkIssueModalRef.value.completeProcessing(results);
  isIssuing.value = false;
};

// Обработка завершения массовой выдачи
const handleBulkIssueComplete = async (results: IssueCertificatesResponse['results']) => {
  const successCount = results.filter(r => r.success).length;
  
  // Clear selection
  selectedStudentIds.value = [];
  
  // Reload data
  await loadData();
  
  if (successCount > 0) {
    showSuccess(`Выдано ${successCount} сертификатов`);
  }
};

// Issue to students (для одиночной выдачи)
const issueToStudents = async (studentIds: string[], overrideWarnings: boolean) => {
  isIssuing.value = true;
  try {
    const response = await authFetch<IssueCertificatesResponse>(
      `/api/certificates/issue/${groupId.value}`,
      {
        method: 'POST',
        body: {
          templateId: template.value!.id,
          studentIds,
          issueDate: issueDate.value,
          expiryMode: group.value?.course?.certificateValidityMonths ? 'auto' : 'none',
          overrideWarnings,
        },
      }
    );

    if (response.success) {
      issueResults.value = response.results;
      resultsModalOpen.value = true;
      
      // Reload data
      await loadData();
      
      showSuccess(response.message);
    }
  } catch (e: any) {
    console.error('Issue error:', e);
    showError(e.data?.message || e.message || 'Ошибка выдачи сертификатов');
  } finally {
    isIssuing.value = false;
    issuingStudentId.value = null;
  }
};

// Load on mount
onMounted(() => {
  loadData();
});
</script>
