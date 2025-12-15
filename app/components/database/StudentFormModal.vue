<template>
  <UiModal :is-open="isOpen" @close="$emit('close')" :title="modalTitle">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Ф.И.О -->
      <div>
        <label for="fullName" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Ф.И.О <span class="text-danger">*</span>
        </label>
        <input
          id="fullName"
          v-model="formData.fullName"
          type="text"
          placeholder="Введите полное имя"
          required
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': errors.fullName }"
        />
        <p v-if="errors.fullName" class="mt-1 text-sm text-danger">
          {{ errors.fullName }}
        </p>
      </div>

      <!-- ПИНФЛ -->
      <div>
        <label for="pinfl" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          ПИНФЛ <span class="text-danger">*</span>
        </label>
        <input
          id="pinfl"
          v-model="formData.pinfl"
          type="text"
          placeholder="14-значный ПИНФЛ"
          required
          maxlength="14"
          pattern="[0-9]{14}"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary font-mono"
          :class="{ 'border-danger': errors.pinfl }"
        />
        <p v-if="errors.pinfl" class="mt-1 text-sm text-danger">
          {{ errors.pinfl }}
        </p>
        <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
          14 цифр без пробелов
        </p>
      </div>

      <!-- Организация -->
      <div>
        <label for="organization" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Организация <span class="text-danger">*</span>
        </label>
        <input
          id="organization"
          v-model="formData.organization"
          type="text"
          placeholder="Введите название организации"
          required
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': errors.organization }"
        />
        <p v-if="errors.organization" class="mt-1 text-sm text-danger">
          {{ errors.organization }}
        </p>
      </div>

      <!-- Служба/Отдел -->
      <div>
        <label for="department" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Служба/Отдел
        </label>
        <input
          id="department"
          v-model="formData.department"
          type="text"
          placeholder="Введите название службы или отдела (необязательно)"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        />
      </div>

      <!-- Должность -->
      <div>
        <label for="position" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Должность <span class="text-danger">*</span>
        </label>
        <input
          id="position"
          v-model="formData.position"
          type="text"
          placeholder="Введите должность"
          required
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': errors.position }"
        />
        <p v-if="errors.position" class="mt-1 text-sm text-danger">
          {{ errors.position }}
        </p>
      </div>

      <!-- Общая ошибка -->
      <div v-if="errors.general" class="rounded-md bg-danger/10 p-4">
        <p class="text-sm text-danger">{{ errors.general }}</p>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-4">
        <UiButton
          type="button"
          variant="secondary"
          @click="$emit('close')"
          :disabled="isSubmitting"
        >
          Отмена
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
          class="min-w-[120px]"
        >
          <span v-if="!isSubmitting">{{ submitButtonText }}</span>
          <span v-else class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
            Сохранение...
          </span>
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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

// Состояние формы
const formData = ref<CreateStudentData>({
  fullName: '',
  pinfl: '',
  organization: '',
  department: '',
  position: '',
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

// Вычисляемые свойства
const modalTitle = computed(() => {
  return props.student ? 'Редактировать студента' : 'Добавить студента';
});

const submitButtonText = computed(() => {
  return props.student ? 'Сохранить' : 'Создать';
});

// Сброс формы
const resetForm = () => {
  formData.value = {
    fullName: '',
    pinfl: '',
    organization: '',
    department: '',
    position: '',
  };
  errors.value = {};
};

// Заполнение формы при редактировании
watch(
  () => props.student,
  (student) => {
    if (student) {
      formData.value = {
        fullName: student.fullName,
        pinfl: student.pinfl,
        organization: student.organization,
        department: student.department || '',
        position: student.position,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Валидация формы
const validateForm = (): boolean => {
  errors.value = {};

  if (!formData.value.fullName.trim()) {
    errors.value.fullName = 'Ф.И.О обязательно для заполнения';
  }

  if (!formData.value.pinfl.trim()) {
    errors.value.pinfl = 'ПИНФЛ обязателен для заполнения';
  } else if (!/^\d{14}$/.test(formData.value.pinfl)) {
    errors.value.pinfl = 'ПИНФЛ должен содержать ровно 14 цифр';
  }

  if (!formData.value.organization.trim()) {
    errors.value.organization = 'Организация обязательна для заполнения';
  }

  if (!formData.value.position.trim()) {
    errors.value.position = 'Должность обязательна для заполнения';
  }

  return Object.keys(errors.value).length === 0;
};

// Обработка отправки формы
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  errors.value = {};

  try {
    const submitData: CreateStudentData | UpdateStudentData = {
      fullName: formData.value.fullName.trim(),
      pinfl: formData.value.pinfl.trim(),
      organization: formData.value.organization.trim(),
      department: formData.value.department?.trim() || undefined,
      position: formData.value.position.trim(),
    };

    emit('submit', submitData);
  } catch (error) {
    console.error('Ошибка отправки формы:', error);
    errors.value.general = 'Произошла ошибка при сохранении данных';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
