/**
 * Репозиторий для работы с инструкторами в MySQL
 */

import { executeQuery } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface Instructor {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorFilters {
  search?: string;
  isActive?: boolean;
  specialization?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  filters?: InstructorFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateInstructorInput {
  fullName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  photoUrl?: string;
  isActive?: boolean;
}

export interface UpdateInstructorInput {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  isActive?: boolean;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface InstructorRow extends RowDataPacket {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  discipline_count?: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// MAPPING
// ============================================================================

function mapRowToInstructor(row: InstructorRow): Instructor & { disciplineCount?: number } {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    specialization: row.specialization,
    bio: row.bio,
    photoUrl: row.photo_url,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    disciplineCount: row.discipline_count,
  };
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

export async function getAllInstructors(activeOnly = true): Promise<Instructor[]> {
  const query = activeOnly
    ? 'SELECT * FROM instructors WHERE is_active = true ORDER BY full_name'
    : 'SELECT * FROM instructors ORDER BY full_name';
  
  const rows = await executeQuery<InstructorRow[]>(query);
  return rows.map(mapRowToInstructor);
}

export async function getInstructorsPaginated(params: PaginationParams = {}): Promise<PaginatedResult<Instructor & { disciplineCount?: number }>> {
  const { page = 1, limit = 10, filters = {} } = params;
  const { search, isActive, specialization } = filters;
  
  const conditions: string[] = [];
  const queryParams: any[] = [];
  
  if (search) {
    conditions.push('(full_name LIKE ? OR email LIKE ? OR specialization LIKE ?)');
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }
  
  if (isActive !== undefined) {
    conditions.push('is_active = ?');
    queryParams.push(isActive);
  }
  
  if (specialization) {
    conditions.push('specialization LIKE ?');
    queryParams.push(`%${specialization}%`);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Count
  const countResult = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM instructors ${whereClause}`,
    queryParams
  );
  const total = countResult[0]?.total || 0;
  
  // Data with discipline count
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT i.*,
           (SELECT COUNT(DISTINCT di.discipline_id) FROM discipline_instructors di WHERE di.instructor_id = i.id) as discipline_count
    FROM instructors i
    ${whereClause}
    ORDER BY i.full_name
    LIMIT ? OFFSET ?
  `;
  
  const rows = await executeQuery<InstructorRow[]>(dataQuery, [...queryParams, limit, offset]);
  
  return {
    data: rows.map(mapRowToInstructor),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getInstructorById(id: string): Promise<Instructor | null> {
  const rows = await executeQuery<InstructorRow[]>(
    'SELECT * FROM instructors WHERE id = ? LIMIT 1',
    [id]
  );
  
  return rows.length > 0 ? mapRowToInstructor(rows[0]) : null;
}

export async function instructorEmailExists(email: string, excludeId?: string): Promise<boolean> {
  if (!email) return false;
  
  let query = 'SELECT 1 FROM instructors WHERE email = ?';
  const params: any[] = [email];
  
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

export async function createInstructor(data: CreateInstructorInput): Promise<Instructor> {
  const id = uuidv4();
  const now = new Date();
  
  await executeQuery(
    `INSERT INTO instructors (id, full_name, email, phone, specialization, bio, photo_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.fullName,
      data.email || null,
      data.phone || null,
      data.specialization || null,
      data.bio || null,
      data.photoUrl || null,
      data.isActive !== false,
      now,
      now
    ]
  );
  
  const instructor = await getInstructorById(id);
  if (!instructor) throw new Error('Failed to create instructor');
  
  return instructor;
}

export async function updateInstructor(id: string, data: UpdateInstructorInput): Promise<Instructor | null> {
  const existing = await getInstructorById(id);
  if (!existing) return null;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(data.fullName);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    params.push(data.email);
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?');
    params.push(data.phone);
  }
  if (data.specialization !== undefined) {
    updates.push('specialization = ?');
    params.push(data.specialization);
  }
  if (data.bio !== undefined) {
    updates.push('bio = ?');
    params.push(data.bio);
  }
  if (data.photoUrl !== undefined) {
    updates.push('photo_url = ?');
    params.push(data.photoUrl);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive);
  }
  
  if (updates.length === 0) return existing;
  
  params.push(id);
  await executeQuery(
    `UPDATE instructors SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return getInstructorById(id);
}

export async function deleteInstructor(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM instructors WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить список уникальных специализаций
 */
export async function getUniqueSpecializations(): Promise<string[]> {
  const rows = await executeQuery<(RowDataPacket & { specialization: string })[]>(
    'SELECT DISTINCT specialization FROM instructors WHERE specialization IS NOT NULL AND specialization != "" ORDER BY specialization'
  );
  return rows.map(r => r.specialization);
}

/**
 * Получить инструкторов по списку ID
 */
export async function getInstructorsByIds(ids: string[]): Promise<Instructor[]> {
  if (ids.length === 0) return [];
  
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await executeQuery<InstructorRow[]>(
    `SELECT * FROM instructors WHERE id IN (${placeholders}) ORDER BY full_name`,
    ids
  );
  
  return rows.map(mapRowToInstructor);
}
