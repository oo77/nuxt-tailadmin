<template>
  <span 
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      statusClasses[status]
    ]"
  >
    <span 
      :class="[
        'mr-1.5 h-1.5 w-1.5 rounded-full',
        dotClasses[status]
      ]"
    />
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['draft', 'published', 'closed', 'archived'].includes(value)
  }
})

const statusClasses = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  published: 'bg-success/10 text-success',
  closed: 'bg-warning/10 text-warning',
  archived: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
}

const dotClasses = {
  draft: 'bg-gray-400',
  published: 'bg-success',
  closed: 'bg-warning',
  archived: 'bg-gray-400'
}

const statusLabels = {
  draft: 'Черновик',
  published: 'Опубликовано',
  closed: 'Закрыто',
  archived: 'Архив'
}

const statusText = computed(() => statusLabels[props.status] || props.status)
</script>
