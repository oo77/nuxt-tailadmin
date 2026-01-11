/**
 * Репозиторий для работы с объявлениями о наборе на обучение
 */

import { executeQuery, executeTransaction } from '../utils/db';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ТИПЫ
// ============================================================================

export type AnnouncementStatus = 'draft' | 'published' | 'closed' | 'archived';
export type AnnouncementType = 'single_group' | 'multiple_groups' | 'program';

export interface Announcement {
    id: string;
    title: string;
    description: string | null;
    announcementType: AnnouncementType;
    status: AnnouncementStatus;
    publishedAt: Date | null;
    closedAt: Date | null;
    requestDeadline: Date | null;
    requiresPdf: boolean;
    autoApprove: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;

    // Связанные данные
    groups?: AnnouncementGroup[];
    stats?: AnnouncementStats;
    creator?: {
        id: string;
        fullName: string;
    };
}

export interface AnnouncementGroup {
    id: string;
    announcementId: string;
    groupId: string;
    maxCapacity: number | null;
    currentReserved: number;
    currentApproved: number;
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

export interface AnnouncementStats {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    cancelledRequests: number;
    totalEmployees: number;
    approvedEmployees: number;
    availableSlots: number;
}

export interface CreateAnnouncementInput {
    title: string;
    description?: string;
    announcementType: AnnouncementType;
    groupIds: string[];
    requestDeadline?: string;
    requiresPdf?: boolean;
    autoApprove?: boolean;
    groupCapacities?: Record<string, number>; // { groupId: maxCapacity }
    createdBy: string;
}

export interface UpdateAnnouncementInput {
    title?: string;
    description?: string | null;
    requestDeadline?: string | null;
    requiresPdf?: boolean;
    autoApprove?: boolean;
}

export interface AnnouncementFilters {
    status?: AnnouncementStatus;
    announcementType?: AnnouncementType;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    createdBy?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    filters?: AnnouncementFilters;
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

interface AnnouncementRow extends RowDataPacket {
    id: string;
    title: string;
    description: string | null;
    announcement_type: AnnouncementType;
    status: AnnouncementStatus;
    published_at: Date | null;
    closed_at: Date | null;
    request_deadline: Date | null;
    requires_pdf: boolean;
    auto_approve: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;

    // JOIN данные
    creator_full_name?: string;
}

interface AnnouncementGroupRow extends RowDataPacket {
    id: string;
    announcement_id: string;
    group_id: string;
    max_capacity: number | null;
    current_reserved: number;
    current_approved: number;
    created_at: Date;

    // JOIN данные группы
    group_code?: string;
    course_name?: string;
    start_date?: Date;
    end_date?: Date;
}

interface CountRow extends RowDataPacket {
    total: number;
}

interface StatsRow extends RowDataPacket {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    cancelled_requests: number;
    total_employees: number;
    approved_employees: number;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToAnnouncement(row: AnnouncementRow): Announcement {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        announcementType: row.announcement_type,
        status: row.status,
        publishedAt: row.published_at,
        closedAt: row.closed_at,
        requestDeadline: row.request_deadline,
        requiresPdf: row.requires_pdf,
        autoApprove: row.auto_approve,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...(row.creator_full_name && {
            creator: {
                id: row.created_by,
                fullName: row.creator_full_name,
            },
        }),
    };
}

function mapRowToAnnouncementGroup(row: AnnouncementGroupRow): AnnouncementGroup {
    return {
        id: row.id,
        announcementId: row.announcement_id,
        groupId: row.group_id,
        maxCapacity: row.max_capacity,
        currentReserved: row.current_reserved,
        currentApproved: row.current_approved,
        createdAt: row.created_at,
        ...(row.group_code && {
            group: {
                id: row.group_id,
                code: row.group_code,
                courseName: row.course_name!,
                startDate: row.start_date!,
                endDate: row.end_date!,
            },
        }),
    };
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить список объявлений с пагинацией и фильтрами
 */
export async function getAnnouncements(
    params: PaginationParams = {}
): Promise<PaginatedResult<Announcement>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const filters = params.filters || {};

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Фильтры
    if (filters.status) {
        whereConditions.push('a.status = ?');
        queryParams.push(filters.status);
    }

    if (filters.announcementType) {
        whereConditions.push('a.announcement_type = ?');
        queryParams.push(filters.announcementType);
    }

    if (filters.search) {
        whereConditions.push('(a.title LIKE ? OR a.description LIKE ?)');
        const searchPattern = `%${filters.search}%`;
        queryParams.push(searchPattern, searchPattern);
    }

    if (filters.dateFrom) {
        whereConditions.push('DATE(a.created_at) >= ?');
        queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
        whereConditions.push('DATE(a.created_at) <= ?');
        queryParams.push(filters.dateTo);
    }

    if (filters.createdBy) {
        whereConditions.push('a.created_by = ?');
        queryParams.push(filters.createdBy);
    }

    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Получить общее количество
    const countQuery = `
    SELECT COUNT(*) as total
    FROM announcements a
    ${whereClause}
  `;

    const [countRows] = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countRows[0]?.total || 0;

    // Получить данные
    const dataQuery = `
    SELECT 
      a.*,
      u.full_name as creator_full_name
    FROM announcements a
    LEFT JOIN users u ON a.created_by = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const [rows] = await executeQuery<AnnouncementRow[]>(
        dataQuery,
        [...queryParams, limit, offset]
    );

    const data = rows.map(mapRowToAnnouncement);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить объявление по ID с полной информацией
 */
export async function getAnnouncementById(id: string): Promise<Announcement | null> {
    const query = `
    SELECT 
      a.*,
      u.full_name as creator_full_name
    FROM announcements a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
  `;

    const [rows] = await executeQuery<AnnouncementRow[]>(query, [id]);

    if (rows.length === 0) {
        return null;
    }

    const announcement = mapRowToAnnouncement(rows[0]);

    // Получить группы
    announcement.groups = await getAnnouncementGroups(id);

    // Получить статистику
    announcement.stats = await getAnnouncementStats(id);

    return announcement;
}

/**
 * Получить группы объявления
 */
export async function getAnnouncementGroups(announcementId: string): Promise<AnnouncementGroup[]> {
    const query = `
    SELECT 
      ag.*,
      sg.code as group_code,
      c.name as course_name,
      sg.start_date,
      sg.end_date
    FROM announcement_groups ag
    LEFT JOIN study_groups sg ON ag.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    WHERE ag.announcement_id = ?
    ORDER BY sg.start_date ASC
  `;

    const [rows] = await executeQuery<AnnouncementGroupRow[]>(query, [announcementId]);
    return rows.map(mapRowToAnnouncementGroup);
}

/**
 * Получить статистику объявления
 */
export async function getAnnouncementStats(announcementId: string): Promise<AnnouncementStats> {
    const query = `
    SELECT 
      COUNT(DISTINCT ar.id) as total_requests,
      SUM(CASE WHEN ar.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
      SUM(CASE WHEN ar.status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
      SUM(CASE WHEN ar.status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
      SUM(CASE WHEN ar.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_requests,
      COUNT(DISTINCT are.id) as total_employees,
      SUM(CASE WHEN are.enrollment_status = 'enrolled' THEN 1 ELSE 0 END) as approved_employees
    FROM announcement_requests ar
    LEFT JOIN announcement_request_employees are ON ar.id = are.request_id
    WHERE ar.announcement_id = ?
  `;

    const [rows] = await executeQuery<StatsRow[]>(query, [announcementId]);
    const stats = rows[0];

    // Получить доступные слоты
    const capacityQuery = `
    SELECT 
      COALESCE(SUM(ag.max_capacity), 0) as total_capacity,
      COALESCE(SUM(ag.current_approved), 0) as current_approved
    FROM announcement_groups ag
    WHERE ag.announcement_id = ?
  `;

    const [capacityRows] = await executeQuery<RowDataPacket[]>(capacityQuery, [announcementId]);
    const capacity = capacityRows[0];

    const totalCapacity = capacity?.total_capacity || 0;
    const currentApproved = capacity?.current_approved || 0;
    const availableSlots = totalCapacity > 0 ? totalCapacity - currentApproved : -1;

    return {
        totalRequests: stats?.total_requests || 0,
        pendingRequests: stats?.pending_requests || 0,
        approvedRequests: stats?.approved_requests || 0,
        rejectedRequests: stats?.rejected_requests || 0,
        cancelledRequests: stats?.cancelled_requests || 0,
        totalEmployees: stats?.total_employees || 0,
        approvedEmployees: stats?.approved_employees || 0,
        availableSlots,
    };
}

/**
 * Создать новое объявление
 */
export async function createAnnouncement(
    input: CreateAnnouncementInput
): Promise<Announcement> {
    const id = uuidv4();

    return await executeTransaction(async (connection) => {
        // Создать объявление
        const insertQuery = `
      INSERT INTO announcements (
        id, title, description, announcement_type, status,
        request_deadline, requires_pdf, auto_approve, created_by
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)
    `;

        await connection.execute<ResultSetHeader>(insertQuery, [
            id,
            input.title,
            input.description || null,
            input.announcementType,
            input.requestDeadline || null,
            input.requiresPdf ?? true,
            input.autoApprove ?? false,
            input.createdBy,
        ]);

        // Добавить группы
        if (input.groupIds.length > 0) {
            await addGroupsToAnnouncement(
                id,
                input.groupIds,
                input.groupCapacities || {},
                connection
            );
        }

        // Получить созданное объявление
        const announcement = await getAnnouncementById(id);
        if (!announcement) {
            throw new Error('Failed to create announcement');
        }

        return announcement;
    });
}

/**
 * Добавить группы к объявлению
 */
async function addGroupsToAnnouncement(
    announcementId: string,
    groupIds: string[],
    capacities: Record<string, number>,
    connection: PoolConnection
): Promise<void> {
    const values = groupIds.map((groupId) => {
        const groupAnnouncementId = uuidv4();
        const maxCapacity = capacities[groupId] || null;
        return [groupAnnouncementId, announcementId, groupId, maxCapacity];
    });

    const insertQuery = `
    INSERT INTO announcement_groups (id, announcement_id, group_id, max_capacity)
    VALUES ?
  `;

    await connection.query(insertQuery, [values]);
}

/**
 * Обновить объявление
 */
export async function updateAnnouncement(
    id: string,
    input: UpdateAnnouncementInput
): Promise<Announcement | null> {
    const updates: string[] = [];
    const params: any[] = [];

    if (input.title !== undefined) {
        updates.push('title = ?');
        params.push(input.title);
    }

    if (input.description !== undefined) {
        updates.push('description = ?');
        params.push(input.description);
    }

    if (input.requestDeadline !== undefined) {
        updates.push('request_deadline = ?');
        params.push(input.requestDeadline);
    }

    if (input.requiresPdf !== undefined) {
        updates.push('requires_pdf = ?');
        params.push(input.requiresPdf);
    }

    if (input.autoApprove !== undefined) {
        updates.push('auto_approve = ?');
        params.push(input.autoApprove);
    }

    if (updates.length === 0) {
        return getAnnouncementById(id);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `
    UPDATE announcements
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

    await executeQuery(query, params);

    return getAnnouncementById(id);
}

/**
 * Удалить объявление
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
    return await executeTransaction(async (connection) => {
        // Проверить, есть ли заявки
        const checkQuery = `
      SELECT COUNT(*) as count
      FROM announcement_requests
      WHERE announcement_id = ?
    `;

        const [checkRows] = await connection.execute<CountRow[]>(checkQuery, [id]);

        if (checkRows[0].count > 0) {
            throw new Error('Cannot delete announcement with existing requests');
        }

        // Удалить группы объявления
        await connection.execute(
            'DELETE FROM announcement_groups WHERE announcement_id = ?',
            [id]
        );

        // Удалить объявление
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM announcements WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    });
}

/**
 * Опубликовать объявление
 */
export async function publishAnnouncement(id: string): Promise<Announcement | null> {
    const query = `
    UPDATE announcements
    SET status = 'published', published_at = NOW(), updated_at = NOW()
    WHERE id = ? AND status = 'draft'
  `;

    const [result] = await executeQuery<ResultSetHeader>(query, [id]);

    if (result.affectedRows === 0) {
        throw new Error('Cannot publish announcement: not in draft status');
    }

    return getAnnouncementById(id);
}

/**
 * Закрыть объявление для приёма заявок
 */
export async function closeAnnouncement(id: string): Promise<Announcement | null> {
    const query = `
    UPDATE announcements
    SET status = 'closed', closed_at = NOW(), updated_at = NOW()
    WHERE id = ? AND status = 'published'
  `;

    const [result] = await executeQuery<ResultSetHeader>(query, [id]);

    if (result.affectedRows === 0) {
        throw new Error('Cannot close announcement: not in published status');
    }

    return getAnnouncementById(id);
}

/**
 * Архивировать объявление
 */
export async function archiveAnnouncement(id: string): Promise<Announcement | null> {
    const query = `
    UPDATE announcements
    SET status = 'archived', updated_at = NOW()
    WHERE id = ? AND status IN ('closed', 'published')
  `;

    const [result] = await executeQuery<ResultSetHeader>(query, [id]);

    if (result.affectedRows === 0) {
        throw new Error('Cannot archive announcement: invalid status');
    }

    return getAnnouncementById(id);
}

/**
 * Проверить доступность мест в объявлении
 */
export async function checkAnnouncementCapacity(
    announcementId: string,
    requestedSlots: number
): Promise<{ available: boolean; availableSlots: number }> {
    const query = `
    SELECT 
      COALESCE(SUM(ag.max_capacity), 0) as total_capacity,
      COALESCE(SUM(ag.current_reserved + ag.current_approved), 0) as current_used
    FROM announcement_groups ag
    WHERE ag.announcement_id = ?
  `;

    const [rows] = await executeQuery<RowDataPacket[]>(query, [announcementId]);
    const result = rows[0];

    const totalCapacity = result?.total_capacity || 0;
    const currentUsed = result?.current_used || 0;
    const availableSlots = totalCapacity > 0 ? totalCapacity - currentUsed : -1;

    return {
        available: availableSlots === -1 || availableSlots >= requestedSlots,
        availableSlots,
    };
}

/**
 * Получить опубликованные объявления для представителей
 */
export async function getPublishedAnnouncements(): Promise<Announcement[]> {
    const query = `
    SELECT 
      a.*,
      u.full_name as creator_full_name
    FROM announcements a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.status = 'published'
      AND (a.request_deadline IS NULL OR a.request_deadline >= NOW())
    ORDER BY a.published_at DESC
  `;

    const [rows] = await executeQuery<AnnouncementRow[]>(query);
    const announcements = rows.map(mapRowToAnnouncement);

    // Добавить группы и статистику для каждого объявления
    for (const announcement of announcements) {
        announcement.groups = await getAnnouncementGroups(announcement.id);
        announcement.stats = await getAnnouncementStats(announcement.id);
    }

    return announcements;
}
