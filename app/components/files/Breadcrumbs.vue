<template>
  <nav class="flex items-center gap-2 text-sm mb-4">
    <button
      @click="navigateTo(null)"
      class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
      title="Корень"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>

    <template v-for="(segment, index) in pathSegments" :key="index">
      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>

      <button
        v-if="index < pathSegments.length - 1"
        @click="navigateTo(segment.id)"
        class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium"
      >
        {{ segment.name }}
      </button>
      <span
        v-else
        class="text-black dark:text-white font-semibold"
      >
        {{ segment.name }}
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface BreadcrumbSegment {
  id: number | null;
  name: string;
}

interface BreadcrumbsProps {
  path: string;
  currentFolderId: number | null;
}

const props = defineProps<BreadcrumbsProps>();

const emit = defineEmits<{
  navigate: [folderId: number | null];
}>();

// Разбор пути на сегменты
const pathSegments = computed(() => {
  if (!props.path || props.path === '/') {
    return [];
  }

  const parts = props.path.split('/').filter(Boolean);
  const segments: BreadcrumbSegment[] = [];

  parts.forEach((name, index) => {
    segments.push({
      id: null, // В реальности нужно получать ID из структуры папок
      name,
    });
  });

  return segments;
});

const navigateTo = (folderId: number | null) => {
  emit('navigate', folderId);
};
</script>
