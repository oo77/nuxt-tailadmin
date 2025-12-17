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
                {{ isEditMode ? 'Редактировать' : 'Добавить' }} инструктора
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
                <!-- ФИО -->
                <div class="sm:col-span-2">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    ФИО <span class="text-danger">*</span>
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

                <!-- Email -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Email
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="email@example.com"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.email }"
                  />
                  <p v-if="errors.email" class="mt-1 text-sm text-danger">
                    {{ errors.email[0] }}
                  </p>
                </div>

                <!-- Телефон -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Номер телефона
                  </label>
                  <input
                    v-model="formData.phone"
                    type="tel"
                    placeholder="+998901234567"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.phone }"
                  />
                  <p v-if="errors.phone" class="mt-1 text-sm text-danger">
                    {{ errors.phone[0] }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Формат: +998XXXXXXXXX
                  </p>
                </div>

                <!-- Прием на работу -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Прием на работу
                  </label>
                  <input
                    v-model="formData.hireDate"
                    type="date"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.hireDate }"
                  />
                  <p v-if="errors.hireDate" class="mt-1 text-sm text-danger">
                    {{ errors.hireDate[0] }}
                  </p>
                </div>

                <!-- Максимальные часы -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Максимальные часы
                  </label>
                  <input
                    v-model.number="formData.maxHours"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.maxHours }"
                  />
                  <p v-if="errors.maxHours" class="mt-1 text-sm text-danger">
                    {{ errors.maxHours[0] }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Для отчетности о количестве часов обучения
                  </p>
                </div>

                <!-- Данные о трудовом договоре -->
                <div class="sm:col-span-2">
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Данные о трудовом договоре
                  </label>
                  <textarea
                    v-model="formData.contractInfo"
                    rows="4"
                    placeholder="Номер договора, дата заключения, условия и прочая информация"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary resize-none"
                    :class="{ 'border-danger': errors.contractInfo }"
                  ></textarea>
                  <p v-if="errors.contractInfo" class="mt-1 text-sm text-danger">
                    {{ errors.contractInfo[0] }}
                  </p>
                </div>

                <!-- Статус -->
                <div class="sm:col-span-2">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      v-model="formData.isActive"
                      type="checkbox"
                      class="sr-only"
                    />
                    <div
                      :class="[
                        'relative h-6 w-11 rounded-full transition-colors',
                        formData.isActive ? 'bg-success' : 'bg-gray-300 dark:bg-gray-600'
                      ]"
                    >
                      <div
                        :class="[
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                          formData.isActive ? 'translate-x-5' : 'translate-x-0.5'
                        ]"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-black dark:text-white">
                      Активен
                    </span>
                  </label>
                </div>
              </div>

              <!-- Кнопки -->
              <div class="mt-6 flex justify-end gap-4">
                <UiButton
                  variant="danger"
                  @click="handleClose"
                  :disabled="loading"
                >
                  Отмена
                </UiButton>
                <UiButton
                  variant="success"
                  type="submit"
                  :loading="loading"
                >
                  {{ isEditMode ? 'Сохранить' : 'Создать' }}
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
import type { Instructor } from '~/types/instructor';

interface Props {
  instructor: Instructor | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [];
}>();

// Состояние
const loading = ref(false);
const isVisible = ref(false);
const errors = reactive<Record<string, string[]>>({});
const notification = useNotification();

// Данные формы
const formData = reactive({
  fullName: '',
  email: '',
  phone: '',
  hireDate: '',
  contractInfo: '',
  maxHours: 0,
  isActive: true,
});

// Вычисляемые свойства
const isEditMode = computed(() => !!props.instructor);

// Валидация отдельных полей
const validateField = (field: string, value: string | number): string | null => {
  switch (field) {
    case 'fullName':
      if (!value || (typeof value === 'string' && value.trim().length < 2)) {
        return 'ФИО должно содержать минимум 2 символа';
      }
      break;
    
    case 'email':
      if (value && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Введите корректный email адрес';
        }
      }
      break;
    
    case 'phone':
      if (value && typeof value === 'string') {
        const phoneRegex = /^\+998\d{9}$/;
        if (!phoneRegex.test(value)) {
          return 'Номер телефона должен быть в формате +998XXXXXXXXX';
        }
      }
      break;
    
    case 'maxHours':
      if (typeof value === 'number' && value < 0) {
        return 'Максимальные часы не могут быть отрицательными';
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

const handleSubmit = async () => {
  // Очистка ошибок
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Валидация всех полей
  const fieldsToValidate = ['fullName', 'email', 'phone', 'maxHours'];

  let hasErrors = false;
  
  for (const field of fieldsToValidate) {
    const value = formData[field as keyof typeof formData];
    // Пропускаем boolean значения для валидации
    if (typeof value === 'boolean') continue;
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

  loading.value = true;

  try {
    if (isEditMode.value) {
      // Обновление инструктора
      const { token } = useAuth();
      
      const response = await $fetch<{ success: boolean; message?: string; errors?: any; field?: string }>(`/api/instructors/${props.instructor!.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: {
          fullName: formData.fullName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          hireDate: formData.hireDate || undefined,
          contractInfo: formData.contractInfo || undefined,
          maxHours: formData.maxHours,
          isActive: formData.isActive,
        },
      });
      
      // Проверяем успешность операции в ответе
      if (!response.success) {
        // Обработка ошибок валидации
        if (response.errors && Array.isArray(response.errors)) {
          response.errors.forEach((error: { field: string; message: string }) => {
            if (error.field) {
              errors[error.field] = [error.message];
            }
            notification.error(error.message, 'Ошибка валидации');
          });
        } else if (response.field) {
          errors[response.field] = [response.message || 'Ошибка'];
          notification.error(response.message || 'Ошибка', 'Ошибка валидации');
        } else {
          notification.error(response.message || 'Произошла ошибка при обновлении инструктора', 'Ошибка');
        }
        loading.value = false;
        return; // Важно: прерываем выполнение
      }
      
      notification.success('Инструктор успешно обновлен', 'Успех');
    } else {
      // Создание инструктора
      const { token } = useAuth();
      
      const response = await $fetch<{ success: boolean; message?: string; errors?: any; field?: string }>('/api/instructors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: {
          fullName: formData.fullName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          hireDate: formData.hireDate || undefined,
          contractInfo: formData.contractInfo || undefined,
          maxHours: formData.maxHours,
          isActive: formData.isActive,
        },
      });
      
      // Проверяем успешность операции в ответе
      if (!response.success) {
        // Обработка ошибок валидации
        if (response.errors && Array.isArray(response.errors)) {
          response.errors.forEach((error: { field: string; message: string }) => {
            if (error.field) {
              errors[error.field] = [error.message];
            }
            notification.error(error.message, 'Ошибка валидации');
          });
        } else if (response.field) {
          errors[response.field] = [response.message || 'Ошибка'];
          notification.error(response.message || 'Ошибка', 'Ошибка валидации');
        } else {
          notification.error(response.message || 'Произошла ошибка при создании инструктора', 'Ошибка');
        }
        loading.value = false;
        return; // Важно: прерываем выполнение
      }
      
      notification.success('Инструктор успешно создан', 'Успех');
    }

    emit('save');
    handleClose();
  } catch (error: any) {
    console.error('Error saving instructor:', error);
    
    // Обработка ошибок валидации с сервера
    if (error.data?.errors) {
      const serverErrors = error.data.errors;
      Object.assign(errors, serverErrors);
      
      // Показываем уведомление для каждой ошибки
      Object.entries(serverErrors).forEach(([field, messages]) => {
        const fieldLabels: Record<string, string> = {
          fullName: 'ФИО',
          email: 'Email',
          phone: 'Телефон',
          hireDate: 'Дата приема',
          contractInfo: 'Данные договора',
          maxHours: 'Максимальные часы',
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
    loading.value = false;
  }
};

// Инициализация формы при редактировании
onMounted(() => {
  // Показываем модальное окно с анимацией
  setTimeout(() => {
    isVisible.value = true;
  }, 10);

  if (props.instructor) {
    formData.fullName = props.instructor.fullName;
    formData.email = props.instructor.email || '';
    formData.phone = props.instructor.phone || '';
    formData.hireDate = props.instructor.hireDate 
      ? (typeof props.instructor.hireDate === 'string' 
        ? props.instructor.hireDate.split('T')[0]!
        : new Date(props.instructor.hireDate).toISOString().split('T')[0]!)
      : '';
    formData.contractInfo = props.instructor.contractInfo || '';
    formData.maxHours = props.instructor.maxHours || 0;
    formData.isActive = props.instructor.isActive;
  }
});
</script>
