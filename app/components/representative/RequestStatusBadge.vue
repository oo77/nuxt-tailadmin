<template>
  <span 
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all',
      statusConfig.bg,
      statusConfig.text,
    ]"
  >
    <span :class="['h-2 w-2 rounded-full', statusConfig.dot]"></span>
    <span>{{ statusConfig.label }}</span>
    
    <!-- Countdown for reserved status -->
    <span 
      v-if="status === 'reserved' && expiresAt" 
      class="ml-1 text-xs opacity-80"
    >
      ({{ countdown }})
    </span>
  </span>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['pending', 'reserved', 'approved', 'rejected', 'withdrawn', 'expired'].includes(value)
  },
  expiresAt: {
    type: [String, Date],
    default: null
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

// Configuration for each status
const statusConfigs = {
  pending: {
    label: 'На рассмотрении',
    bg: 'bg-warning/10 dark:bg-warning/20',
    text: 'text-warning dark:text-warning',
    dot: 'bg-warning animate-pulse'
  },
  reserved: {
    label: 'Забронировано',
    bg: 'bg-info/10 dark:bg-info/20',
    text: 'text-info dark:text-info',
    dot: 'bg-info animate-pulse'
  },
  approved: {
    label: 'Одобрена',
    bg: 'bg-success/10 dark:bg-success/20',
    text: 'text-success dark:text-success',
    dot: 'bg-success'
  },
  rejected: {
    label: 'Отклонена',
    bg: 'bg-danger/10 dark:bg-danger/20',
    text: 'text-danger dark:text-danger',
    dot: 'bg-danger'
  },
  withdrawn: {
    label: 'Отозвана',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400'
  },
  expired: {
    label: 'Истекла',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-500',
    dot: 'bg-gray-400'
  }
}

const statusConfig = computed(() => statusConfigs[props.status] || statusConfigs.pending)

// Countdown logic for reserved status
const countdown = ref('')
let countdownInterval = null

const updateCountdown = () => {
  if (!props.expiresAt) {
    countdown.value = ''
    return
  }

  const now = new Date()
  const expires = new Date(props.expiresAt)
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) {
    countdown.value = 'истекло'
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    countdown.value = `${days}д ${hours}ч`
  } else if (hours > 0) {
    countdown.value = `${hours}ч ${minutes}м`
  } else {
    countdown.value = `${minutes}м`
  }
}

onMounted(() => {
  if (props.status === 'reserved' && props.expiresAt) {
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 60000) // Update every minute
  }
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>
