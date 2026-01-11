/**
 * Composable для работы с объявлениями (для администраторов и менеджеров)
 * 
 * Использование:
 * ```ts
 * const { announcements, loading, error, fetchAnnouncements, createAnnouncement, publishAnnouncement } = useAnnouncements()
 * 
 * await fetchAnnouncements({ status: 'published' })
 * ```
 */

import { ref, computed } from 'vue'
import type {
    Announcement,
    AnnouncementWithDetails,
    CreateAnnouncementDTO,
    UpdateAnnouncementDTO,
    GetAnnouncementsParams,
    AnnouncementsListResponse,
    AnnouncementDetailsResponse,
    AnnouncementStats,
} from '~/types/announcement'

export function useAnnouncements() {
    const { authFetch } = useAuthFetch()
    const { show: showNotification } = useNotification()

    // ========================================
    // СОСТОЯНИЕ
    // ========================================

    const announcements = ref<AnnouncementWithDetails[]>([])
    const currentAnnouncement = ref<AnnouncementWithDetails | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Пагинация
    const total = ref(0)
    const currentPage = ref(1)
    const totalPages = ref(0)

    // ========================================
    // COMPUTED
    // ========================================

    const hasAnnouncements = computed(() => announcements.value.length > 0)
    const isLoading = computed(() => loading.value)
    const hasError = computed(() => error.value !== null)

    // ========================================
    // МЕТОДЫ ПОЛУЧЕНИЯ ДАННЫХ
    // ========================================

    /**
     * Получить список объявлений с фильтрацией
     */
    const fetchAnnouncements = async (params?: GetAnnouncementsParams) => {
        loading.value = true
        error.value = null

        try {
            const queryParams = new URLSearchParams()

            if (params?.status) {
                if (Array.isArray(params.status)) {
                    params.status.forEach(s => queryParams.append('status', s))
                } else {
                    queryParams.append('status', params.status)
                }
            }

            if (params?.search) queryParams.append('search', params.search)
            if (params?.page) queryParams.append('page', params.page.toString())
            if (params?.limit) queryParams.append('limit', params.limit.toString())
            if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
            if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

            const response = await authFetch<AnnouncementsListResponse>(
                `/api/announcements?${queryParams.toString()}`
            )

            if (response.success) {
                announcements.value = response.data
                total.value = response.total
                currentPage.value = response.page
                totalPages.value = response.totalPages
            }

            return response
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при загрузке объявлений'
            error.value = errorMessage
            showNotification({
                type: 'error',
                title: 'Ошибка',
                message: errorMessage,
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Получить детали объявления по ID
     */
    const fetchAnnouncementById = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<AnnouncementDetailsResponse>(
                `/api/announcements/${id}`
            )

            if (response.success) {
                currentAnnouncement.value = response.announcement
            }

            return response.announcement
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при загрузке объявления'
            error.value = errorMessage
            showNotification({
                type: 'error',
                title: 'Ошибка',
                message: errorMessage,
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Получить статистику объявления
     */
    const fetchAnnouncementStats = async (id: string) => {
        try {
            const response = await authFetch<{ success: boolean; stats: AnnouncementStats }>(
                `/api/announcements/${id}/stats`
            )

            return response.stats
        } catch (err: any) {
            error.value = err.message || 'Ошибка при загрузке статистики'
            throw err
        }
    }

    // ========================================
    // МЕТОДЫ СОЗДАНИЯ И ОБНОВЛЕНИЯ
    // ========================================

    /**
     * Создать новое объявление
     */
    const createAnnouncement = async (data: CreateAnnouncementDTO) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; announcement: AnnouncementWithDetails }>(
                '/api/announcements',
                {
                    method: 'POST',
                    body: data,
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Объявление создано',
                })

                // Добавляем в начало списка
                announcements.value.unshift(response.announcement)
            }

            return response.announcement
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при создании объявления'
            error.value = errorMessage
            showNotification({
                type: 'error',
                title: 'Ошибка',
                message: errorMessage,
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Обновить объявление
     */
    const updateAnnouncement = async (id: string, data: UpdateAnnouncementDTO) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; announcement: AnnouncementWithDetails }>(
                `/api/announcements/${id}`,
                {
                    method: 'PUT',
                    body: data,
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Объявление обновлено',
                })

                // Обновляем в списке
                const index = announcements.value.findIndex(a => a.id === id)
                if (index !== -1) {
                    announcements.value[index] = response.announcement
                }

                // Обновляем текущее
                if (currentAnnouncement.value?.id === id) {
                    currentAnnouncement.value = response.announcement
                }
            }

            return response.announcement
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при обновлении объявления'
            error.value = errorMessage
            showNotification({
                type: 'error',
                title: 'Ошибка',
                message: errorMessage,
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Удалить объявление
     */
    const deleteAnnouncement = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean }>(
                `/api/announcements/${id}`,
                {
                    method: 'DELETE',
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Объявление удалено',
                })

                // Удаляем из списка
                announcements.value = announcements.value.filter(a => a.id !== id)

                // Очищаем текущее
                if (currentAnnouncement.value?.id === id) {
                    currentAnnouncement.value = null
                }
            }

            return response.success
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при удалении объявления'
            error.value = errorMessage
            showNotification({
                type: 'error',
                title: 'Ошибка',
                message: errorMessage,
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    // ========================================
    // МЕТОДЫ УПРАВЛЕНИЯ СТАТУСОМ
    // ========================================

    /**
     * Опубликовать объявление
     */
    const publishAnnouncement = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; announcement: AnnouncementWithDetails }>(
                `/api/announcements/${id}/publish`,
                {
                    method: 'PATCH',
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Объявление опубликовано',
                })

                // Обновляем в списке
                const index = announcements.value.findIndex(a => a.id === id)
                if (index !== -1) {
                    announcements.value[index] = response.announcement
                }

                // Обновляем текущее
                if (currentAnnouncement.value?.id === id) {
                    currentAnnouncement.value = response.announcement
                }
            }

            return response.announcement
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при публикации объявления'
            error.value = errorMessage
            showNotification({
                type: 'error',
                title: 'Ошибка',
                message: errorMessage,
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Закрыть объявление
     */
    const closeAnnouncement = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; announcement: AnnouncementWithDetails }>(
                `/api/announcements/${id}/close`,
                {
                    method: 'PATCH',
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Объявление закрыто',
                })

                // Обновляем в списке
                const index = announcements.value.findIndex(a => a.id === id)
                if (index !== -1) {
                    announcements.value[index] = response.announcement
                }

                // Обновляем текущее
                if (currentAnnouncement.value?.id === id) {
                    currentAnnouncement.value = response.announcement
                }
            }

            return response.announcement
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при закрытии объявления'
            error.value = errorMessage
            showNotification({
                type: 'error',
                title: 'Ошибка',
                message: errorMessage,
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    // ========================================
    // УТИЛИТЫ
    // ========================================

    /**
     * Очистить текущее объявление
     */
    const clearCurrentAnnouncement = () => {
        currentAnnouncement.value = null
    }

    /**
     * Очистить ошибку
     */
    const clearError = () => {
        error.value = null
    }

    /**
     * Сбросить состояние
     */
    const reset = () => {
        announcements.value = []
        currentAnnouncement.value = null
        loading.value = false
        error.value = null
        total.value = 0
        currentPage.value = 1
        totalPages.value = 0
    }

    return {
        // Состояние
        announcements,
        currentAnnouncement,
        loading,
        error,
        total,
        currentPage,
        totalPages,

        // Computed
        hasAnnouncements,
        isLoading,
        hasError,

        // Методы получения
        fetchAnnouncements,
        fetchAnnouncementById,
        fetchAnnouncementStats,

        // Методы создания/обновления
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,

        // Методы управления статусом
        publishAnnouncement,
        closeAnnouncement,

        // Утилиты
        clearCurrentAnnouncement,
        clearError,
        reset,
    }
}
