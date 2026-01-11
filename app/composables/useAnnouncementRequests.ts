/**
 * Composable для работы с заявками на объявления (для администраторов и менеджеров)
 * 
 * Использование:
 * ```ts
 * const { requests, loading, fetchRequests, approveRequest, rejectRequest } = useAnnouncementRequests()
 * 
 * await fetchRequests(announcementId, { status: 'pending' })
 * await approveRequest(requestId)
 * ```
 */

import { ref, computed } from 'vue'
import type {
    AnnouncementRequestWithDetails,
    GetAnnouncementRequestsParams,
    AnnouncementRequestsListResponse,
    AnnouncementRequestDetailsResponse,
    UpdateRequestEmployeesDTO,
} from '~/types/announcement'

export function useAnnouncementRequests() {
    const { authFetch } = useAuthFetch()
    const { show: showNotification } = useNotification()

    // ========================================
    // СОСТОЯНИЕ
    // ========================================

    const requests = ref<AnnouncementRequestWithDetails[]>([])
    const currentRequest = ref<AnnouncementRequestWithDetails | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Пагинация
    const total = ref(0)
    const currentPage = ref(1)
    const totalPages = ref(0)

    // ========================================
    // COMPUTED
    // ========================================

    const hasRequests = computed(() => requests.value.length > 0)
    const isLoading = computed(() => loading.value)
    const hasError = computed(() => error.value !== null)

    // Фильтры по статусу
    const pendingRequests = computed(() =>
        requests.value.filter(r => r.status === 'pending')
    )
    const approvedRequests = computed(() =>
        requests.value.filter(r => r.status === 'approved')
    )
    const rejectedRequests = computed(() =>
        requests.value.filter(r => r.status === 'rejected')
    )

    // ========================================
    // МЕТОДЫ ПОЛУЧЕНИЯ ДАННЫХ
    // ========================================

    /**
     * Получить заявки по объявлению
     */
    const fetchRequestsByAnnouncement = async (
        announcementId: string,
        params?: Omit<GetAnnouncementRequestsParams, 'announcementId'>
    ) => {
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

            if (params?.organizationId) queryParams.append('organizationId', params.organizationId)
            if (params?.page) queryParams.append('page', params.page.toString())
            if (params?.limit) queryParams.append('limit', params.limit.toString())

            const response = await authFetch<AnnouncementRequestsListResponse>(
                `/api/announcements/${announcementId}/requests?${queryParams.toString()}`
            )

            if (response.success) {
                requests.value = response.data
                total.value = response.total
                currentPage.value = response.page
                totalPages.value = response.totalPages
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
     * Получить детали заявки по ID
     */
    const fetchRequestById = async (requestId: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<AnnouncementRequestDetailsResponse>(
                `/api/requests/${requestId}`
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

    // ========================================
    // МЕТОДЫ УПРАВЛЕНИЯ ЗАЯВКАМИ
    // ========================================

    /**
     * Одобрить заявку
     */
    const approveRequest = async (requestId: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; request: AnnouncementRequestWithDetails }>(
                `/api/requests/${requestId}/approve`,
                {
                    method: 'PATCH',
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Заявка одобрена',
                })

                // Обновляем в списке
                const index = requests.value.findIndex(r => r.id === requestId)
                if (index !== -1) {
                    requests.value[index] = response.request
                }

                // Обновляем текущую
                if (currentRequest.value?.id === requestId) {
                    currentRequest.value = response.request
                }
            }

            return response.request
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при одобрении заявки'
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
     * Отклонить заявку
     */
    const rejectRequest = async (requestId: string, rejectionReason: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; request: AnnouncementRequestWithDetails }>(
                `/api/requests/${requestId}/reject`,
                {
                    method: 'PATCH',
                    body: { rejectionReason },
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Заявка отклонена',
                })

                // Обновляем в списке
                const index = requests.value.findIndex(r => r.id === requestId)
                if (index !== -1) {
                    requests.value[index] = response.request
                }

                // Обновляем текущую
                if (currentRequest.value?.id === requestId) {
                    currentRequest.value = response.request
                }
            }

            return response.request
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при отклонении заявки'
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
     * Обновить список сотрудников в заявке
     */
    const updateRequestEmployees = async (data: UpdateRequestEmployeesDTO) => {
        loading.value = true
        error.value = null

        try {
            const response = await authFetch<{ success: boolean; request: AnnouncementRequestWithDetails }>(
                `/api/requests/${data.requestGroupId}/employees`,
                {
                    method: 'PUT',
                    body: { employeeIds: data.employeeIds },
                }
            )

            if (response.success) {
                showNotification({
                    type: 'success',
                    title: 'Успешно',
                    message: 'Список сотрудников обновлён',
                })

                // Обновляем текущую заявку
                if (currentRequest.value) {
                    currentRequest.value = response.request
                }
            }

            return response.request
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка при обновлении списка сотрудников'
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
     * Получить количество заявок по статусу
     */
    const getRequestCountByStatus = (status: string) => {
        return requests.value.filter(r => r.status === status).length
    }

    /**
     * Проверить, можно ли одобрить заявку
     */
    const canApproveRequest = (request: AnnouncementRequestWithDetails) => {
        return request.status === 'pending'
    }

    /**
     * Проверить, можно ли отклонить заявку
     */
    const canRejectRequest = (request: AnnouncementRequestWithDetails) => {
        return request.status === 'pending'
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
        requests.value = []
        currentRequest.value = null
        loading.value = false
        error.value = null
        total.value = 0
        currentPage.value = 1
        totalPages.value = 0
    }

    return {
        // Состояние
        requests,
        currentRequest,
        loading,
        error,
        total,
        currentPage,
        totalPages,

        // Computed
        hasRequests,
        isLoading,
        hasError,
        pendingRequests,
        approvedRequests,
        rejectedRequests,

        // Методы получения
        fetchRequestsByAnnouncement,
        fetchRequestById,

        // Методы управления
        approveRequest,
        rejectRequest,
        updateRequestEmployees,

        // Утилиты
        getRequestCountByStatus,
        canApproveRequest,
        canRejectRequest,
        clearCurrentRequest,
        clearError,
        reset,
    }
}
