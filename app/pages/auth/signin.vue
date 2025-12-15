<template>
  <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
    <div class="relative flex  justify-center w-full min-h-screen lg:flex-row dark:bg-gray-900">
      <!-- Левая часть - форма входа -->
      <div class="flex flex-col flex-1 w-full lg:w-1/2">
        <div class="flex flex-col justify-center flex-1 w-full max-w-md px-6 mx-auto py-12">
          <div>
            <!-- Заголовок -->
            <div class="mb-8 text-center">
              <h1 class="mb-2 text-3xl font-bold text-gray-800 dark:text-white">
                Вход в систему
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Учебно-тренировочный центр АТЦ
              </p>
            </div>

            <!-- Сообщение об ошибке -->
            <div
              v-if="errorMessage"
              class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div class="flex items-start">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800 dark:text-red-200">
                    {{ errorMessage }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Форма -->
            <form @submit.prevent="handleSubmit" class="space-y-5">
              <!-- Email -->
              <div>
                <label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.email"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="admin@atc.uz"
                  required
                  :disabled="isLoading"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600"
                />
              </div>

              <!-- Пароль -->
              <div>
                <label for="password" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Пароль <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="formData.password"
                    :type="showPassword ? 'text' : 'password'"
                    id="password"
                    name="password"
                    placeholder="Введите пароль"
                    required
                    :disabled="isLoading"
                    class="h-11 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-11 text-sm text-gray-800 dark:text-white shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600"
                  />
                  <button
                    type="button"
                    @click="togglePasswordVisibility"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                    :disabled="isLoading"
                  >
                    <IconsEyeIcon v-if="!showPassword" class="w-5 h-5" />
                    <IconsEyeOffIcon v-else class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Запомнить меня -->
              <div class="flex items-center">
                <label
                  for="keepLoggedIn"
                  class="flex items-center text-sm font-normal text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                >
                  <div class="relative">
                    <input
                      v-model="formData.keepLoggedIn"
                      type="checkbox"
                      id="keepLoggedIn"
                      class="sr-only"
                      :disabled="isLoading"
                    />
                    <div
                      :class="[
                        'mr-3 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                        formData.keepLoggedIn
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600 bg-transparent'
                      ]"
                    >
                      <svg
                        v-if="formData.keepLoggedIn"
                        class="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  Запомнить меня
                </label>
              </div>

              <!-- Кнопка входа -->
              <div>
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white transition-all rounded-lg bg-primary hover:bg-opacity-90 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    v-if="isLoading"
                    class="w-5 h-5 mr-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ isLoading ? 'Вход...' : 'Войти в систему' }}
                </button>
              </div>
            </form>

            <!-- Подсказка -->
            <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p class="text-xs text-blue-800 dark:text-blue-200">
                <strong>Тестовый доступ:</strong><br>
                Email: admin@atc.uz<br>
                Пароль: admin123
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'fullscreen',
  title: 'Вход в систему'
})

useHead({
  title: 'Вход в систему - АТЦ Платформа'
})

const { login } = useAuth();
const router = useRouter();

// Состояние формы
const formData = reactive({
  email: '',
  password: '',
  keepLoggedIn: false,
});

const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

// Переключение видимости пароля
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Обработка отправки формы
const handleSubmit = async () => {
  // Очистка предыдущих ошибок
  errorMessage.value = '';

  // Валидация
  if (!formData.email || !formData.password) {
    errorMessage.value = 'Пожалуйста, заполните все поля';
    return;
  }

  isLoading.value = true;

  try {
    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      // Успешный вход - редирект на главную или на страницу из query параметра
      const route = useRoute();
      const redirectTo = (route.query.redirect as string) || '/';
      await router.push(redirectTo);
    } else {
      // Ошибка входа
      errorMessage.value = result.error || 'Неверный email или пароль';
    }
  } catch (error: any) {
    console.error('Login error:', error);
    errorMessage.value = 'Ошибка подключения к серверу. Попробуйте позже.';
  } finally {
    isLoading.value = false;
  }
};
</script>
