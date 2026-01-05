<template>
  <Teleport to="body">
    <!-- Backdrop с анимацией -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5"
      >
        <!-- Модальное окно с анимацией -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isVisible"
            class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between">
              <h3 class="text-xl font-semibold text-black dark:text-white">
                {{ modalTitle }}
              </h3>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Форма -->
            <form @submit.prevent="handleSubmit" class="p-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Ф.И.О -->
                <div class="sm:col-span-2">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Ф.И.О <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.fullName"
                    type="text"
                    placeholder="Введите полное имя"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.fullName }"
                    required
                  />
                  <p v-if="errors.fullName" class="mt-1 text-sm text-danger">
                    {{ errors.fullName[0] }}
                  </p>
                </div>

                <!-- ПИНФЛ -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    ПИНФЛ <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.pinfl"
                    type="text"
                    placeholder="14-значный ПИНФЛ"
                    maxlength="14"
                    pattern="[0-9]{14}"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary font-mono"
                    :class="{ 'border-danger': errors.pinfl }"
                    required
                  />
                  <p v-if="errors.pinfl" class="mt-1 text-sm text-danger">
                    {{ errors.pinfl[0] }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    14 цифр без пробелов
                  </p>
                </div>

                <!-- Организация с автокомплитом -->
                <div class="relative">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Организация <span class="text-danger">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="formData.organization"
                      type="text"
                      placeholder="Введите название организации"
                      class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      :class="{ 'border-danger': errors.organization }"
                      required
                      autocomplete="off"
                      @input="onOrganizationInput"
                      @focus="showOrganizationDropdown = true"
                      @blur="hideDropdownWithDelay"
                    />
                    <!-- Индикатор загрузки -->
                    <div v-if="isLoadingOrganizations" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </div>
                  <!-- Dropdown с организациями -->
                  <div
                    v-if="showOrganizationDropdown && organizationSuggestions.length > 0"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <button
                      v-for="org in organizationSuggestions"
                      :key="org.id"
                      type="button"
                      class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark last:border-b-0"
                      @mousedown.prevent="selectOrganization(org)"
                    >
                      <div class="font-medium text-black dark:text-white">{{ org.name }}</div>
                      <div v-if="org.shortName" class="text-sm text-gray-500 dark:text-gray-400">
                        {{ org.shortName }}
                      </div>
                      <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {{ org.studentsCount }} слушателей
                      </div>
                    </button>
                  </div>
                  <!-- Подсказка: будет создана новая организация -->
                  <div
                    v-if="showOrganizationDropdown && formData.organization.trim() && organizationSuggestions.length === 0 && !isLoadingOrganizations"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg"
                  >
                    <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Будет создана новая организация: 
                        <span class="font-medium text-black dark:text-white">{{ formData.organization.trim() }}</span>
                      </span>
                    </div>
                  </div>
                  <p v-if="errors.organization" class="mt-1 text-sm text-danger">
                    {{ errors.organization[0] }}
                  </p>
                </div>

                <!-- Служба/Отдел -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Служба/Отдел
                  </label>
                  <input
                    v-model="formData.department"
                    type="text"
                    placeholder="Введите название службы или отдела"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>

                <!-- Должность -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Должность <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.position"
                    type="text"
                    placeholder="Введите должность"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.position }"
                    required
                  />
                  <p v-if="errors.position" class="mt-1 text-sm text-danger">
                    {{ errors.position[0] }}
                  </p>
                </div>

                <!-- Секция создания учётной записи (только при создании нового студента) -->
                <div v-if="!props.student" class="sm:col-span-2 mt-4 pt-4 border-t border-stroke dark:border-strokedark">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      v-model="formData.createAccount"
                      type="checkbox"
                      class="sr-only"
                    />
                    <div
                      :class="[
                        'relative h-6 w-11 rounded-full transition-colors',
                        formData.createAccount ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      ]"
                    >
                      <div
                        :class="[
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                          formData.createAccount ? 'translate-x-5' : 'translate-x-0.5'
                        ]"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-black dark:text-white">
                      Создать учётную запись для входа
                    </span>
                  </label>

                  <!-- Поле пароля -->
                  <div v-if="formData.createAccount" class="mt-4">
                    <label class="mb-2 block text-sm font-medium text-black dark:text-white">
                      Пароль <span class="text-danger">*</span>
                    </label>
                    <input
                      v-model="formData.accountPassword"
                      type="password"
                      placeholder="Минимум 8 символов"
                      class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      :class="{ 'border-danger': errors.accountPassword }"
                    />
                    <p v-if="errors.accountPassword" class="mt-1 text-sm text-danger">
                      {{ errors.accountPassword[0] }}
                    </p>
                    <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email для входа: {{ formData.pinfl ? `${formData.pinfl}@student.local` : 'ПИНФЛ@student.local' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Кнопки -->
              <div class="mt-6 flex justify-end gap-4">
                <UiButton
                  variant="danger"
                  @click="handleClose"
                  :disabled="isSubmitting"
                >
                  Отмена
                </UiButton>
                <UiButton
                  variant="success"
                  type="submit"
                  :loading="isSubmitting"
                >
                  {{ submitButtonText }}
                </UiButton>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { Student, CreateStudentData, UpdateStudentData } from '~/types/student';

// Интерфейс для организации
interface Organization {
  id: string;
  name: string;
  shortName: string | null;
  studentsCount: number;
}

interface Props {
  student?: Student | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [data: CreateStudentData | UpdateStudentData];
}>();

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();

// Состояние
const isSubmitting = ref(false);
const isVisible = ref(false);
const errors = reactive<Record<string, string[]>>({});
const notification = useNotification();

// Автокомплит организаций
const isLoadingOrganizations = ref(false);
const showOrganizationDropdown = ref(false);
const organizationSuggestions = ref<Organization[]>([]);
let organizationSearchTimer: ReturnType<typeof setTimeout> | null = null;

// Данные формы
const formData = reactive({
  fullName: '',
  pinfl: '',
  organization: '',
  department: '',
  position: '',
  // Поля для создания учётной записи
  createAccount: true, // По умолчанию включено для удобства
  accountPassword: '',
});

// Вычисляемые свойства
const modalTitle = computed(() => {
  return props.student ? 'Редактировать студента' : 'Добавить студента';
});

const submitButtonText = computed(() => {
  return props.student ? 'Сохранить' : 'Создать';
});

// Валидация отдельных полей
const validateField = (field: string, value: string): string | null => {
  switch (field) {
    case 'fullName':
      if (!value || value.trim().length < 2) {
        return 'Ф.И.О должно содержать минимум 2 символа';
      }
      break;
    
    case 'pinfl':
      if (!value || !/^\d{14}$/.test(value)) {
        return 'ПИНФЛ должен содержать ровно 14 цифр';
      }
      break;
    
    case 'organization':
      if (!value || value.trim().length < 2) {
        return 'Название организации обязательно для заполнения';
      }
      break;
    
    case 'position':
      if (!value || value.trim().length < 2) {
        return 'Должность обязательна для заполнения';
      }
      break;
  }
  
  return null;
};

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300); // Ждем завершения анимации
};

// Автокомплит организаций
const searchOrganizations = async (query: string) => {
  if (!query.trim()) {
    organizationSuggestions.value = [];
    return;
  }

  isLoadingOrganizations.value = true;
  try {
    const response = await authFetch<{ success: boolean; data: Organization[] }>(
      `/api/organizations/search?q=${encodeURIComponent(query.trim())}&limit=5`,
      { method: 'GET' }
    );

    if (response.success) {
      organizationSuggestions.value = response.data;
    }
  } catch (error) {
    console.error('Error searching organizations:', error);
    organizationSuggestions.value = [];
  } finally {
    isLoadingOrganizations.value = false;
  }
};

const onOrganizationInput = () => {
  // Debounce поиск
  if (organizationSearchTimer) {
    clearTimeout(organizationSearchTimer);
  }
  organizationSearchTimer = setTimeout(() => {
    searchOrganizations(formData.organization);
  }, 300);
};

const selectOrganization = (org: Organization) => {
  formData.organization = org.name;
  organizationSuggestions.value = [];
  showOrganizationDropdown.value = false;
};

const hideDropdownWithDelay = () => {
  // Задержка чтобы успеть кликнуть на элемент
  setTimeout(() => {
    showOrganizationDropdown.value = false;
  }, 200);
};

const handleSubmit = async () => {
  // Очистка ошибок
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Валидация всех полей
  const fieldsToValidate = ['fullName', 'pinfl', 'organization', 'position'];
  let hasErrors = false;
  
  for (const field of fieldsToValidate) {
    const value = formData[field as keyof typeof formData] as string;
    const error = validateField(field, value);
    
    if (error) {
      errors[field] = [error];
      notification.error(error, 'Ошибка валидации');
      hasErrors = true;
    }
  }

  if (hasErrors) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Базовые данные студента
    const submitData: any = {
      fullName: formData.fullName.trim(),
      pinfl: formData.pinfl.trim(),
      organization: formData.organization.trim(),
      department: formData.department?.trim() || undefined,
      position: formData.position.trim(),
    };

    // Добавляем поля учётной записи если нужно создать аккаунт
    if (formData.createAccount && !props.student) {
      // Валидация пароля
      if (!formData.accountPassword || formData.accountPassword.length < 8) {
        errors.accountPassword = ['Пароль должен быть минимум 8 символов'];
        notification.error('Пароль должен быть минимум 8 символов', 'Ошибка валидации');
        isSubmitting.value = false;
        return;
      }
      submitData.createAccount = true;
      submitData.accountPassword = formData.accountPassword;
    }

    emit('submit', submitData);
    
    // Уведомление об успехе будет показано в родительском компоненте
    handleClose();
  } catch (error: any) {
    console.error('Error saving student:', error);
    
    // Обработка ошибок валидации с сервера
    if (error.data?.errors) {
      const serverErrors = error.data.errors;
      Object.assign(errors, serverErrors);
      
      // Показываем уведомление для каждой ошибки
      Object.entries(serverErrors).forEach(([field, messages]) => {
        const fieldLabels: Record<string, string> = {
          fullName: 'Ф.И.О',
          pinfl: 'ПИНФЛ',
          organization: 'Организация',
          department: 'Служба/Отдел',
          position: 'Должность',
        };
        
        const fieldLabel = fieldLabels[field] || field;
        const message = Array.isArray(messages) ? messages[0] : messages;
        notification.error(`${fieldLabel}: ${message}`, 'Ошибка валидации');
      });
    } else {
      const errorMessage = error.data?.message || 'Произошла ошибка при сохранении';
      notification.error(errorMessage, 'Ошибка');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Инициализация формы при редактировании
onMounted(() => {
  // Показываем модальное окно с анимацией
  setTimeout(() => {
    isVisible.value = true;
  }, 10);

  if (props.student) {
    formData.fullName = props.student.fullName;
    formData.pinfl = props.student.pinfl;
    formData.organization = props.student.organization;
    formData.department = props.student.department || '';
    formData.position = props.student.position;
  }
});
</script>
