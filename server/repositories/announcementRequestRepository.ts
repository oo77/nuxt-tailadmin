/**
 * Репозиторий для работы с заявками на объявления
 */

import { executeQuery, executeTransaction } from '../utils/db';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ТИПЫ
// ============================================================================

export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type RequestType = 'with_employees' | 'reservation';
export type EmployeeEnrollmentStatus = 'pending' | 'enrolled' | 'rejected';
export type HistoryAction =
    | 'created'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'employees_updated'
    | 'status_changed';

export interface AnnouncementRequest {
    id: string;
    announcementId: string;
    organizationId: string;
    representativeId: string;
    status: RequestStatus;
    requestType: RequestType;
    totalSlots: number;
    pdfFileId: number | null;
    pdfFileUrl: string | null;
    representativeNotes: string | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Связанные данные
    announcement?: {
        id: string;
        title: string;
        status: string;
    };
    organization?: {
        id: string;
        name: string;
        shortName: string | null;
    };
    representative?: {
        id: string;
        fullName: string;
        phone: string;
    };
    reviewer?: {
        id: string;
        fullName: string;
    };
    requestGroups?: RequestGroup[];
    employees?: RequestEmployee[];
}

export interface RequestGroup {
    id: string;
    requestId: string;
    announcementGroupId: string;
    requestedSlots: number;
    approvedSlots: number;
    createdAt: Date;

    // Данные группы
    group?: {
        id: string;
        code: string;
        courseName: string;
        startDate: Date;
        endDate: Date;
    };
}

export interface RequestEmployee {
    id: string;
    requestId: string;
    requestGroupId: string;
    studentId: string;
    enrollmentStatus: EmployeeEnrollmentStatus;
    enrolledAt: Date | null;
    createdAt: Date;

    // Данные студента
    student?: {
        id: string;
        fullName: string;
        pinfl: string;
        position: string;
        department: string | null;
    };
}

export interface RequestHistory {
    id: number;
    requestId: string;
    action: HistoryAction;
    performedBy: string | null;
    performedByName: string | null;
    oldStatus: string | null;
    newStatus: string | null;
    details: Record<string, any> | null;
    createdAt: Date;
}

export interface CreateRequestInput {
    announcementId: string;
    organizationId: string;
    representativeId: string;
    requestType: RequestType;
    groupSelections: {
        announcementGroupId: string;
        requestedSlots: number;
        employeeIds?: string[]; // Для with_employees
    }[];
    representativeNotes?: string;
    pdfFileId?: number;
}

export interface UpdateRequestInput {
    representativeNotes?: string | null;
    pdfFileId?: number | null;
}

export interface ApproveRequestInput {
    reviewerId: string;
    groupApprovals?: {
        requestGroupId: string;
        approvedSlots: number;
        approvedEmployeeIds?: string[];
    }[];
}

export interface RejectRequestInput {
    reviewerId: string;
    reason: string;
}

export interface RequestFilters {
    status?: RequestStatus;
    announcementId?: string;
    organizationId?: string;
    representativeId?: string;
    requestType?: RequestType;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    filters?: RequestFilters;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface RequestRow extends RowDataPacket {
    id: string;
    announcement_id: string;
    organization_id: string;
    representative_id: string;
    status: RequestStatus;
    request_type: RequestType;
    total_slots: number;
    pdf_file_id: number | null;
    pdf_file_url: string | null;
    representative_notes: string | null;
    reviewed_by: string | null;
    reviewed_at: Date | null;
    rejection_reason: string | null;
    created_at: Date;
    updated_at: Date;

    // JOIN данные
    announcement_title?: string;
    announcement_status?: string;
    organization_name?: string;
    organization_short_name?: string | null;
    representative_full_name?: string;
    representative_phone?: string;
    reviewer_full_name?: string;
}

interface RequestGroupRow extends RowDataPacket {
    id: string;
    request_id: string;
    announcement_group_id: string;
    requested_slots: number;
    approved_slots: number;
    created_at: Date;

    // JOIN данные
    group_id?: string;
    group_code?: string;
    course_name?: string;
    start_date?: Date;
    end_date?: Date;
}

interface RequestEmployeeRow extends RowDataPacket {
    id: string;
    request_id: string;
    request_group_id: string;
    student_id: string;
    enrollment_status: EmployeeEnrollmentStatus;
    enrolled_at: Date | null;
    created_at: Date;

    // JOIN данные
    student_full_name?: string;
    student_pinfl?: string;
    student_position?: string;
    student_department?: string | null;
}

interface HistoryRow extends RowDataPacket {
    id: number;
    request_id: string;
    action: HistoryAction;
    performed_by: string | null;
    performed_by_name: string | null;
    old_status: string | null;
    new_status: string | null;
    details: string | null;
    created_at: Date;
}

interface CountRow extends RowDataPacket {
    total: number;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToRequest(row: RequestRow): AnnouncementRequest {
    return {
        id: row.id,
        announcementId: row.announcement_id,
        organizationId: row.organization_id,
        representativeId: row.representative_id,
        status: row.status,
        requestType: row.request_type,
        totalSlots: row.total_slots,
        pdfFileId: row.pdf_file_id,
        pdfFileUrl: row.pdf_file_url,
        representativeNotes: row.representative_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        rejectionReason: row.rejection_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...(row.announcement_title && {
            announcement: {
                id: row.announcement_id,
                title: row.announcement_title,
                status: row.announcement_status!,
            },
        }),
        ...(row.organization_name && {
            organization: {
                id: row.organization_id,
                name: row.organization_name,
                shortName: row.organization_short_name ?? null,
            },
        }),
        ...(row.representative_full_name && {
            representative: {
                id: row.representative_id,
                fullName: row.representative_full_name,
                phone: row.representative_phone!,
            },
        }),
        ...(row.reviewer_full_name && {
            reviewer: {
                id: row.reviewed_by!,
                fullName: row.reviewer_full_name,
            },
        }),
    };
}

function mapRowToRequestGroup(row: RequestGroupRow): RequestGroup {
    return {
        id: row.id,
        requestId: row.request_id,
        announcementGroupId: row.announcement_group_id,
        requestedSlots: row.requested_slots,
        approvedSlots: row.approved_slots,
        createdAt: row.created_at,
        ...(row.group_code && {
            group: {
                id: row.group_id!,
                code: row.group_code,
                courseName: row.course_name!,
                startDate: row.start_date!,
                endDate: row.end_date!,
            },
        }),
    };
}

function mapRowToRequestEmployee(row: RequestEmployeeRow): RequestEmployee {
    return {
        id: row.id,
        requestId: row.request_id,
        requestGroupId: row.request_group_id,
        studentId: row.student_id,
        enrollmentStatus: row.enrollment_status,
        enrolledAt: row.enrolled_at,
        createdAt: row.created_at,
        ...(row.student_full_name && {
            student: {
                id: row.student_id,
                fullName: row.student_full_name,
                pinfl: row.student_pinfl!,
                position: row.student_position!,
                department: row.student_department ?? null,
            },
        }),
    };
}

function mapRowToHistory(row: HistoryRow): RequestHistory {
    return {
        id: row.id,
        requestId: row.request_id,
        action: row.action,
        performedBy: row.performed_by,
        performedByName: row.performed_by_name,
        oldStatus: row.old_status,
        newStatus: row.new_status,
        details: row.details ? JSON.parse(row.details) : null,
        createdAt: row.created_at,
    };
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить список заявок с пагинацией и фильтрами
 */
export async function getRequests(
    params: PaginationParams = {}
): Promise<PaginatedResult<AnnouncementRequest>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const filters = params.filters || {};

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Фильтры
    if (filters.status) {
        whereConditions.push('ar.status = ?');
        queryParams.push(filters.status);
    }

    if (filters.announcementId) {
        whereConditions.push('ar.announcement_id = ?');
        queryParams.push(filters.announcementId);
    }

    if (filters.organizationId) {
        whereConditions.push('ar.organization_id = ?');
        queryParams.push(filters.organizationId);
    }

    if (filters.representativeId) {
        whereConditions.push('ar.representative_id = ?');
        queryParams.push(filters.representativeId);
    }

    if (filters.requestType) {
        whereConditions.push('ar.request_type = ?');
        queryParams.push(filters.requestType);
    }

    if (filters.search) {
        whereConditions.push('(a.title LIKE ? OR o.name LIKE ? OR ar.representative_notes LIKE ?)');
        const searchPattern = `%${filters.search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters.dateFrom) {
        whereConditions.push('DATE(ar.created_at) >= ?');
        queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
        whereConditions.push('DATE(ar.created_at) <= ?');
        queryParams.push(filters.dateTo);
    }

    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Получить общее количество
    const countQuery = `
    SELECT COUNT(*) as total
    FROM announcement_requests ar
    LEFT JOIN announcements a ON ar.announcement_id = a.id
    LEFT JOIN organizations o ON ar.organization_id = o.id
    ${whereClause}
  `;

    const [countRows] = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countRows[0]?.total || 0;

    // Получить данные
    const dataQuery = `
    SELECT 
      ar.*,
      a.title as announcement_title,
      a.status as announcement_status,
      o.name as organization_name,
      o.short_name as organization_short_name,
      u.full_name as representative_full_name,
      u.phone as representative_phone,
      rev.full_name as reviewer_full_name
    FROM announcement_requests ar
    LEFT JOIN announcements a ON ar.announcement_id = a.id
    LEFT JOIN organizations o ON ar.organization_id = o.id
    LEFT JOIN users u ON ar.representative_id = u.id
    LEFT JOIN users rev ON ar.reviewed_by = rev.id
    ${whereClause}
    ORDER BY ar.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const [rows] = await executeQuery<RequestRow[]>(
        dataQuery,
        [...queryParams, limit, offset]
    );

    const data = rows.map(mapRowToRequest);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить заявку по ID с полной информацией
 */
export async function getRequestById(id: string): Promise<AnnouncementRequest | null> {
    const query = `
    SELECT 
      ar.*,
      a.title as announcement_title,
      a.status as announcement_status,
      o.name as organization_name,
      o.short_name as organization_short_name,
      u.full_name as representative_full_name,
      u.phone as representative_phone,
      rev.full_name as reviewer_full_name,
      f.file_url as pdf_file_url
    FROM announcement_requests ar
    LEFT JOIN announcements a ON ar.announcement_id = a.id
    LEFT JOIN organizations o ON ar.organization_id = o.id
    LEFT JOIN users u ON ar.representative_id = u.id
    LEFT JOIN users rev ON ar.reviewed_by = rev.id
    LEFT JOIN files f ON ar.pdf_file_id = f.id
    WHERE ar.id = ?
  `;

    const [rows] = await executeQuery<RequestRow[]>(query, [id]);

    if (rows.length === 0) {
        return null;
    }

    const request = mapRowToRequest(rows[0]);

    // Получить группы заявки
    request.requestGroups = await getRequestGroups(id);

    // Получить сотрудников
    request.employees = await getRequestEmployees(id);

    return request;
}

/**
 * Получить группы заявки
 */
export async function getRequestGroups(requestId: string): Promise<RequestGroup[]> {
    const query = `
    SELECT 
      arg.*,
      ag.group_id,
      sg.code as group_code,
      c.name as course_name,
      sg.start_date,
      sg.end_date
    FROM announcement_request_groups arg
    LEFT JOIN announcement_groups ag ON arg.announcement_group_id = ag.id
    LEFT JOIN study_groups sg ON ag.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    WHERE arg.request_id = ?
    ORDER BY sg.start_date ASC
  `;

    const [rows] = await executeQuery<RequestGroupRow[]>(query, [requestId]);
    return rows.map(mapRowToRequestGroup);
}

/**
 * Получить сотрудников заявки
 */
export async function getRequestEmployees(requestId: string): Promise<RequestEmployee[]> {
    const query = `
    SELECT 
      are.*,
      s.full_name as student_full_name,
      s.pinfl as student_pinfl,
      s.position as student_position,
      s.department as student_department
    FROM announcement_request_employees are
    LEFT JOIN students s ON are.student_id = s.id
    WHERE are.request_id = ?
    ORDER BY are.created_at ASC
  `;

    const [rows] = await executeQuery<RequestEmployeeRow[]>(query, [requestId]);
    return rows.map(mapRowToRequestEmployee);
}

/**
 * Создать новую заявку
 */
export async function createRequest(
    input: CreateRequestInput
): Promise<AnnouncementRequest> {
    const id = uuidv4();

    return await executeTransaction(async (connection) => {
        // Подсчитать общее количество слотов
        const totalSlots = input.groupSelections.reduce(
            (sum, sel) => sum + sel.requestedSlots,
            0
        );

        // Создать заявку
        const insertQuery = `
      INSERT INTO announcement_requests (
        id, announcement_id, organization_id, representative_id,
        status, request_type, total_slots, pdf_file_id, representative_notes
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)
    `;

        await connection.execute<ResultSetHeader>(insertQuery, [
            id,
            input.announcementId,
            input.organizationId,
            input.representativeId,
            input.requestType,
            totalSlots,
            input.pdfFileId || null,
            input.representativeNotes || null,
        ]);

        // Добавить группы
        for (const selection of input.groupSelections) {
            const requestGroupId = uuidv4();

            await connection.execute<ResultSetHeader>(
                `INSERT INTO announcement_request_groups (
          id, request_id, announcement_group_id, requested_slots
        ) VALUES (?, ?, ?, ?)`,
                [requestGroupId, id, selection.announcementGroupId, selection.requestedSlots]
            );

            // Добавить сотрудников, если указаны
            if (selection.employeeIds && selection.employeeIds.length > 0) {
                const employeeValues = selection.employeeIds.map((studentId) => [
                    uuidv4(),
                    id,
                    requestGroupId,
                    studentId,
                    'pending',
                ]);

                await connection.query(
                    `INSERT INTO announcement_request_employees (
            id, request_id, request_group_id, student_id, enrollment_status
          ) VALUES ?`,
                    [employeeValues]
                );
            }
        }

        // Записать в историю
        await addRequestHistory(
            id,
            'created',
            input.representativeId,
            null,
            'draft',
            { requestType: input.requestType, totalSlots },
            connection
        );

        // Получить созданную заявку
        const request = await getRequestById(id);
        if (!request) {
            throw new Error('Failed to create request');
        }

        return request;
    });
}

/**
 * Подать заявку (изменить статус на pending)
 */
export async function submitRequest(
    id: string,
    representativeId: string
): Promise<AnnouncementRequest | null> {
    return await executeTransaction(async (connection) => {
        // Проверить статус
        const [rows] = await connection.execute<RequestRow[]>(
            'SELECT status FROM announcement_requests WHERE id = ?',
            [id]
        );

        if (rows.length === 0 || rows[0].status !== 'draft') {
            throw new Error('Request cannot be submitted');
        }

        // Обновить статус
        await connection.execute<ResultSetHeader>(
            `UPDATE announcement_requests 
       SET status = 'pending', updated_at = NOW() 
       WHERE id = ?`,
            [id]
        );

        // Зарезервировать места
        await connection.execute(
            `UPDATE announcement_groups ag
       INNER JOIN announcement_request_groups arg ON ag.id = arg.announcement_group_id
       SET ag.current_reserved = ag.current_reserved + arg.requested_slots
       WHERE arg.request_id = ?`,
            [id]
        );

        // Записать в историю
        await addRequestHistory(
            id,
            'submitted',
            representativeId,
            'draft',
            'pending',
            null,
            connection
        );

        return await getRequestById(id);
    });
}

/**
 * Обновить заявку
 */
export async function updateRequest(
    id: string,
    input: UpdateRequestInput
): Promise<AnnouncementRequest | null> {
    const updates: string[] = [];
    const params: any[] = [];

    if (input.representativeNotes !== undefined) {
        updates.push('representative_notes = ?');
        params.push(input.representativeNotes);
    }

    if (input.pdfFileId !== undefined) {
        updates.push('pdf_file_id = ?');
        params.push(input.pdfFileId);
    }

    if (updates.length === 0) {
        return getRequestById(id);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `
    UPDATE announcement_requests
    SET ${updates.join(', ')}
    WHERE id = ? AND status = 'draft'
  `;

    await executeQuery(query, params);

    return getRequestById(id);
}

/**
 * Одобрить заявку
 */
export async function approveRequest(
    id: string,
    input: ApproveRequestInput
): Promise<AnnouncementRequest | null> {
    return await executeTransaction(async (connection) => {
        // Проверить статус
        const [rows] = await connection.execute<RequestRow[]>(
            'SELECT status FROM announcement_requests WHERE id = ?',
            [id]
        );

        if (rows.length === 0 || rows[0].status !== 'pending') {
            throw new Error('Request cannot be approved');
        }

        // Обновить статус заявки
        await connection.execute<ResultSetHeader>(
            `UPDATE announcement_requests 
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
            [input.reviewerId, id]
        );

        // Обработать одобрения по группам
        if (input.groupApprovals) {
            for (const approval of input.groupApprovals) {
                // Обновить количество одобренных слотов
                await connection.execute(
                    `UPDATE announcement_request_groups 
           SET approved_slots = ? 
           WHERE id = ?`,
                    [approval.approvedSlots, approval.requestGroupId]
                );

                // Обновить счетчики в announcement_groups
                const [groupRows] = await connection.execute<RowDataPacket[]>(
                    `SELECT announcement_group_id, requested_slots 
           FROM announcement_request_groups 
           WHERE id = ?`,
                    [approval.requestGroupId]
                );

                if (groupRows.length > 0) {
                    const announcementGroupId = groupRows[0].announcement_group_id;
                    const requestedSlots = groupRows[0].requested_slots;

                    await connection.execute(
                        `UPDATE announcement_groups 
             SET current_reserved = current_reserved - ?,
                 current_approved = current_approved + ?
             WHERE id = ?`,
                        [requestedSlots, approval.approvedSlots, announcementGroupId]
                    );
                }

                // Обновить статус сотрудников
                if (approval.approvedEmployeeIds && approval.approvedEmployeeIds.length > 0) {
                    await connection.query(
                        `UPDATE announcement_request_employees 
             SET enrollment_status = 'enrolled', enrolled_at = NOW()
             WHERE id IN (?) AND request_group_id = ?`,
                        [approval.approvedEmployeeIds, approval.requestGroupId]
                    );

                    // Отклонить остальных
                    await connection.execute(
                        `UPDATE announcement_request_employees 
             SET enrollment_status = 'rejected'
             WHERE request_group_id = ? AND id NOT IN (?)`,
                        [approval.requestGroupId, approval.approvedEmployeeIds]
                    );
                }
            }
        }

        // Записать в историю
        await addRequestHistory(
            id,
            'approved',
            input.reviewerId,
            'pending',
            'approved',
            { groupApprovals: input.groupApprovals },
            connection
        );

        return await getRequestById(id);
    });
}

/**
 * Отклонить заявку
 */
export async function rejectRequest(
    id: string,
    input: RejectRequestInput
): Promise<AnnouncementRequest | null> {
    return await executeTransaction(async (connection) => {
        // Проверить статус
        const [rows] = await connection.execute<RequestRow[]>(
            'SELECT status FROM announcement_requests WHERE id = ?',
            [id]
        );

        if (rows.length === 0 || rows[0].status !== 'pending') {
            throw new Error('Request cannot be rejected');
        }

        // Обновить статус
        await connection.execute<ResultSetHeader>(
            `UPDATE announcement_requests 
       SET status = 'rejected', 
           reviewed_by = ?, 
           reviewed_at = NOW(), 
           rejection_reason = ?,
           updated_at = NOW()
       WHERE id = ?`,
            [input.reviewerId, input.reason, id]
        );

        // Освободить зарезервированные места
        await connection.execute(
            `UPDATE announcement_groups ag
       INNER JOIN announcement_request_groups arg ON ag.id = arg.announcement_group_id
       SET ag.current_reserved = ag.current_reserved - arg.requested_slots
       WHERE arg.request_id = ?`,
            [id]
        );

        // Записать в историю
        await addRequestHistory(
            id,
            'rejected',
            input.reviewerId,
            'pending',
            'rejected',
            { reason: input.reason },
            connection
        );

        return await getRequestById(id);
    });
}

/**
 * Отменить заявку (представителем)
 */
export async function cancelRequest(
    id: string,
    representativeId: string
): Promise<AnnouncementRequest | null> {
    return await executeTransaction(async (connection) => {
        // Проверить статус
        const [rows] = await connection.execute<RequestRow[]>(
            'SELECT status FROM announcement_requests WHERE id = ? AND representative_id = ?',
            [id, representativeId]
        );

        if (rows.length === 0 || !['draft', 'pending'].includes(rows[0].status)) {
            throw new Error('Request cannot be cancelled');
        }

        const oldStatus = rows[0].status;

        // Обновить статус
        await connection.execute<ResultSetHeader>(
            `UPDATE announcement_requests 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = ?`,
            [id]
        );

        // Освободить зарезервированные места (если была pending)
        if (oldStatus === 'pending') {
            await connection.execute(
                `UPDATE announcement_groups ag
         INNER JOIN announcement_request_groups arg ON ag.id = arg.announcement_group_id
         SET ag.current_reserved = ag.current_reserved - arg.requested_slots
         WHERE arg.request_id = ?`,
                [id]
            );
        }

        // Записать в историю
        await addRequestHistory(
            id,
            'cancelled',
            representativeId,
            oldStatus,
            'cancelled',
            null,
            connection
        );

        return await getRequestById(id);
    });
}

/**
 * Обновить список сотрудников в заявке
 */
export async function updateRequestEmployees(
    requestGroupId: string,
    employeeIds: string[]
): Promise<void> {
    await executeTransaction(async (connection) => {
        // Проверить статус заявки
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT ar.status, ar.id as request_id
       FROM announcement_request_groups arg
       INNER JOIN announcement_requests ar ON arg.request_id = ar.id
       WHERE arg.id = ?`,
            [requestGroupId]
        );

        if (rows.length === 0 || rows[0].status !== 'draft') {
            throw new Error('Cannot update employees: request is not in draft status');
        }

        const requestId = rows[0].request_id;

        // Удалить старых сотрудников
        await connection.execute(
            'DELETE FROM announcement_request_employees WHERE request_group_id = ?',
            [requestGroupId]
        );

        // Добавить новых
        if (employeeIds.length > 0) {
            const values = employeeIds.map((studentId) => [
                uuidv4(),
                requestId,
                requestGroupId,
                studentId,
                'pending',
            ]);

            await connection.query(
                `INSERT INTO announcement_request_employees (
          id, request_id, request_group_id, student_id, enrollment_status
        ) VALUES ?`,
                [values]
            );
        }

        // Обновить requested_slots
        await connection.execute(
            `UPDATE announcement_request_groups 
       SET requested_slots = ?
       WHERE id = ?`,
            [employeeIds.length, requestGroupId]
        );

        // Обновить total_slots в заявке
        await connection.execute(
            `UPDATE announcement_requests ar
       SET ar.total_slots = (
         SELECT SUM(requested_slots) 
         FROM announcement_request_groups 
         WHERE request_id = ar.id
       )
       WHERE ar.id = ?`,
            [requestId]
        );
    });
}

/**
 * Получить историю заявки
 */
export async function getRequestHistory(requestId: string): Promise<RequestHistory[]> {
    const query = `
    SELECT 
      ah.*,
      u.full_name as performed_by_name
    FROM announcement_history ah
    LEFT JOIN users u ON ah.performed_by = u.id
    WHERE ah.request_id = ?
    ORDER BY ah.created_at DESC
  `;

    const [rows] = await executeQuery<HistoryRow[]>(query, [requestId]);
    return rows.map(mapRowToHistory);
}

/**
 * Добавить запись в историю
 */
async function addRequestHistory(
    requestId: string,
    action: HistoryAction,
    performedBy: string | null,
    oldStatus: string | null,
    newStatus: string | null,
    details: Record<string, any> | null,
    connection: PoolConnection
): Promise<void> {
    const query = `
    INSERT INTO announcement_history (
      request_id, action, performed_by, old_status, new_status, details
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

    await connection.execute<ResultSetHeader>(query, [
        requestId,
        action,
        performedBy,
        oldStatus,
        newStatus,
        details ? JSON.stringify(details) : null,
    ]);
}

/**
 * Получить заявки по объявлению
 */
export async function getRequestsByAnnouncement(
    announcementId: string,
    filters: Omit<RequestFilters, 'announcementId'> = {}
): Promise<AnnouncementRequest[]> {
    const result = await getRequests({
        filters: { ...filters, announcementId },
        limit: 1000, // Получить все
    });

    return result.data;
}

/**
 * Получить заявки организации
 */
export async function getRequestsByOrganization(
    organizationId: string,
    filters: Omit<RequestFilters, 'organizationId'> = {}
): Promise<AnnouncementRequest[]> {
    const result = await getRequests({
        filters: { ...filters, organizationId },
        limit: 1000,
    });

    return result.data;
}

/**
 * Получить заявки представителя
 */
export async function getRequestsByRepresentative(
    representativeId: string,
    filters: Omit<RequestFilters, 'representativeId'> = {}
): Promise<AnnouncementRequest[]> {
    const result = await getRequests({
        filters: { ...filters, representativeId },
        limit: 1000,
    });

    return result.data;
}
