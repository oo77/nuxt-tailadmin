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

                <!-- Секция создания учётной записи (только при создании нового инструктора) -->
                <div v-if="!isEditMode" class="sm:col-span-2 mt-6 pt-6 border-t-2 border-primary/30 dark:border-primary/20">
                  <div class="flex items-center justify-between mb-4 bg-primary/5 dark:bg-primary/10 p-4 rounded-lg">
                    <div>
                      <h4 class="text-lg font-bold text-primary dark:text-primary">
                        🔐 Учётная запись для входа
                      </h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Создать логин и пароль для входа в систему с ролью TEACHER
                      </p>
                    </div>
                    <label class="flex items-center gap-3 cursor-pointer">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {{ formData.createAccount ? 'Включено' : 'Отключено' }}
                      </span>
                      <input
                        v-model="formData.createAccount"
                        type="checkbox"
                        class="sr-only"
                      />
                      <div
                        :class="[
                          'relative h-7 w-12 rounded-full transition-colors',
                          formData.createAccount ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                        ]"
                      >
                        <div
                          :class="[
                            'absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform shadow-md',
                            formData.createAccount ? 'translate-x-5' : 'translate-x-0.5'
                          ]"
                        ></div>
                      </div>
                    </label>
                  </div>

                  <!-- Поля учётной записи (показываются при createAccount = true) -->
                  <Transition
                    enter-active-class="transition-all duration-300 ease-out"
                    enter-from-class="opacity-0 max-h-0"
                    enter-to-class="opacity-100 max-h-96"
                    leave-active-class="transition-all duration-200 ease-in"
                    leave-from-class="opacity-100 max-h-96"
                    leave-to-class="opacity-0 max-h-0"
                  >
                    <div v-if="formData.createAccount" class="grid grid-cols-1 gap-4 sm:grid-cols-2 overflow-hidden mt-4">
                      <!-- Email для аккаунта -->
                      <div>
                        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
                          📧 Email для входа <span class="text-danger">*</span>
                        </label>
                        <input
                          v-model="formData.accountEmail"
                          type="email"
                          placeholder="Будет использоваться для входа"
                          class="w-full rounded-lg border-2 border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          :class="{ 'border-danger': errors.accountEmail }"
                        />
                        <p v-if="errors.accountEmail" class="mt-1 text-sm text-danger">
                          {{ errors.accountEmail[0] }}
                        </p>
                        <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Если не указан — будет использован email инструктора
                        </p>
                      </div>

                      <!-- Пароль / Автогенерация -->
                      <div>
                        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
                          🔑 Пароль
                        </label>
                        
                        <!-- Чекбокс автогенерации -->
                        <label class="flex items-center gap-2 mb-2 cursor-pointer bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <input
                            v-model="formData.autoGeneratePassword"
                            type="checkbox"
                            class="w-4 h-4 rounded border-stroke dark:border-form-strokedark text-primary focus:ring-primary"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            Сгенерировать автоматически
                          </span>
                        </label>

                        <input
                          v-if="!formData.autoGeneratePassword"
                          v-model="formData.accountPassword"
                          type="password"
                          placeholder="Минимум 8 символов"
                          class="w-full rounded-lg border-2 border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          :class="{ 'border-danger': errors.accountPassword }"
                        />
                        <p v-if="errors.accountPassword" class="mt-1 text-sm text-danger">
                          {{ errors.accountPassword[0] }}
                        </p>
                        <p v-else-if="formData.autoGeneratePassword" class="text-xs text-success dark:text-success">
                          ✓ Пароль будет сгенерирован и показан после создания
                        </p>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Секция смены пароля (только при редактировании, если есть связанный аккаунт) -->
                <div v-if="isEditMode && props.instructor?.userId" class="sm:col-span-2 mt-6 pt-6 border-t-2 border-warning/30 dark:border-warning/20">
                  <div class="flex items-center justify-between mb-4 bg-warning/5 dark:bg-warning/10 p-4 rounded-lg">
                    <div>
                      <h4 class="text-lg font-bold text-warning dark:text-warning">
                        🔄 Изменение пароля
                      </h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Сбросить пароль для учётной записи инструктора
                      </p>
                    </div>
                    <label class="flex items-center gap-3 cursor-pointer">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {{ formData.changePassword ? 'Да' : 'Нет' }}
                      </span>
                      <input
                        v-model="formData.changePassword"
                        type="checkbox"
                        class="sr-only"
                      />
                      <div
                        :class="[
                          'relative h-7 w-12 rounded-full transition-colors',
                          formData.changePassword ? 'bg-warning' : 'bg-gray-300 dark:bg-gray-600'
                        ]"
                      >
                        <div
                          :class="[
                            'absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform shadow-md',
                            formData.changePassword ? 'translate-x-5' : 'translate-x-0.5'
                          ]"
                        ></div>
                      </div>
                    </label>
                  </div>

                  <!-- Поля смены пароля -->
                  <Transition
                    enter-active-class="transition-all duration-300 ease-out"
                    enter-from-class="opacity-0 max-h-0"
                    enter-to-class="opacity-100 max-h-96"
                    leave-active-class="transition-all duration-200 ease-in"
                    leave-from-class="opacity-100 max-h-96"
                    leave-to-class="opacity-0 max-h-0"
                  >
                    <div v-if="formData.changePassword" class="grid grid-cols-1 gap-4 sm:grid-cols-2 overflow-hidden mt-4">
                      <!-- Новый пароль -->
                      <div>
                        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
                          🔑 Новый пароль
                        </label>
                        
                        <label class="flex items-center gap-2 mb-2 cursor-pointer bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <input
                            v-model="formData.autoGenerateNewPassword"
                            type="checkbox"
                            class="w-4 h-4 rounded border-stroke dark:border-form-strokedark text-warning focus:ring-warning"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            Сгенерировать автоматически
                          </span>
                        </label>

                        <input
                          v-if="!formData.autoGenerateNewPassword"
                          v-model="formData.newPassword"
                          type="password"
                          placeholder="Минимум 8 символов"
                          class="w-full rounded-lg border-2 border-stroke bg-transparent py-3 px-5 outline-none focus:border-warning dark:border-form-strokedark dark:bg-form-input dark:focus:border-warning"
                          :class="{ 'border-danger': errors.newPassword }"
                        />
                        <p v-if="errors.newPassword" class="mt-1 text-sm text-danger">
                          {{ errors.newPassword[0] }}
                        </p>
                        <p v-else-if="formData.autoGenerateNewPassword" class="text-xs text-warning dark:text-warning">
                          ✓ Новый пароль будет показан после сохранения
                        </p>
                      </div>

                      <!-- Подтверждение пароля (только если не автогенерация) -->
                      <div v-if="!formData.autoGenerateNewPassword">
                        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
                          🔑 Подтвердите пароль
                        </label>
                        <input
                          v-model="formData.confirmNewPassword"
                          type="password"
                          placeholder="Повторите новый пароль"
                          class="w-full rounded-lg border-2 border-stroke bg-transparent py-3 px-5 outline-none focus:border-warning dark:border-form-strokedark dark:bg-form-input dark:focus:border-warning"
                          :class="{ 'border-danger': errors.confirmNewPassword }"
                        />
                        <p v-if="errors.confirmNewPassword" class="mt-1 text-sm text-danger">
                          {{ errors.confirmNewPassword[0] }}
                        </p>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Кнопка создания аккаунта (для существующего инструктора без аккаунта) -->
                <div v-if="isEditMode && !props.instructor?.userId" class="sm:col-span-2 mt-6 pt-6 border-t border-stroke dark:border-strokedark">
                  <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <p class="text-gray-600 dark:text-gray-400 mb-3">
                      У этого инструктора нет учётной записи для входа в систему
                    </p>
                    <UiButton
                      variant="primary"
                      size="sm"
                      @click="formData.createAccountForExisting = true"
                      v-if="!formData.createAccountForExisting"
                    >
                      Создать учётную запись
                    </UiButton>
                    
                    <!-- Поля для создания аккаунта существующему инструктору -->
                    <div v-if="formData.createAccountForExisting" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                      <div>
                        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
                          📧 Email для входа
                        </label>
                        <input
                          v-model="formData.accountEmail"
                          type="email"
                          :placeholder="props.instructor?.email || 'email@example.com'"
                          class="w-full rounded-lg border-2 border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                      </div>
                      <div>
                        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
                          🔑 Пароль
                        </label>
                        <label class="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            v-model="formData.autoGeneratePassword"
                            type="checkbox"
                            class="w-4 h-4 rounded"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            Сгенерировать автоматически
                          </span>
                        </label>
                        <input
                          v-if="!formData.autoGeneratePassword"
                          v-model="formData.accountPassword"
                          type="password"
                          placeholder="Минимум 8 символов"
                          class="w-full rounded-lg border-2 border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
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
  // Поля для создания учётной записи (новый инструктор)
  createAccount: true, // По умолчанию включено для удобства
  accountEmail: '',
  accountPassword: '',
  autoGeneratePassword: true,
  // Поля для смены пароля (редактирование инструктора с аккаунтом)
  changePassword: false,
  newPassword: '',
  confirmNewPassword: '',
  autoGenerateNewPassword: true,
  // Создание аккаунта для существующего инструктора
  createAccountForExisting: false,
});

// Вспомогательная функция для форматирования даты
const formatDateForInputLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      
      // Подготовка данных для смены пароля
      let passwordData: any = {};
      if (formData.changePassword && props.instructor?.userId) {
        // Валидация нового пароля
        if (!formData.autoGenerateNewPassword) {
          if (!formData.newPassword || formData.newPassword.length < 8) {
            errors.newPassword = ['Пароль должен быть минимум 8 символов'];
            notification.error('Пароль должен быть минимум 8 символов', 'Ошибка');
            loading.value = false;
            return;
          }
          if (formData.newPassword !== formData.confirmNewPassword) {
            errors.confirmNewPassword = ['Пароли не совпадают'];
            notification.error('Пароли не совпадают', 'Ошибка');
            loading.value = false;
            return;
          }
        }
        passwordData = {
          changePassword: true,
          newPassword: formData.autoGenerateNewPassword ? undefined : formData.newPassword,
          autoGenerateNewPassword: formData.autoGenerateNewPassword,
        };
      }
      
      // Подготовка данных для создания аккаунта существующему инструктору
      let createAccountData: any = {};
      if (formData.createAccountForExisting && !props.instructor?.userId) {
        createAccountData = {
          createAccount: true,
          accountEmail: formData.accountEmail || formData.email || undefined,
          accountPassword: formData.autoGeneratePassword ? undefined : formData.accountPassword,
          autoGeneratePassword: formData.autoGeneratePassword,
        };
      }
      
      const response = await $fetch<{ 
        success: boolean; 
        message?: string; 
        errors?: any; 
        field?: string;
        generatedPassword?: string;
        accountEmail?: string;
      }>(`/api/instructors/${props.instructor!.id}`, {
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
          ...passwordData,
          ...createAccountData,
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
      
      // Показываем сгенерированный пароль если он есть
      if (response.generatedPassword && response.accountEmail) {
        notification.success(
          `Учётные данные:\nEmail: ${response.accountEmail}\nПароль: ${response.generatedPassword}`,
          formData.changePassword ? 'Пароль изменён' : 'Аккаунт создан',
          15000
        );
      } else {
        notification.success('Инструктор успешно обновлен', 'Успех');
      }
    } else {
      // Создание инструктора
      const { token } = useAuth();
      
      const response = await $fetch<{ 
        success: boolean; 
        message?: string; 
        errors?: any; 
        field?: string;
        generatedPassword?: string;
        accountEmail?: string;
      }>('/api/instructors', {
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
          // Поля учётной записи
          createAccount: formData.createAccount,
          accountEmail: formData.createAccount ? (formData.accountEmail || formData.email || undefined) : undefined,
          accountPassword: formData.createAccount && !formData.autoGeneratePassword ? formData.accountPassword : undefined,
          autoGeneratePassword: formData.createAccount ? formData.autoGeneratePassword : undefined,
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
      
      // Показываем сгенерированный пароль, если он есть
      if (response.generatedPassword && response.accountEmail) {
        notification.success(
          `Учётная запись создана!\nEmail: ${response.accountEmail}\nПароль: ${response.generatedPassword}`,
          'Инструктор и аккаунт созданы',
          10000 // Показываем дольше для копирования
        );
      } else if (formData.createAccount) {
        notification.success('Инструктор и учётная запись успешно созданы', 'Успех');
      } else {
        notification.success('Инструктор успешно создан', 'Успех');
      }
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
        : formatDateForInputLocal(props.instructor.hireDate))
      : '';
    formData.contractInfo = props.instructor.contractInfo || '';
    formData.maxHours = props.instructor.maxHours || 0;
    formData.isActive = props.instructor.isActive;
  }
});
</script>
