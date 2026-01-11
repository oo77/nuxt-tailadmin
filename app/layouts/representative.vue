<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white dark:bg-boxdark shadow-sm border-b border-stroke dark:border-strokedark">
      <div class="mx-auto max-w-7xl">
        <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <!-- Logo & Title -->
          <div class="flex items-center gap-4">
            <NuxtLink to="/representative" class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div class="hidden sm:block">
                <h1 class="text-lg font-bold text-gray-900 dark:text-white">
                  Личный кабинет
                </h1>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Представитель организации
                </p>
              </div>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.to)
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              ]"
            >
              <component :is="item.icon" class="h-5 w-5" />
              <span>{{ item.label }}</span>
              <span
                v-if="item.badge && item.badge > 0"
                class="ml-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-white"
              >
                {{ item.badge }}
              </span>
            </NuxtLink>
          </nav>

          <!-- Right section -->
          <div class="flex items-center gap-4">
            <!-- Organization info -->
            <div class="hidden lg:flex items-center gap-3 pl-4 border-l border-stroke dark:border-strokedark">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success font-semibold text-sm">
                {{ organizationInitials }}
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                  {{ organizationName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ representativeName }}
                </p>
              </div>
            </div>

            <!-- Theme toggle -->
            <button
              @click="toggleTheme"
              class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg v-if="isDark" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <!-- User menu -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {{ userInitials }}
              </button>
              
              <!-- Dropdown -->
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div
                  v-if="showUserMenu"
                  class="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-boxdark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div class="p-2">
                    <div class="px-3 py-2 border-b border-stroke dark:border-strokedark mb-2">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ representativeName }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ userEmail }}
                      </p>
                    </div>
                    
                    <button
                      @click="handleLogout"
                      class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile navigation -->
      <nav class="md:hidden border-t border-stroke dark:border-strokedark px-4 py-2 overflow-x-auto">
        <div class="flex gap-1">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
              isActive(item.to)
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 dark:text-gray-400'
            ]"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>
    </header>

    <!-- Main content -->
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '~/composables/useTheme'

// Icons
const IconAnnouncements = {
  render: () => h('svg', { class: 'h-5 w-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' })
  ])
}

const IconRequests = {
  render: () => h('svg', { class: 'h-5 w-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
  ])
}

const IconStudents = {
  render: () => h('svg', { class: 'h-5 w-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1' })
  ])
}

const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const { logout, user } = useAuth()

// State
const showUserMenu = ref(false)
const userMenuRef = ref(null)
const pendingRequestsCount = ref(0)

// Navigation items
const navigation = computed(() => [
  { to: '/representative', label: 'Анонсы', icon: IconAnnouncements },
  { to: '/representative/requests', label: 'Мои заявки', icon: IconRequests, badge: pendingRequestsCount.value },
  { to: '/representative/students', label: 'Слушатели', icon: IconStudents },
])

// Computed
const representativeName = computed(() => user.value?.name || 'Представитель')
const userEmail = computed(() => user.value?.email || '')
const organizationName = computed(() => user.value?.organizationName || 'Организация')

const userInitials = computed(() => {
  const name = representativeName.value
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const organizationInitials = computed(() => {
  const name = organizationName.value
  const words = name.split(' ')
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

// Methods
const isActive = (path) => {
  if (path === '/representative') {
    return route.path === '/representative' || route.path === '/representative/'
  }
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await logout()
  router.push('/auth/login')
}

// Click outside handler
const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

// Load pending requests count
const loadPendingCount = async () => {
  try {
    const { authFetch } = useAuthFetch()
    const response = await authFetch('/api/training-requests/my?status=reserved', { method: 'GET' })
    if (response.success) {
      pendingRequestsCount.value = response.data?.length || 0
    }
  } catch (error) {
    console.error('Error loading pending count:', error)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadPendingCount()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
