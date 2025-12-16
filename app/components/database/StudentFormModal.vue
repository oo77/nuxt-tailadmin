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

                <!-- Организация -->
                <div>
                  <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                    Организация <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="formData.organization"
                    type="text"
                    placeholder="Введите название организации"
                    class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    :class="{ 'border-danger': errors.organization }"
                    required
                  />
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

interface Props {
  student?: Student | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [data: CreateStudentData | UpdateStudentData];
}>();

// Состояние
const isSubmitting = ref(false);
const isVisible = ref(false);
const errors = reactive<Record<string, string[]>>({});
const notification = useNotification();

// Данные формы
const formData = reactive({
  fullName: '',
  pinfl: '',
  organization: '',
  department: '',
  position: '',
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
    const submitData: CreateStudentData | UpdateStudentData = {
      fullName: formData.fullName.trim(),
      pinfl: formData.pinfl.trim(),
      organization: formData.organization.trim(),
      department: formData.department?.trim() || undefined,
      position: formData.position.trim(),
    };

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
