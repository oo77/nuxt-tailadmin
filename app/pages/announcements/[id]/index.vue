<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка информации об объявлении...</p>
      </div>
    </div>

    <!-- Объявление не найдено -->
    <div v-else-if="!announcement" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Объявление не найдено</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Возможно, объявление было удалено или перемещено</p>
        <UiButton class="mt-6" @click="$router.push('/announcements')">
          Вернуться к списку объявлений
        </UiButton>
      </div>
    </div>

    <!-- Содержимое -->
    <template v-else>
      <!-- Заголовок и навигация -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <NuxtLink to="/announcements" class="hover:text-primary transition-colors">Объявления</NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900 dark:text-white">{{ announcement.title }}</span>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-black dark:text-white">{{ announcement.title }}</h1>
              <p class="text-gray-500 dark:text-gray-400">{{ announcementTypeLabel }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UiButton
              v-if="canEditAnnouncements && announcement.status === 'draft'"
              variant="primary"
              @click="handlePublish"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Опубликовать
            </UiButton>
            <UiButton
              v-if="canEditAnnouncements && announcement.status === 'published'"
              variant="warning"
              @click="handleClose"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Закрыть
            </UiButton>
            <UiButton v-if="canEditAnnouncements" variant="outline" @click="showEditModal = true">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактировать
            </UiButton>
            <UiButton v-if="canDeleteAnnouncements" variant="danger" @click="showDeleteModal = true">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Информация об объявлении и статистика -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Основная информация -->
        <div class="lg:col-span-2 rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
          <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Информация об объявлении</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">Статус</label>
              <p>
                <AnnouncementsAnnouncementStatusBadge :status="announcement.status" />
              </p>
            </div>
            
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">Тип объявления</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ announcementTypeLabel }}</p>
            </div>
            
            <div v-if="announcement.publishedAt">
              <label class="text-sm text-gray-500 dark:text-gray-400">Дата публикации</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(announcement.publishedAt) }}</p>
            </div>
            
            <div v-if="announcement.deadline">
              <label class="text-sm text-gray-500 dark:text-gray-400">Дедлайн подачи заявок</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(announcement.deadline) }}</p>
            </div>
            
            <div v-if="announcement.startDate">
              <label class="text-sm text-gray-500 dark:text-gray-400">Дата начала обучения</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(announcement.startDate) }}</p>
            </div>
            
            <div v-if="announcement.endDate">
              <label class="text-sm text-gray-500 dark:text-gray-400">Дата окончания обучения</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(announcement.endDate) }}</p>
            </div>
            
            <div class="col-span-2" v-if="announcement.description">
              <label class="text-sm text-gray-500 dark:text-gray-400">Описание</label>
              <p class="text-gray-900 dark:text-white">{{ announcement.description }}</p>
            </div>
            
            <div class="col-span-2" v-if="announcement.requirements">
              <label class="text-sm text-gray-500 dark:text-gray-400">Требования</label>
              <p class="text-gray-900 dark:text-white">{{ announcement.requirements }}</p>
            </div>
            
            <div class="col-span-2" v-if="announcement.contactInfo">
              <label class="text-sm text-gray-500 dark:text-gray-400">Контактная информация</label>
              <p class="text-gray-900 dark:text-white">{{ announcement.contactInfo }}</p>
            </div>
          </div>
        </div>

        <!-- Статистика -->
        <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
          <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Статистика</h3>
          
          <AnnouncementsAnnouncementStats
            v-if="announcement.stats"
            :stats="announcement.stats"
          />
          
          <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>Статистика недоступна</p>
          </div>
        </div>
      </div>

      <!-- Группы в объявлении -->
      <div class="mb-6 rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-black dark:text-white">Учебные группы</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ announcement.groups?.length || 0 }} групп в объявлении</p>
              </div>
            </div>
          </div>
        </div>

        <AnnouncementsAnnouncementGroups
          v-if="announcement.groups && announcement.groups.length > 0"
          :groups="announcement.groups"
        />
        
        <div v-else class="p-12 text-center text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="mt-4">В объявлении пока нет учебных групп</p>
        </div>
      </div>

      <!-- Заявки на объявление -->
      <div class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-black dark:text-white">Заявки</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ announcement.stats?.totalRequests || 0 }} заявок</p>
              </div>
            </div>
          </div>
        </div>

        <AnnouncementsAnnouncementRequests
          :announcement-id="announcement.id"
        />
      </div>
    </template>

    <!-- Модальное окно редактирования -->
    <AnnouncementsAnnouncementFormModal
      :is-open="showEditModal"
      :announcement="announcement"
      @close="showEditModal = false"
      @updated="handleAnnouncementUpdated"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление объявления"
      message="Вы уверены, что хотите удалить это объявление?"
      :item-name="announcement?.title"
      warning="Все заявки, связанные с этим объявлением, также будут удалены. Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const { canEditAnnouncements, canDeleteAnnouncements } = usePermissions()
const {
  currentAnnouncement: announcement,
  loading,
  fetchAnnouncementById,
  publishAnnouncement,
  closeAnnouncement,
  deleteAnnouncement,
} = useAnnouncements()

// State
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Computed
const announcementTypeLabel = computed(() => {
  if (!announcement.value) return ''
  
  const labels = {
    single_group: 'Одна группа',
    multiple_groups: 'Несколько групп',
    program: 'Программа обучения',
  }
  
  return labels[announcement.value.announcementType] || announcement.value.announcementType
})

// Methods
const loadAnnouncement = async () => {
  const id = route.params.id
  if (typeof id === 'string') {
    await fetchAnnouncementById(id)
  }
}

const formatDate = (date) => {
  if (!date) return '—'
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const datePart = date.split('T')[0]
    const parts = datePart?.split('-').map(Number)
    if (parts && parts.length >= 3) {
      const [year, month, day] = parts
      const d = new Date(year, month - 1, day)
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }
  
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const handlePublish = async () => {
  if (!announcement.value) return
  
  try {
    await publishAnnouncement(announcement.value.id)
    await loadAnnouncement()
  } catch (error) {
    console.error('Ошибка при публикации объявления:', error)
  }
}

const handleClose = async () => {
  if (!announcement.value) return
  
  try {
    await closeAnnouncement(announcement.value.id)
    await loadAnnouncement()
  } catch (error) {
    console.error('Ошибка при закрытии объявления:', error)
  }
}

const handleDelete = async () => {
  if (!announcement.value) return
  
  isDeleting.value = true
  try {
    await deleteAnnouncement(announcement.value.id)
    router.push('/announcements')
  } catch (error) {
    console.error('Ошибка при удалении объявления:', error)
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
  }
}

const handleAnnouncementUpdated = () => {
  showEditModal.value = false
  loadAnnouncement()
}

// Initialize
onMounted(() => {
  loadAnnouncement()
})
</script>
