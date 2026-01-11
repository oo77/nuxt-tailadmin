/**
 * Типы для системы объявлений о наборе на обучение
 */

// ============================================================================
// ENUMS
// ============================================================================

export type AnnouncementStatus = 'draft' | 'published' | 'closed' | 'archived';
export type AnnouncementType = 'single_group' | 'multiple_groups' | 'program';
export type AnnouncementRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type AnnouncementRequestType = 'with_employees' | 'reservation';
export type RequestGroupStatus = 'pending' | 'approved' | 'rejected' | 'waitlist';
export type RequestEmployeeStatus = 'proposed' | 'confirmed' | 'enrolled' | 'rejected';

// ============================================================================
// ОСНОВНЫЕ ИНТЕРФЕЙСЫ
// ============================================================================

/**
 * Объявление о наборе на обучение
 */
export interface Announcement {
    id: string;
    title: string;
    description?: string;
    announcementType: AnnouncementType;
    status: AnnouncementStatus;

    // Даты
    publishedAt?: string;
    deadline?: string;
    startDate?: string;
    endDate?: string;

    // Настройки приёма заявок
    acceptsRequests: boolean;
    requiresEmployeeList: boolean;
    allowsReservation: boolean;
    maxTotalCapacity?: number;

    // Дополнительная информация
    requirements?: string;
    contactInfo?: string;

    // Метаданные
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Группа в объявлении
 */
export interface AnnouncementGroup {
    id: string;
    announcementId: string;
    groupId: string;
    maxCapacity?: number;
    currentReserved: number;
    displayOrder: number;
    isVisible: boolean;
    createdAt: string;
}

/**
 * Заявка на объявление
 */
export interface AnnouncementRequest {
    id: string;
    announcementId: string;
    organizationId: string;
    representativeId: string;
    status: AnnouncementRequestStatus;
    requestType: AnnouncementRequestType;
    totalRequestedSlots: number;
    comment?: string;

    // PDF документ
    pdfFilePath?: string;
    pdfUploadedAt?: string;

    // Обработка
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;

    // Метаданные
    createdAt: string;
    updatedAt: string;
}

/**
 * Группа в заявке
 */
export interface AnnouncementRequestGroup {
    id: string;
    requestId: string;
    announcementGroupId: string;
    requestedSlots: number;
    reservedSlots: number;
    status: RequestGroupStatus;
    createdAt: string;
}

/**
 * Сотрудник в заявке
 */
export interface AnnouncementRequestEmployee {
    id: string;
    requestGroupId: string;
    studentId: string;
    status: RequestEmployeeStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * История изменений
 */
export interface AnnouncementHistory {
    id: string;
    announcementId?: string;
    requestId?: string;
    action: string;
    actorId?: string;
    details?: Record<string, any>;
    createdAt: string;
}

// ============================================================================
// РАСШИРЕННЫЕ ИНТЕРФЕЙСЫ (с связанными данными)
// ============================================================================

/**
 * Объявление с полной информацией
 */
export interface AnnouncementWithDetails extends Announcement {
    groups?: AnnouncementGroupWithDetails[];
    stats?: AnnouncementStats;
    creator?: {
        id: string;
        fullName: string;
        email: string;
    };
}

/**
 * Группа в объявлении с деталями
 */
export interface AnnouncementGroupWithDetails extends AnnouncementGroup {
    group?: {
        id: string;
        name: string;
        courseId: string;
        courseName?: string;
        startDate?: string;
        endDate?: string;
    };
    availableSlots?: number;
}

/**
 * Заявка с полной информацией
 */
export interface AnnouncementRequestWithDetails extends AnnouncementRequest {
    announcement?: {
        id: string;
        title: string;
        status: AnnouncementStatus;
    };
    organization?: {
        id: string;
        name: string;
        bin: string;
    };
    representative?: {
        id: string;
        fullName: string;
        email: string;
        phone?: string;
    };
    reviewer?: {
        id: string;
        fullName: string;
    };
    groups?: AnnouncementRequestGroupWithDetails[];
}

/**
 * Группа в заявке с деталями
 */
export interface AnnouncementRequestGroupWithDetails extends AnnouncementRequestGroup {
    announcementGroup?: AnnouncementGroupWithDetails;
    employees?: AnnouncementRequestEmployeeWithDetails[];
}

/**
 * Сотрудник в заявке с деталями
 */
export interface AnnouncementRequestEmployeeWithDetails extends AnnouncementRequestEmployee {
    student?: {
        id: string;
        fullName: string;
        iin: string;
        email?: string;
        phone?: string;
    };
}

// ============================================================================
// СТАТИСТИКА
// ============================================================================

/**
 * Статистика объявления
 */
export interface AnnouncementStats {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalRequestedSlots: number;
    totalReservedSlots: number;
    totalAvailableSlots?: number;
}

/**
 * Статистика группы в объявлении
 */
export interface AnnouncementGroupStats {
    groupId: string;
    groupName: string;
    maxCapacity?: number;
    currentReserved: number;
    availableSlots?: number;
    requestsCount: number;
    approvedRequestsCount: number;
}

// ============================================================================
// DTO (Data Transfer Objects)
// ============================================================================

/**
 * DTO для создания объявления
 */
export interface CreateAnnouncementDTO {
    title: string;
    description?: string;
    announcementType: AnnouncementType;
    groupIds: string[];
    deadline?: string;
    startDate?: string;
    endDate?: string;
    acceptsRequests?: boolean;
    requiresEmployeeList?: boolean;
    allowsReservation?: boolean;
    maxTotalCapacity?: number;
    requirements?: string;
    contactInfo?: string;
    groupCapacities?: Record<string, number>; // groupId -> maxCapacity
}

/**
 * DTO для обновления объявления
 */
export interface UpdateAnnouncementDTO {
    title?: string;
    description?: string;
    deadline?: string;
    startDate?: string;
    endDate?: string;
    acceptsRequests?: boolean;
    requiresEmployeeList?: boolean;
    allowsReservation?: boolean;
    maxTotalCapacity?: number;
    requirements?: string;
    contactInfo?: string;
}

/**
 * DTO для создания заявки
 */
export interface CreateAnnouncementRequestDTO {
    announcementId: string;
    requestType: AnnouncementRequestType;
    groups: Array<{
        announcementGroupId: string;
        requestedSlots: number;
        employeeIds?: string[]; // Если requestType === 'with_employees'
    }>;
    comment?: string;
    pdfFile?: File | string; // File для frontend, string (path) для backend
}

/**
 * DTO для обновления списка сотрудников в заявке
 */
export interface UpdateRequestEmployeesDTO {
    requestGroupId: string;
    employeeIds: string[];
}

/**
 * DTO для одобрения заявки
 */
export interface ApproveRequestDTO {
    requestId: string;
    reviewerId: string;
}

/**
 * DTO для отклонения заявки
 */
export interface RejectRequestDTO {
    requestId: string;
    reviewerId: string;
    rejectionReason: string;
}

// ============================================================================
// ФИЛЬТРЫ И ПАРАМЕТРЫ ЗАПРОСОВ
// ============================================================================

/**
 * Параметры для получения списка объявлений
 */
export interface GetAnnouncementsParams {
    status?: AnnouncementStatus | AnnouncementStatus[];
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'publishedAt' | 'deadline' | 'title';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Параметры для получения заявок по объявлению
 */
export interface GetAnnouncementRequestsParams {
    announcementId: string;
    status?: AnnouncementRequestStatus | AnnouncementRequestStatus[];
    organizationId?: string;
    page?: number;
    limit?: number;
}

/**
 * Параметры для получения заявок представителя
 */
export interface GetRepresentativeRequestsParams {
    representativeId: string;
    status?: AnnouncementRequestStatus | AnnouncementRequestStatus[];
    page?: number;
    limit?: number;
}

// ============================================================================
// ОТВЕТЫ API
// ============================================================================

/**
 * Ответ со списком объявлений
 */
export interface AnnouncementsListResponse {
    success: boolean;
    data: AnnouncementWithDetails[];
    total: number;
    page: number;
    totalPages: number;
}

/**
 * Ответ с деталями объявления
 */
export interface AnnouncementDetailsResponse {
    success: boolean;
    announcement: AnnouncementWithDetails;
}

/**
 * Ответ со списком заявок
 */
export interface AnnouncementRequestsListResponse {
    success: boolean;
    data: AnnouncementRequestWithDetails[];
    total: number;
    page: number;
    totalPages: number;
}

/**
 * Ответ с деталями заявки
 */
export interface AnnouncementRequestDetailsResponse {
    success: boolean;
    request: AnnouncementRequestWithDetails;
}
