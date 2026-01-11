/**
 * Composable для работы с объявлениями и заявками (для представителей организаций)
 * 
 * Использование:
 * ```ts
 * const { announcements, myRequests, loading, fetchPublishedAnnouncements, submitRequest } = useRepresentativeAnnouncements()
 * 
 * await fetchPublishedAnnouncements()
 * await submitRequest(requestData)
 * ```
 */

import { ref, computed } from 'vue'
import type {
    AnnouncementWithDetails,
    AnnouncementRequestWithDetails,
    CreateAnnouncementRequestDTO,
    GetRepresentativeRequestsParams,
    AnnouncementsListResponse,
    AnnouncementRequestsListResponse,
    AnnouncementDetailsResponse,
    AnnouncementRequestDetailsResponse,
} from '~/types/announcement'

export function useRepresentativeAnnouncements() {
    const { authFetch } = useAuthFetch()
    const { show: showNotification } = useNotification()
    const { user } = useAuth()

    // ========================================
    // СОСТОЯНИЕ
    // ========================================

    // Опубликованные объявления
    const announcements = ref<AnnouncementWithDetails[]>([])
    const currentAnnouncement = ref<AnnouncementWithDetails | null>(null)

    // Мои заявки
    const myRequests = ref<AnnouncementRequestWithDetails[]>([])
    const currentRequest = ref<AnnouncementRequestWithDetails | null>(null)

    const loading = ref(false)
    const error = ref<string | null>(null)

    // Пагинация для объявлений
    const announcementsTotal = ref(0)
    const announcementsPage = ref(1)
    const announcementsTotalPages = ref(0)

    // Пагинация для заявок
    const requestsTotal = ref(0)
    const requestsPage = ref(1)
    const requestsTotalPages = ref(0)

    // ========================================
    // COMPUTED
    // ========================================

    const hasAnnouncements = computed(() => announcements.value.length > 0)
    const hasRequests = computed(() => myRequests.value.length > 0)
    const isLoading = computed(() => loading.value)
    const hasError = computed(() => error.value !== null)

    // Фильтры заявок по статусу
    const pendingRequests = computed(() =>
        myRequests.value.filter(r => r.status === 'pending')
    )
    const approvedRequests = computed(() =>
        myRequests.value.filter(r => r.status === 'approved')
    )
    const rejectedRequests = computed(() =>
        myRequests.value.filter(r => r.status === 'rejected')
    )
    const draftRequests = computed(() =>
        myRequests.value.filter(r => r.status === 'draft')
    )

    // Доступные объявления (открыты для заявок)
    const availableAnnouncements = computed(() =>
        announcements.value.filter(a => a.status === 'published' && a.acceptsRequests)
    )

    // ========================================
    // МЕТОДЫ ПОЛУЧЕНИЯ ОБЪЯВЛЕНИЙ
    // ========================================

    /**
     * Получить опубликованные объявления
     */
    const fetchPublishedAnnouncements = async (params?: {
        search?: string
        page?: number
        limit?: number
    }) => {
        loading.value = true
        error.value = null

        try {
            const queryParams = new URLSearchParams()
            queryParams.append('status', 'published')

            if (params?.search) queryParams.append('search', params.search)
            if (params?.page) queryParams.append('page', params.page.toString())
            if (params?.limit) queryParams.append('limit', params.limit.toString())

            const response = await authFetch<AnnouncementsListResponse>(
                `/api/representative/announcements?${queryParams.toString()}`
            )

            if (response.success) {
                announcements.value = response.data
                announcementsTotal.value = response.total
                announcementsPage.value = response.page
                announcementsTotalPages.value = response.totalPages
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
     * Получить детали объявления
     */
    const fetchAnnouncementDetails = async (announcementId: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<AnnouncementDetailsResponse>(
                `/api/representative/announcements/${announcementId}`
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

    // ========================================
    // МЕТОДЫ РАБОТЫ С ЗАЯВКАМИ
    // ========================================

    /**
     * Получить мои заявки
     */
    const fetchMyRequests = async (params?: Omit<GetRepresentativeRequestsParams, 'representativeId'>) => {
        if (!user.value?.id) {
            error.value = 'Пользователь не авторизован'
            return
        }

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

            if (params?.page) queryParams.append('page', params.page.toString())
            if (params?.limit) queryParams.append('limit', params.limit.toString())

            const response = await authFetch<AnnouncementRequestsListResponse>(
                `/api/representative/requests?${queryParams.toString()}`
            )

            if (response.success) {
                myRequests.value = response.data
                requestsTotal.value = response.total
                requestsPage.value = response.page
                requestsTotalPages.value = response.totalPages
            }

            return response
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при загрузке заявок'
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
     * Получить детали заявки
     */
    const fetchRequestDetails = async (requestId: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<AnnouncementRequestDetailsResponse>(
                `/api/representative/requests/${requestId}`
            )

            if (response.success) {
                currentRequest.value = response.request
            }

            return response.request
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при загрузке заявки'
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
     * Подать заявку на объявление
     */
    const submitRequest = async (announcementId: string, data: Omit<CreateAnnouncementRequestDTO, 'announcementId'>) => {
        loading.value = true
        error.value = null

        try {
            const formData = new FormData()

            // Добавляем основные данные
            formData.append('requestType', data.requestType)
            formData.append('groups', JSON.stringify(data.groups))

            if (data.comment) {
                formData.append('comment', data.comment)
            }

            // Добавляем PDF файл, если есть
            if (data.pdfFile && data.pdfFile instanceof File) {
                formData.append('pdfFile', data.pdfFile)
            }

            const response = await authFetch<{ success: boolean; request: AnnouncementRequestWithDetails }>(
                `/api/representative/announcements/${announcementId}/apply`,
                {
                    method: 'POST',
                    body: formData,
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Заявка подана',
                })

                // Добавляем в список моих заявок
                myRequests.value.unshift(response.request)
            }

            return response.request
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при подаче заявки'
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
     * Отозвать заявку
     */
    const withdrawRequest = async (requestId: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; request: AnnouncementRequestWithDetails }>(
                `/api/representative/requests/${requestId}/withdraw`,
                {
                    method: 'PATCH',
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Заявка отозвана',
                })

                // Обновляем в списке
                const index = myRequests.value.findIndex(r => r.id === requestId)
                if (index !== -1) {
                    myRequests.value[index] = response.request
                }

                // Обновляем текущую
                if (currentRequest.value?.id === requestId) {
                    currentRequest.value = response.request
                }
            }

            return response.request
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при отзыве заявки'
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
     * Проверить, можно ли подать заявку на объявление
     */
    const canApplyToAnnouncement = (announcement: AnnouncementWithDetails) => {
        return (
            announcement.status === 'published' &&
            announcement.acceptsRequests &&
            (!announcement.deadline || new Date(announcement.deadline) > new Date())
        )
    }

    /**
     * Проверить, можно ли отозвать заявку
     */
    const canWithdrawRequest = (request: AnnouncementRequestWithDetails) => {
        return request.status === 'pending'
    }

    /**
     * Получить количество доступных мест в объявлении
     */
    const getAvailableSlots = (announcement: AnnouncementWithDetails) => {
        if (!announcement.maxTotalCapacity) return null

        const reserved = announcement.stats?.totalReservedSlots || 0
        return announcement.maxTotalCapacity - reserved
    }

    /**
     * Проверить, есть ли доступные места
     */
    const hasAvailableSlots = (announcement: AnnouncementWithDetails) => {
        const available = getAvailableSlots(announcement)
        return available === null || available > 0
    }

    /**
     * Очистить текущее объявление
     */
    const clearCurrentAnnouncement = () => {
        currentAnnouncement.value = null
    }

    /**
     * Очистить текущую заявку
     */
    const clearCurrentRequest = () => {
        currentRequest.value = null
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
        myRequests.value = []
        currentRequest.value = null
        loading.value = false
        error.value = null
        announcementsTotal.value = 0
        announcementsPage.value = 1
        announcementsTotalPages.value = 0
        requestsTotal.value = 0
        requestsPage.value = 1
        requestsTotalPages.value = 0
    }

    return {
        // Состояние - Объявления
        announcements,
        currentAnnouncement,
        announcementsTotal,
        announcementsPage,
        announcementsTotalPages,

        // Состояние - Заявки
        myRequests,
        currentRequest,
        requestsTotal,
        requestsPage,
        requestsTotalPages,

        // Общее состояние
        loading,
        error,

        // Computed
        hasAnnouncements,
        hasRequests,
        isLoading,
        hasError,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        draftRequests,
        availableAnnouncements,

        // Методы - Объявления
        fetchPublishedAnnouncements,
        fetchAnnouncementDetails,

        // Методы - Заявки
        fetchMyRequests,
        fetchRequestDetails,
        submitRequest,
        withdrawRequest,

        // Утилиты
        canApplyToAnnouncement,
        canWithdrawRequest,
        getAvailableSlots,
        hasAvailableSlots,
        clearCurrentAnnouncement,
        clearCurrentRequest,
        clearError,
        reset,
    }
}
