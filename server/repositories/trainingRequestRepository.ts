/**
 * Репозиторий для работы с заявками на обучение (training_requests)
 */

import { executeQuery, executeTransaction } from '../utils/db';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ТИПЫ
// ============================================================================

export type RequestStatus = 'pending' | 'reserved' | 'approved' | 'rejected' | 'withdrawn';
export type EmployeeEnrollmentStatus = 'pending' | 'enrolled' | 'removed';
export type RequestAction = 'created' | 'employees_updated' | 'reserved' | 'pdf_uploaded' |
    'approved' | 'rejected' | 'withdrawn' | 'expired' | 'note_added';
export type PerformerType = 'admin' | 'manager' | 'representative' | 'system';

export interface TrainingRequest {
    id: string;
    groupId: string;
    organizationId: string;
    representativeId: string;
    status: RequestStatus;
    employeesCount: number;
    pdfFileId: number | null;
    pdfFileUrl?: string;
    reservedBy: string | null;
    reservedByName?: string;
    reservedAt: Date | null;
    reservationExpiresAt: Date | null;
    decisionBy: string | null;
    decisionByName?: string;
    decisionAt: Date | null;
    rejectionReason: string | null;
    representativeNotes: string | null;
    adminNotes: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Joined data
    group?: {
        id: string;
        code: string;
        courseName: string;
        courseShortName: string;
        startDate: string;
        endDate: string;
        maxCapacity: number | null;
        availableSlots: number;
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
    employees?: RequestEmployee[];
}

export interface RequestEmployee {
    id: string;
    requestId: string;
    studentId: string;
    enrollmentStatus: EmployeeEnrollmentStatus;
    enrolledAt: Date | null;
    createdAt: Date;
    // Joined student data
    student?: {
        id: string;
        fullName: string;
        pinfl: string;
        position: string;
        department: string | null;
    };
}

export interface RequestHistoryEntry {
    id: number;
    requestId: string;
    action: RequestAction;
    performedBy: string | null;
    performedByType: PerformerType;
    performedByName?: string;
    oldStatus: string | null;
    newStatus: string | null;
    details: Record<string, any> | null;
    createdAt: Date;
}

export interface CreateRequestInput {
    groupId: string;
    organizationId: string;
    representativeId: string;
    studentIds: string[];
    representativeNotes?: string;
    pdfFileId?: number;
}

export interface RequestFilters {
    status?: RequestStatus;
    groupId?: string;
    organizationId?: string;
    representativeId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

export interface RequestStats {
    total: number;
    pending: number;
    reserved: number;
    approved: number;
    rejected: number;
    withdrawn: number;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface TrainingRequestRow extends RowDataPacket {
    id: string;
    group_id: string;
    organization_id: string;
    representative_id: string;
    status: RequestStatus;
    employees_count: number;
    pdf_file_id: number | null;
    pdf_file_url?: string;
    reserved_by: string | null;
    reserved_by_name?: string;
    reserved_at: Date | null;
    reservation_expires_at: Date | null;
    decision_by: string | null;
    decision_by_name?: string;
    decision_at: Date | null;
    rejection_reason: string | null;
    representative_notes: string | null;
    admin_notes: string | null;
    created_at: Date;
    updated_at: Date;
    // Group joins
    group_code?: string;
    course_name?: string;
    course_short_name?: string;
    group_start_date?: Date;
    group_end_date?: Date;
    group_max_capacity?: number | null;
    group_current_reserved?: number;
    group_enrolled_count?: number;
    // Organization joins
    organization_name?: string;
    organization_short_name?: string | null;
    // Representative joins
    representative_full_name?: string;
    representative_phone?: string;
}

interface RequestEmployeeRow extends RowDataPacket {
    id: string;
    request_id: string;
    student_id: string;
    enrollment_status: EmployeeEnrollmentStatus;
    enrolled_at: Date | null;
    created_at: Date;
    student_full_name?: string;
    student_pinfl?: string;
    student_position?: string;
    student_department?: string | null;
}

interface RequestHistoryRow extends RowDataPacket {
    id: number;
    request_id: string;
    action: RequestAction;
    performed_by: string | null;
    performed_by_type: PerformerType;
    performed_by_name?: string;
    old_status: string | null;
    new_status: string | null;
    details: string | null;
    created_at: Date;
}

interface CountRow extends RowDataPacket {
    total: number;
}

interface StatsRow extends RowDataPacket {
    status: RequestStatus;
    count: number;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToRequest(row: TrainingRequestRow): TrainingRequest {
    const request: TrainingRequest = {
        id: row.id,
        groupId: row.group_id,
        organizationId: row.organization_id,
        representativeId: row.representative_id,
        status: row.status,
        employeesCount: row.employees_count,
        pdfFileId: row.pdf_file_id,
        pdfFileUrl: row.pdf_file_url,
        reservedBy: row.reserved_by,
        reservedByName: row.reserved_by_name,
        reservedAt: row.reserved_at,
        reservationExpiresAt: row.reservation_expires_at,
        decisionBy: row.decision_by,
        decisionByName: row.decision_by_name,
        decisionAt: row.decision_at,
        rejectionReason: row.rejection_reason,
        representativeNotes: row.representative_notes,
        adminNotes: row.admin_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };

    // Add group data if available
    if (row.group_code) {
        const enrolledCount = row.group_enrolled_count || 0;
        const reservedCount = row.group_current_reserved || 0;
        const maxCapacity = row.group_max_capacity || 0;

        request.group = {
            id: row.group_id,
            code: row.group_code,
            courseName: row.course_name || '',
            courseShortName: row.course_short_name || '',
            startDate: row.group_start_date ? formatDateLocal(row.group_start_date) : '',
            endDate: row.group_end_date ? formatDateLocal(row.group_end_date) : '',
            maxCapacity: row.group_max_capacity ?? null,
            availableSlots: maxCapacity - enrolledCount - reservedCount,
        };
    }

    // Add organization data if available
    if (row.organization_name) {
        request.organization = {
            id: row.organization_id,
            name: row.organization_name,
            shortName: row.organization_short_name || null,
        };
    }

    // Add representative data if available
    if (row.representative_full_name) {
        request.representative = {
            id: row.representative_id,
            fullName: row.representative_full_name,
            phone: row.representative_phone || '',
        };
    }

    return request;
}

function mapRowToEmployee(row: RequestEmployeeRow): RequestEmployee {
    const employee: RequestEmployee = {
        id: row.id,
        requestId: row.request_id,
        studentId: row.student_id,
        enrollmentStatus: row.enrollment_status,
        enrolledAt: row.enrolled_at,
        createdAt: row.created_at,
    };

    if (row.student_full_name) {
        employee.student = {
            id: row.student_id,
            fullName: row.student_full_name,
            pinfl: row.student_pinfl || '',
            position: row.student_position || '',
            department: row.student_department || null,
        };
    }

    return employee;
}

function mapRowToHistory(row: RequestHistoryRow): RequestHistoryEntry {
    return {
        id: row.id,
        requestId: row.request_id,
        action: row.action,
        performedBy: row.performed_by,
        performedByType: row.performed_by_type,
        performedByName: row.performed_by_name,
        oldStatus: row.old_status,
        newStatus: row.new_status,
        details: row.details ? JSON.parse(row.details) : null,
        createdAt: row.created_at,
    };
}

// Форматирует дату в строку YYYY-MM-DD
function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить заявки с пагинацией
 */
export async function getRequestsPaginated(
    params: { page?: number; limit?: number; filters?: RequestFilters } = {}
): Promise<{ data: TrainingRequest[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;
    const filters = params.filters || {};

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (filters.status) {
        whereClause += ' AND tr.status = ?';
        queryParams.push(filters.status);
    }

    if (filters.groupId) {
        whereClause += ' AND tr.group_id = ?';
        queryParams.push(filters.groupId);
    }

    if (filters.organizationId) {
        whereClause += ' AND tr.organization_id = ?';
        queryParams.push(filters.organizationId);
    }

    if (filters.representativeId) {
        whereClause += ' AND tr.representative_id = ?';
        queryParams.push(filters.representativeId);
    }

    if (filters.dateFrom) {
        whereClause += ' AND DATE(tr.created_at) >= ?';
        queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
        whereClause += ' AND DATE(tr.created_at) <= ?';
        queryParams.push(filters.dateTo);
    }

    if (filters.search) {
        whereClause += ' AND (o.name LIKE ? OR sg.code LIKE ? OR r.full_name LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Count query
    const countQuery = `
    SELECT COUNT(*) as total
    FROM training_requests tr
    LEFT JOIN organizations o ON tr.organization_id = o.id
    LEFT JOIN study_groups sg ON tr.group_id = sg.id
    LEFT JOIN organization_representatives r ON tr.representative_id = r.id
    ${whereClause}
  `;
    const countRows = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countRows[0]?.total || 0;

    // Data query
    const dataQuery = `
    SELECT 
      tr.*,
      sg.code as group_code,
      c.name as course_name,
      c.short_name as course_short_name,
      sg.start_date as group_start_date,
      sg.end_date as group_end_date,
      sg.max_capacity as group_max_capacity,
      sg.current_reserved as group_current_reserved,
      (SELECT COUNT(*) FROM study_group_students WHERE group_id = sg.id) as group_enrolled_count,
      o.name as organization_name,
      o.short_name as organization_short_name,
      r.full_name as representative_full_name,
      r.phone as representative_phone,
      u_reserved.name as reserved_by_name,
      u_decision.name as decision_by_name,
      f.full_path as pdf_file_url
    FROM training_requests tr
    LEFT JOIN study_groups sg ON tr.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN organizations o ON tr.organization_id = o.id
    LEFT JOIN organization_representatives r ON tr.representative_id = r.id
    LEFT JOIN users u_reserved ON tr.reserved_by = u_reserved.id
    LEFT JOIN users u_decision ON tr.decision_by = u_decision.id
    LEFT JOIN files f ON tr.pdf_file_id = f.id
    ${whereClause}
    ORDER BY tr.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const rows = await executeQuery<TrainingRequestRow[]>(
        dataQuery,
        [...queryParams, limit, offset]
    );

    return {
        data: rows.map(mapRowToRequest),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить заявку по ID
 */
export async function getRequestById(id: string): Promise<TrainingRequest | null> {
    const query = `
    SELECT 
      tr.*,
      sg.code as group_code,
      c.name as course_name,
      c.short_name as course_short_name,
      sg.start_date as group_start_date,
      sg.end_date as group_end_date,
      sg.max_capacity as group_max_capacity,
      sg.current_reserved as group_current_reserved,
      (SELECT COUNT(*) FROM study_group_students WHERE group_id = sg.id) as group_enrolled_count,
      o.name as organization_name,
      o.short_name as organization_short_name,
      r.full_name as representative_full_name,
      r.phone as representative_phone,
      u_reserved.name as reserved_by_name,
      u_decision.name as decision_by_name,
      f.full_path as pdf_file_url
    FROM training_requests tr
    LEFT JOIN study_groups sg ON tr.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN organizations o ON tr.organization_id = o.id
    LEFT JOIN organization_representatives r ON tr.representative_id = r.id
    LEFT JOIN users u_reserved ON tr.reserved_by = u_reserved.id
    LEFT JOIN users u_decision ON tr.decision_by = u_decision.id
    LEFT JOIN files f ON tr.pdf_file_id = f.id
    WHERE tr.id = ?
  `;

    const rows = await executeQuery<TrainingRequestRow[]>(query, [id]);

    if (rows.length === 0) return null;

    const request = mapRowToRequest(rows[0]);

    // Load employees
    request.employees = await getRequestEmployees(id);

    return request;
}

/**
 * Получить сотрудников заявки
 */
export async function getRequestEmployees(requestId: string): Promise<RequestEmployee[]> {
    const query = `
    SELECT 
      re.*,
      s.full_name as student_full_name,
      s.pinfl as student_pinfl,
      s.position as student_position,
      s.department as student_department
    FROM request_employees re
    LEFT JOIN students s ON re.student_id = s.id
    WHERE re.request_id = ?
    ORDER BY s.full_name
  `;

    const rows = await executeQuery<RequestEmployeeRow[]>(query, [requestId]);
    return rows.map(mapRowToEmployee);
}

/**
 * Получить заявки представителя
 */
export async function getRepresentativeRequests(
    representativeId: string,
    filters?: { status?: RequestStatus }
): Promise<TrainingRequest[]> {
    let query = `
    SELECT 
      tr.*,
      sg.code as group_code,
      c.name as course_name,
      c.short_name as course_short_name,
      sg.start_date as group_start_date,
      sg.end_date as group_end_date
    FROM training_requests tr
    LEFT JOIN study_groups sg ON tr.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    WHERE tr.representative_id = ?
  `;

    const params: any[] = [representativeId];

    if (filters?.status) {
        query += ' AND tr.status = ?';
        params.push(filters.status);
    }

    query += ' ORDER BY tr.created_at DESC';

    const rows = await executeQuery<TrainingRequestRow[]>(query, params);
    return rows.map(mapRowToRequest);
}

/**
 * Получить заявки по группе
 */
export async function getRequestsByGroup(
    groupId: string,
    status?: RequestStatus
): Promise<TrainingRequest[]> {
    let query = `
    SELECT 
      tr.*,
      o.name as organization_name,
      o.short_name as organization_short_name,
      r.full_name as representative_full_name,
      r.phone as representative_phone
    FROM training_requests tr
    LEFT JOIN organizations o ON tr.organization_id = o.id
    LEFT JOIN organization_representatives r ON tr.representative_id = r.id
    WHERE tr.group_id = ?
  `;

    const params: any[] = [groupId];

    if (status) {
        query += ' AND tr.status = ?';
        params.push(status);
    }

    query += ' ORDER BY tr.created_at DESC';

    const rows = await executeQuery<TrainingRequestRow[]>(query, params);
    return rows.map(mapRowToRequest);
}

/**
 * Создать заявку
 */
export async function createRequest(data: CreateRequestInput): Promise<TrainingRequest> {
    return executeTransaction(async (connection: PoolConnection) => {
        const id = uuidv4();
        const employeesCount = data.studentIds.length;

        // Create request
        await connection.query(
            `INSERT INTO training_requests (
        id, group_id, organization_id, representative_id, 
        status, employees_count, pdf_file_id, representative_notes
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
            [
                id,
                data.groupId,
                data.organizationId,
                data.representativeId,
                employeesCount,
                data.pdfFileId || null,
                data.representativeNotes || null
            ]
        );

        // Add employees
        for (const studentId of data.studentIds) {
            const employeeId = uuidv4();
            await connection.query(
                `INSERT INTO request_employees (id, request_id, student_id, enrollment_status)
         VALUES (?, ?, ?, 'pending')`,
                [employeeId, id, studentId]
            );
        }

        // Add history entry
        await addHistoryEntry(connection, {
            requestId: id,
            action: 'created',
            performedBy: data.representativeId,
            performedByType: 'representative',
            newStatus: 'pending',
            details: { employeesCount, studentIds: data.studentIds },
        });

        // Return created request
        const request = await getRequestById(id);
        if (!request) throw new Error('Failed to create request');
        return request;
    });
}

/**
 * Забронировать места (admin/manager)
 */
export async function reserveRequest(
    requestId: string,
    reservedBy: string,
    expiresInDays: number = 3
): Promise<TrainingRequest | null> {
    return executeTransaction(async (connection: PoolConnection) => {
        // Get current request
        const [rows] = await connection.query<TrainingRequestRow[]>(
            'SELECT * FROM training_requests WHERE id = ? FOR UPDATE',
            [requestId]
        );

        if (rows.length === 0) return null;
        const request = rows[0];

        if (request.status !== 'pending') {
            throw new Error(`Невозможно забронировать заявку со статусом "${request.status}"`);
        }

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        // Update request status
        await connection.query(
            `UPDATE training_requests 
       SET status = 'reserved', 
           reserved_by = ?, 
           reserved_at = NOW(3), 
           reservation_expires_at = ?
       WHERE id = ?`,
            [reservedBy, expiresAt, requestId]
        );

        // Update group's reserved count
        await connection.query(
            `UPDATE study_groups 
       SET current_reserved = current_reserved + ? 
       WHERE id = ?`,
            [request.employees_count, request.group_id]
        );

        // Add history entry
        await addHistoryEntry(connection, {
            requestId,
            action: 'reserved',
            performedBy: reservedBy,
            performedByType: 'admin', // or determine from user role
            oldStatus: 'pending',
            newStatus: 'reserved',
            details: { expiresAt: expiresAt.toISOString() },
        });

        return getRequestById(requestId);
    });
}

/**
 * Одобрить заявку (после загрузки PDF)
 */
export async function approveRequest(
    requestId: string,
    approvedBy: string,
    adminNotes?: string
): Promise<TrainingRequest | null> {
    return executeTransaction(async (connection: PoolConnection) => {
        // Get current request
        const [rows] = await connection.query<TrainingRequestRow[]>(
            'SELECT * FROM training_requests WHERE id = ? FOR UPDATE',
            [requestId]
        );

        if (rows.length === 0) return null;
        const request = rows[0];

        if (request.status !== 'reserved') {
            throw new Error(`Невозможно одобрить заявку со статусом "${request.status}". Требуется статус "reserved"`);
        }

        if (!request.pdf_file_id) {
            throw new Error('PDF-файл заявки не загружен');
        }

        // Get employees
        const [employees] = await connection.query<RequestEmployeeRow[]>(
            'SELECT * FROM request_employees WHERE request_id = ? AND enrollment_status = "pending"',
            [requestId]
        );

        // Enroll students in group
        for (const emp of employees) {
            // Check if already in group
            const [existing] = await connection.query<RowDataPacket[]>(
                'SELECT id FROM study_group_students WHERE group_id = ? AND student_id = ?',
                [request.group_id, emp.student_id]
            );

            if (existing.length === 0) {
                await connection.query(
                    `INSERT INTO study_group_students (id, group_id, student_id, enrolled_at)
           VALUES (?, ?, ?, NOW(3))`,
                    [uuidv4(), request.group_id, emp.student_id]
                );
            }

            // Update employee status
            await connection.query(
                `UPDATE request_employees 
         SET enrollment_status = 'enrolled', enrolled_at = NOW(3)
         WHERE id = ?`,
                [emp.id]
            );
        }

        // Update request status
        await connection.query(
            `UPDATE training_requests 
       SET status = 'approved', 
           decision_by = ?, 
           decision_at = NOW(3),
           admin_notes = COALESCE(?, admin_notes)
       WHERE id = ?`,
            [approvedBy, adminNotes || null, requestId]
        );

        // Decrease reserved count (students are now enrolled)
        await connection.query(
            `UPDATE study_groups 
       SET current_reserved = GREATEST(0, current_reserved - ?) 
       WHERE id = ?`,
            [request.employees_count, request.group_id]
        );

        // Add history entry
        await addHistoryEntry(connection, {
            requestId,
            action: 'approved',
            performedBy: approvedBy,
            performedByType: 'admin',
            oldStatus: 'reserved',
            newStatus: 'approved',
            details: { enrolledCount: employees.length },
        });

        return getRequestById(requestId);
    });
}

/**
 * Отклонить заявку
 */
export async function rejectRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
): Promise<TrainingRequest | null> {
    return executeTransaction(async (connection: PoolConnection) => {
        // Get current request
        const [rows] = await connection.query<TrainingRequestRow[]>(
            'SELECT * FROM training_requests WHERE id = ? FOR UPDATE',
            [requestId]
        );

        if (rows.length === 0) return null;
        const request = rows[0];

        if (!['pending', 'reserved'].includes(request.status)) {
            throw new Error(`Невозможно отклонить заявку со статусом "${request.status}"`);
        }

        const oldStatus = request.status;

        // If was reserved, free up the slots
        if (request.status === 'reserved') {
            await connection.query(
                `UPDATE study_groups 
         SET current_reserved = GREATEST(0, current_reserved - ?) 
         WHERE id = ?`,
                [request.employees_count, request.group_id]
            );
        }

        // Update request status
        await connection.query(
            `UPDATE training_requests 
       SET status = 'rejected', 
           decision_by = ?, 
           decision_at = NOW(3),
           rejection_reason = ?
       WHERE id = ?`,
            [rejectedBy, reason, requestId]
        );

        // Add history entry
        await addHistoryEntry(connection, {
            requestId,
            action: 'rejected',
            performedBy: rejectedBy,
            performedByType: 'admin',
            oldStatus,
            newStatus: 'rejected',
            details: { reason },
        });

        return getRequestById(requestId);
    });
}

/**
 * Отозвать заявку (представителем)
 */
export async function withdrawRequest(requestId: string): Promise<TrainingRequest | null> {
    return executeTransaction(async (connection: PoolConnection) => {
        // Get current request
        const [rows] = await connection.query<TrainingRequestRow[]>(
            'SELECT * FROM training_requests WHERE id = ? FOR UPDATE',
            [requestId]
        );

        if (rows.length === 0) return null;
        const request = rows[0];

        if (!['pending', 'reserved'].includes(request.status)) {
            throw new Error(`Невозможно отозвать заявку со статусом "${request.status}"`);
        }

        const oldStatus = request.status;

        // If was reserved, free up the slots
        if (request.status === 'reserved') {
            await connection.query(
                `UPDATE study_groups 
         SET current_reserved = GREATEST(0, current_reserved - ?) 
         WHERE id = ?`,
                [request.employees_count, request.group_id]
            );
        }

        // Update request status
        await connection.query(
            `UPDATE training_requests SET status = 'withdrawn' WHERE id = ?`,
            [requestId]
        );

        // Add history entry
        await addHistoryEntry(connection, {
            requestId,
            action: 'withdrawn',
            performedBy: request.representative_id,
            performedByType: 'representative',
            oldStatus,
            newStatus: 'withdrawn',
        });

        return getRequestById(requestId);
    });
}

/**
 * Загрузить PDF к заявке
 */
export async function attachPdfToRequest(
    requestId: string,
    fileId: number,
    uploadedBy: string
): Promise<void> {
    await executeQuery(
        `UPDATE training_requests SET pdf_file_id = ? WHERE id = ?`,
        [fileId, requestId]
    );

    // Add history entry
    await executeQuery(
        `INSERT INTO request_history (request_id, action, performed_by, performed_by_type, details, created_at)
     VALUES (?, 'pdf_uploaded', ?, 'representative', ?, NOW(3))`,
        [requestId, uploadedBy, JSON.stringify({ fileId })]
    );
}

/**
 * Получить историю заявки
 */
export async function getRequestHistory(requestId: string): Promise<RequestHistoryEntry[]> {
    const query = `
    SELECT 
      rh.*,
      COALESCE(u.name, r.full_name, 'Система') as performed_by_name
    FROM request_history rh
    LEFT JOIN users u ON rh.performed_by = u.id
    LEFT JOIN organization_representatives r ON rh.performed_by = r.id
    WHERE rh.request_id = ?
    ORDER BY rh.created_at DESC
  `;

    const rows = await executeQuery<RequestHistoryRow[]>(query, [requestId]);
    return rows.map(mapRowToHistory);
}

/**
 * Статистика заявок
 */
export async function getRequestsStats(): Promise<RequestStats> {
    const query = `
    SELECT status, COUNT(*) as count
    FROM training_requests
    GROUP BY status
  `;

    const rows = await executeQuery<StatsRow[]>(query);

    const stats: RequestStats = {
        total: 0,
        pending: 0,
        reserved: 0,
        approved: 0,
        rejected: 0,
        withdrawn: 0,
    };

    for (const row of rows) {
        const status = row.status as keyof RequestStats;
        if (status !== 'total') {
            stats[status] = row.count;
            stats.total += row.count;
        }
    }

    return stats;
}

/**
 * Проверить возможность подачи заявки
 */
export async function canSubmitRequest(
    representativeId: string,
    groupId: string
): Promise<{ allowed: boolean; reason?: string }> {
    // Check if representative exists and is approved
    const repRows = await executeQuery<RowDataPacket[]>(
        `SELECT id, status FROM organization_representatives WHERE id = ?`,
        [representativeId]
    );

    if (repRows.length === 0) {
        return { allowed: false, reason: 'Представитель не найден' };
    }

    if (repRows[0].status !== 'approved') {
        return { allowed: false, reason: 'Представитель не авторизован' };
    }

    // Check if group exists and accepts requests
    const groupRows = await executeQuery<RowDataPacket[]>(
        `SELECT id, announcement_status, accepts_requests, request_deadline, max_capacity, current_reserved,
     (SELECT COUNT(*) FROM study_group_students WHERE group_id = sg.id) as enrolled_count
     FROM study_groups sg WHERE id = ?`,
        [groupId]
    );

    if (groupRows.length === 0) {
        return { allowed: false, reason: 'Группа не найдена' };
    }

    const group = groupRows[0];

    if (group.announcement_status !== 'announced') {
        return { allowed: false, reason: 'Группа недоступна для заявок' };
    }

    if (!group.accepts_requests) {
        return { allowed: false, reason: 'Группа не принимает заявки' };
    }

    if (group.request_deadline && new Date(group.request_deadline) < new Date()) {
        return { allowed: false, reason: 'Срок подачи заявок истёк' };
    }

    // Check if there's already a pending/reserved request from this organization
    const existingRows = await executeQuery<RowDataPacket[]>(
        `SELECT tr.id 
     FROM training_requests tr
     JOIN organization_representatives r ON tr.representative_id = r.id
     WHERE tr.group_id = ? 
       AND r.organization_id = (SELECT organization_id FROM organization_representatives WHERE id = ?)
       AND tr.status IN ('pending', 'reserved')`,
        [groupId, representativeId]
    );

    if (existingRows.length > 0) {
        return { allowed: false, reason: 'От вашей организации уже есть активная заявка на эту группу' };
    }

    return { allowed: true };
}

/**
 * Обработка истекших бронирований (вызывается по cron)
 */
export async function processExpiredReservations(): Promise<number> {
    return executeTransaction(async (connection: PoolConnection) => {
        // Get expired reservations
        const [rows] = await connection.query<TrainingRequestRow[]>(
            `SELECT * FROM training_requests 
       WHERE status = 'reserved' AND reservation_expires_at < NOW()
       FOR UPDATE`
        );

        for (const request of rows) {
            // Free up reserved slots
            await connection.query(
                `UPDATE study_groups 
         SET current_reserved = GREATEST(0, current_reserved - ?) 
         WHERE id = ?`,
                [request.employees_count, request.group_id]
            );

            // Update status to withdrawn (expired)
            await connection.query(
                `UPDATE training_requests SET status = 'withdrawn' WHERE id = ?`,
                [request.id]
            );

            // Add history entry
            await addHistoryEntry(connection, {
                requestId: request.id,
                action: 'expired',
                performedBy: null,
                performedByType: 'system',
                oldStatus: 'reserved',
                newStatus: 'withdrawn',
                details: { reason: 'Истёк срок бронирования' },
            });
        }

        return rows.length;
    });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function addHistoryEntry(
    connection: PoolConnection,
    data: {
        requestId: string;
        action: RequestAction;
        performedBy: string | null;
        performedByType: PerformerType;
        oldStatus?: string;
        newStatus?: string;
        details?: Record<string, any>;
    }
): Promise<void> {
    await connection.query(
        `INSERT INTO request_history 
     (request_id, action, performed_by, performed_by_type, old_status, new_status, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))`,
        [
            data.requestId,
            data.action,
            data.performedBy,
            data.performedByType,
            data.oldStatus || null,
            data.newStatus || null,
            data.details ? JSON.stringify(data.details) : null,
        ]
    );
}
