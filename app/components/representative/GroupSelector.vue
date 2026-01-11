<template>
  <div class="space-y-3">
    <div
      v-for="group in availableGroups"
      :key="group.id"
      class="relative"
    >
      <div
        :class="[
          'p-4 rounded-lg border-2 transition-all cursor-pointer',
          isGroupSelected(group.id)
            ? 'border-primary bg-primary/5'
            : 'border-stroke dark:border-strokedark hover:border-primary/50'
        ]"
        @click="toggleGroup(group)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <!-- Checkbox -->
            <div :class="[
              'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
              isGroupSelected(group.id) ? 'border-primary bg-primary' : 'border-gray-300'
            ]">
              <svg v-if="isGroupSelected(group.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <!-- Информация о группе -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ group.code }}</h4>
                <span
                  v-if="group.availableSlots === 0"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger/10 text-danger"
                >
                  Мест нет
                </span>
                <span
                  v-else-if="group.availableSlots <= 5"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning"
                >
                  Осталось {{ group.availableSlots }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ group.courseName }}</p>
              
              <div class="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDate(group.startDate) }} - {{ formatDate(group.endDate) }}
                </span>
                <span v-if="group.classroom" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {{ group.classroom }}
                </span>
              </div>
            </div>
          </div>

          <!-- Доступность мест -->
          <div class="text-right shrink-0">
            <p class="text-lg font-bold" :class="getCapacityColor(group)">
              {{ group.availableSlots || 0 }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              из {{ group.maxCapacity || 0 }}
            </p>
          </div>
        </div>

        <!-- Поле для количества мест (если группа выбрана) -->
        <div v-if="isGroupSelected(group.id)" class="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Количество мест <span class="text-danger">*</span>
          </label>
          <input
            type="number"
            :value="getGroupSlots(group.id)"
            @input="updateGroupSlots(group.id, $event.target.value)"
            @click.stop
            min="1"
            :max="group.availableSlots"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            placeholder="Введите количество мест"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Максимум: {{ group.availableSlots }} мест
          </p>
        </div>
      </div>
    </div>

    <!-- Сообщение если нет доступных групп -->
    <div v-if="availableGroups.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p>Нет доступных групп для выбора</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  announcement: {
    type: Object,
    required: true
  },
  selectedGroups: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedGroups'])

const availableGroups = computed(() => {
  return props.announcement.groups?.filter(g => g.availableSlots > 0) || []
})

const isGroupSelected = (groupId) => {
  return props.selectedGroups.some(g => g.groupId === groupId)
}

const getGroupSlots = (groupId) => {
  const group = props.selectedGroups.find(g => g.groupId === groupId)
  return group?.requestedSlots || 1
}

const toggleGroup = (group) => {
  const isSelected = isGroupSelected(group.id)
  
  if (isSelected) {
    // Убрать группу из выбранных
    const updated = props.selectedGroups.filter(g => g.groupId !== group.id)
    emit('update:selectedGroups', updated)
  } else {
    // Добавить группу в выбранные
    const updated = [
      ...props.selectedGroups,
      {
        groupId: group.id,
        requestedSlots: 1,
        employeeIds: []
      }
    ]
    emit('update:selectedGroups', updated)
  }
}

const updateGroupSlots = (groupId, value) => {
  const slots = parseInt(value) || 1
  const group = availableGroups.value.find(g => g.id === groupId)
  
  if (!group) return
  
  const maxSlots = group.availableSlots
  const validSlots = Math.max(1, Math.min(slots, maxSlots))
  
  const updated = props.selectedGroups.map(g => 
    g.groupId === groupId 
      ? { ...g, requestedSlots: validSlots }
      : g
  )
  
  emit('update:selectedGroups', updated)
}

const getCapacityColor = (group) => {
  const available = group.availableSlots || 0
  const total = group.maxCapacity || 1
  const percentage = (available / total) * 100
  
  if (percentage === 0) return 'text-danger'
  if (percentage <= 20) return 'text-warning'
  return 'text-success'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
