/**
 * GET /api/certificates
 * Получить все выданные сертификаты с фильтрацией и пагинацией
 */

import { z } from 'zod';
import { executeQuery } from '../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import { logActivity } from '../../utils/activityLogger';

const querySchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  search: z.string().optional(),
  status: z.enum(['issued', 'revoked', 'all']).optional().default('all'),
  groupId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  organizationName: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['issue_date', 'student_name', 'certificate_number', 'course_name']).optional().default('issue_date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

interface CertificateRow extends RowDataPacket {
  id: string;
  certificate_number: string;
  issue_date: Date;
  status: string;
  pdf_file_url: string | null;
  docx_file_url: string | null;
  student_id: string;
  student_name: string;
  student_organization: string | null;
  student_position: string | null;
  student_pinfl: string | null;
  group_id: string;
  group_code: string;
  course_name: string;
  course_code: string;
  template_id: string;
  template_name: string;
  issued_by: string | null;
  issued_by_name: string | null;
  issued_at: Date | null;
  revoked_at: Date | null;
  revoke_reason: string | null;
  has_warnings: boolean;
  notes: string | null;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = querySchema.parse(query);

    // Формируем базовый запрос
    let baseQuery = `
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      JOIN study_groups g ON ic.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      JOIN certificate_templates ct ON ic.template_id = ct.id
      LEFT JOIN users u ON ic.issued_by = u.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    // Фильтр по статусу
    if (params.status && params.status !== 'all') {
      baseQuery += ' AND ic.status = ?';
      queryParams.push(params.status);
    }

    // Поиск
    if (params.search) {
      baseQuery += ' AND (s.full_name LIKE ? OR ic.certificate_number LIKE ? OR s.pinfl LIKE ?)';
      const searchPattern = `%${params.search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Фильтр по группе
    if (params.groupId) {
      baseQuery += ' AND ic.group_id = ?';
      queryParams.push(params.groupId);
    }

    // Фильтр по шаблону
    if (params.templateId) {
      baseQuery += ' AND ic.template_id = ?';
      queryParams.push(params.templateId);
    }

    // Фильтр по организации
    if (params.organizationName) {
      baseQuery += ' AND s.organization LIKE ?';
      queryParams.push(`%${params.organizationName}%`);
    }

    // Фильтр по дате выдачи
    if (params.dateFrom) {
      baseQuery += ' AND DATE(ic.issue_date) >= ?';
      queryParams.push(params.dateFrom);
    }

    if (params.dateTo) {
      baseQuery += ' AND DATE(ic.issue_date) <= ?';
      queryParams.push(params.dateTo);
    }

    // Получаем общее количество записей
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countResult?.total || 0;

    // Формируем сортировку
    let orderBy = 'ic.issue_date';
    switch (params.sortBy) {
      case 'student_name':
        orderBy = 's.full_name';
        break;
      case 'certificate_number':
        orderBy = 'ic.certificate_number';
        break;
      case 'course_name':
        orderBy = 'c.name';
        break;
    }

    // Формируем основной запрос с данными
    const selectQuery = `
      SELECT 
        ic.id,
        ic.certificate_number,
        ic.issue_date,
        ic.status,
        ic.pdf_file_url,
        ic.docx_file_url,
        ic.student_id,
        s.full_name as student_name,
        s.organization as student_organization,
        s.position as student_position,
        s.pinfl as student_pinfl,
        ic.group_id,
        g.code as group_code,
        c.name as course_name,
        c.code as course_code,
        ic.template_id,
        ct.name as template_name,
        ic.issued_by,
        u.name as issued_by_name,
        ic.issued_at,
        ic.revoked_at,
        ic.revoke_reason,
        ic.warnings IS NOT NULL AND JSON_LENGTH(ic.warnings) > 0 as has_warnings,
        ic.notes,
        ic.created_at
      ${baseQuery}
      ORDER BY ${orderBy} ${params.sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const offset = (params.page - 1) * params.limit;
    const dataParams = [...queryParams, params.limit, offset];
    const certificates = await executeQuery<CertificateRow[]>(selectQuery, dataParams);

    // Преобразуем в удобный формат
    const items = certificates.map(row => ({
      id: row.id,
      certificateNumber: row.certificate_number,
      issueDate: row.issue_date,
      status: row.status,
      pdfFileUrl: row.pdf_file_url,
      docxFileUrl: row.docx_file_url,
      student: {
        id: row.student_id,
        fullName: row.student_name,
        organization: row.student_organization,
        position: row.student_position,
        pinfl: row.student_pinfl,
      },
      group: {
        id: row.group_id,
        code: row.group_code,
      },
      course: {
        name: row.course_name,
        code: row.course_code,
      },
      template: {
        id: row.template_id,
        name: row.template_name,
      },
      issuedBy: row.issued_by ? {
        id: row.issued_by,
        name: row.issued_by_name,
      } : null,
      issuedAt: row.issued_at,
      revokedAt: row.revoked_at,
      revokeReason: row.revoke_reason,
      hasWarnings: Boolean(row.has_warnings),
      notes: row.notes,
      createdAt: row.created_at,
    }));

    // Получаем статистику
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ic.status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN ic.status = 'revoked' THEN 1 ELSE 0 END) as revoked,
        COUNT(DISTINCT s.organization) as organizations,
        COUNT(DISTINCT ic.group_id) as groups
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
    `;
    const [stats] = await executeQuery<any[]>(statsQuery);

    // Логируем просмотр
    await logActivity(
      event,
      'READ',
      'CERTIFICATE_DATABASE',
      undefined,
      `Просмотр базы сертификатов (страница ${params.page})`,
      { filters: { status: params.status, search: params.search, dateFrom: params.dateFrom, dateTo: params.dateTo } }
    );

    console.log(`[GET /api/certificates] Найдено ${total} сертификатов, отображено ${items.length}`);

    return {
      success: true,
      data: {
        items,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        },
        stats: {
          total: stats?.total || 0,
          issued: stats?.issued || 0,
          revoked: stats?.revoked || 0,
          organizations: stats?.organizations || 0,
          groups: stats?.groups || 0,
        },
      },
    };
  } catch (error: any) {
    console.error('[GET /api/certificates] Error:', error);

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Ошибка валидации параметров',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка получения списка сертификатов',
    });
  }
});
