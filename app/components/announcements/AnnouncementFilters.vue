<template>
  <div class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-5">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Поиск -->
      <div>
        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
          Поиск
        </label>
        <div class="relative">
          <input
            :value="modelValue.search"
            @input="updateFilter('search', $event.target.value)"
            type="text"
            placeholder="Поиск по названию..."
            class="w-full rounded border-[1.5px] border-stroke bg-transparent pl-10 pr-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Статус -->
      <div>
        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
          Статус
        </label>
        <div class="relative">
          <select
            :value="modelValue.status"
            @change="updateFilter('status', $event.target.value)"
            class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary appearance-none"
          >
            <option value="">Все статусы</option>
            <option value="draft">Черновик</option>
            <option value="published">Опубликовано</option>
            <option value="closed">Закрыто</option>
            <option value="archived">Архив</option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Тип -->
      <div>
        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
          Тип
        </label>
        <div class="relative">
          <select
            :value="modelValue.type"
            @change="updateFilter('type', $event.target.value)"
            class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary appearance-none"
          >
            <option value="">Все типы</option>
            <option value="single_group">Одна группа</option>
            <option value="multiple_groups">Несколько групп</option>
            <option value="program">Программа</option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Сортировка -->
      <div>
        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
          Сортировка
        </label>
        <div class="relative">
          <select
            :value="modelValue.sortBy"
            @change="updateFilter('sortBy', $event.target.value)"
            class="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary appearance-none"
          >
            <option value="createdAt:desc">Сначала новые</option>
            <option value="createdAt:asc">Сначала старые</option>
            <option value="title:asc">По названию (А-Я)</option>
            <option value="title:desc">По названию (Я-А)</option>
            <option value="publishedAt:desc">По дате публикации</option>
            <option value="requestDeadline:asc">По сроку заявок</option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Активные фильтры и сброс -->
    <div v-if="hasActiveFilters" class="mt-4 flex items-center justify-between pt-4 border-t border-stroke dark:border-strokedark">
      <div class="flex flex-wrap gap-2">
        <span 
          v-if="modelValue.search"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          Поиск: "{{ modelValue.search }}"
          <button
            @click="updateFilter('search', '')"
            class="hover:text-primary/80"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
        
        <span 
          v-if="modelValue.status"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          Статус: {{ statusLabels[modelValue.status] }}
          <button
            @click="updateFilter('status', '')"
            class="hover:text-primary/80"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
        
        <span 
          v-if="modelValue.type"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          Тип: {{ typeLabels[modelValue.type] }}
          <button
            @click="updateFilter('type', '')"
            class="hover:text-primary/80"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>

      <button
        @click="resetFilters"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Сбросить фильтры
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const statusLabels = {
  draft: 'Черновик',
  published: 'Опубликовано',
  closed: 'Закрыто',
  archived: 'Архив'
}

const typeLabels = {
  single_group: 'Одна группа',
  multiple_groups: 'Несколько групп',
  program: 'Программа'
}

const hasActiveFilters = computed(() => {
  return !!(
    props.modelValue.search ||
    props.modelValue.status ||
    props.modelValue.type ||
    (props.modelValue.sortBy && props.modelValue.sortBy !== 'createdAt:desc')
  )
})

const updateFilter = (key, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

const resetFilters = () => {
  emit('update:modelValue', {
    search: '',
    status: '',
    type: '',
    sortBy: 'createdAt:desc'
  })
}
</script>
