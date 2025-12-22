/**
 * Репозиторий для работы с расписанием в MySQL
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export type ScheduleEventType = 'theory' | 'practice' | 'assessment' | 'other';
export type ScheduleEventColor = 'primary' | 'success' | 'warning' | 'danger';

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  groupId: string | null;
  disciplineId: string | null;
  instructorId: string | null;
  classroomId: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  color: ScheduleEventColor;
  eventType: ScheduleEventType;
  isRecurring: boolean;
  recurrenceRule: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  group?: {
    id: string;
    code: string;
    courseName: string;
  } | null;
  instructor?: {
    id: string;
    fullName: string;
  } | null;
  classroom?: {
    id: string;
    name: string;
    capacity: number;
  } | null;
  discipline?: {
    id: string;
    name: string;
  } | null;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduleEventInput {
  title: string;
  description?: string;
  groupId?: string;
  disciplineId?: string;
  instructorId?: string;
  classroomId?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  color?: ScheduleEventColor;
  eventType?: ScheduleEventType;
  isRecurring?: boolean;
  recurrenceRule?: string;
  notes?: string;
}

export interface UpdateScheduleEventInput {
  title?: string;
  description?: string | null;
  groupId?: string | null;
  disciplineId?: string | null;
  instructorId?: string | null;
  classroomId?: string | null;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  color?: ScheduleEventColor;
  eventType?: ScheduleEventType;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
  notes?: string | null;
}

export interface ScheduleFilters {
  startDate?: string;
  endDate?: string;
  groupId?: string;
  instructorId?: string;
  classroomId?: string;
  eventType?: ScheduleEventType;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface ScheduleEventRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  group_id: string | null;
  discipline_id: string | null;
  instructor_id: string | null;
  classroom_id: string | null;
  start_time: Date;
  end_time: Date;
  is_all_day: boolean;
  color: ScheduleEventColor;
  event_type: ScheduleEventType;
  is_recurring: boolean;
  recurrence_rule: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  group_code?: string;
  course_name?: string;
  instructor_full_name?: string;
  classroom_name?: string;
  classroom_capacity?: number;
  discipline_name?: string;
}

interface ClassroomRow extends RowDataPacket {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToScheduleEvent(row: ScheduleEventRow): ScheduleEvent {
  const event: ScheduleEvent = {
    id: row.id,
    title: row.title,
    description: row.description,
    groupId: row.group_id,
    disciplineId: row.discipline_id,
    instructorId: row.instructor_id,
    classroomId: row.classroom_id,
    startTime: row.start_time,
    endTime: row.end_time,
    isAllDay: row.is_all_day,
    color: row.color,
    eventType: row.event_type,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.group_code) {
    event.group = {
      id: row.group_id!,
      code: row.group_code,
      courseName: row.course_name || '',
    };
  }

  if (row.instructor_full_name) {
    event.instructor = {
      id: row.instructor_id!,
      fullName: row.instructor_full_name,
    };
  }

  if (row.classroom_name) {
    event.classroom = {
      id: row.classroom_id!,
      name: row.classroom_name,
      capacity: row.classroom_capacity || 0,
    };
  }

  if (row.discipline_name) {
    event.discipline = {
      id: row.discipline_id!,
      name: row.discipline_name,
    };
  }

  return event;
}

function mapRowToClassroom(row: ClassroomRow): Classroom {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// СОБЫТИЯ РАСПИСАНИЯ
// ============================================================================

/**
 * Получить события расписания с фильтрами
 */
export async function getScheduleEvents(filters: ScheduleFilters = {}): Promise<ScheduleEvent[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  // Фильтр по диапазону дат
  if (filters.startDate && filters.endDate) {
    conditions.push('((se.start_time >= ? AND se.start_time <= ?) OR (se.end_time >= ? AND se.end_time <= ?) OR (se.start_time <= ? AND se.end_time >= ?))');
    params.push(filters.startDate, filters.endDate, filters.startDate, filters.endDate, filters.startDate, filters.endDate);
  } else if (filters.startDate) {
    conditions.push('se.end_time >= ?');
    params.push(filters.startDate);
  } else if (filters.endDate) {
    conditions.push('se.start_time <= ?');
    params.push(filters.endDate);
  }

  // Фильтр по группе
  if (filters.groupId) {
    conditions.push('se.group_id = ?');
    params.push(filters.groupId);
  }

  // Фильтр по инструктору
  if (filters.instructorId) {
    conditions.push('se.instructor_id = ?');
    params.push(filters.instructorId);
  }

  // Фильтр по аудитории
  if (filters.classroomId) {
    conditions.push('se.classroom_id = ?');
    params.push(filters.classroomId);
  }

  // Фильтр по типу события
  if (filters.eventType) {
    conditions.push('se.event_type = ?');
    params.push(filters.eventType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      se.*,
      sg.code as group_code,
      c.name as course_name,
      i.full_name as instructor_full_name,
      cr.name as classroom_name,
      cr.capacity as classroom_capacity,
      d.name as discipline_name
    FROM schedule_events se
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms cr ON se.classroom_id = cr.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    ${whereClause}
    ORDER BY se.start_time ASC
  `;

  const rows = await executeQuery<ScheduleEventRow[]>(query, params);
  return rows.map(mapRowToScheduleEvent);
}

/**
 * Получить событие по ID
 */
export async function getScheduleEventById(id: string): Promise<ScheduleEvent | null> {
  const rows = await executeQuery<ScheduleEventRow[]>(
    `SELECT 
      se.*,
      sg.code as group_code,
      c.name as course_name,
      i.full_name as instructor_full_name,
      cr.name as classroom_name,
      cr.capacity as classroom_capacity,
      d.name as discipline_name
    FROM schedule_events se
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms cr ON se.classroom_id = cr.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    WHERE se.id = ?
    LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToScheduleEvent(rows[0]);
}

/**
 * Создать событие расписания
 */
export async function createScheduleEvent(data: CreateScheduleEventInput): Promise<ScheduleEvent> {
  const id = uuidv4();

  await executeQuery(
    `INSERT INTO schedule_events (
      id, title, description, group_id, discipline_id, instructor_id, classroom_id,
      start_time, end_time, is_all_day, color, event_type, is_recurring, recurrence_rule, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || null,
      data.groupId || null,
      data.disciplineId || null,
      data.instructorId || null,
      data.classroomId || null,
      data.startTime,
      data.endTime,
      data.isAllDay || false,
      data.color || 'primary',
      data.eventType || 'theory',
      data.isRecurring || false,
      data.recurrenceRule || null,
      data.notes || null,
    ]
  );

  const event = await getScheduleEventById(id);
  if (!event) {
    throw new Error('Failed to create schedule event');
  }

  return event;
}

/**
 * Обновить событие расписания
 */
export async function updateScheduleEvent(id: string, data: UpdateScheduleEventInput): Promise<ScheduleEvent | null> {
  const existing = await getScheduleEventById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    params.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.groupId !== undefined) {
    updates.push('group_id = ?');
    params.push(data.groupId);
  }
  if (data.disciplineId !== undefined) {
    updates.push('discipline_id = ?');
    params.push(data.disciplineId);
  }
  if (data.instructorId !== undefined) {
    updates.push('instructor_id = ?');
    params.push(data.instructorId);
  }
  if (data.classroomId !== undefined) {
    updates.push('classroom_id = ?');
    params.push(data.classroomId);
  }
  if (data.startTime !== undefined) {
    updates.push('start_time = ?');
    params.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    updates.push('end_time = ?');
    params.push(data.endTime);
  }
  if (data.isAllDay !== undefined) {
    updates.push('is_all_day = ?');
    params.push(data.isAllDay);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    params.push(data.color);
  }
  if (data.eventType !== undefined) {
    updates.push('event_type = ?');
    params.push(data.eventType);
  }
  if (data.isRecurring !== undefined) {
    updates.push('is_recurring = ?');
    params.push(data.isRecurring);
  }
  if (data.recurrenceRule !== undefined) {
    updates.push('recurrence_rule = ?');
    params.push(data.recurrenceRule);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    params.push(data.notes);
  }

  if (updates.length === 0) {
    return existing;
  }

  params.push(id);
  await executeQuery(`UPDATE schedule_events SET ${updates.join(', ')} WHERE id = ?`, params);

  return getScheduleEventById(id);
}

/**
 * Удалить событие расписания
 */
export async function deleteScheduleEvent(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM schedule_events WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

/**
 * Проверка конфликтов расписания
 * Возвращает события, которые пересекаются с указанным временным интервалом
 */
export async function checkScheduleConflicts(
  startTime: string,
  endTime: string,
  options: {
    classroomId?: string;
    instructorId?: string;
    groupId?: string;
    excludeEventId?: string;
  } = {}
): Promise<ScheduleEvent[]> {
  const conditions: string[] = [
    '((se.start_time < ? AND se.end_time > ?) OR (se.start_time >= ? AND se.start_time < ?) OR (se.end_time > ? AND se.end_time <= ?))',
  ];
  const params: any[] = [endTime, startTime, startTime, endTime, startTime, endTime];

  const orConditions: string[] = [];
  
  if (options.classroomId) {
    orConditions.push('se.classroom_id = ?');
    params.push(options.classroomId);
  }
  
  if (options.instructorId) {
    orConditions.push('se.instructor_id = ?');
    params.push(options.instructorId);
  }
  
  if (options.groupId) {
    orConditions.push('se.group_id = ?');
    params.push(options.groupId);
  }

  if (orConditions.length > 0) {
    conditions.push(`(${orConditions.join(' OR ')})`);
  }

  if (options.excludeEventId) {
    conditions.push('se.id != ?');
    params.push(options.excludeEventId);
  }

  const query = `
    SELECT 
      se.*,
      sg.code as group_code,
      c.name as course_name,
      i.full_name as instructor_full_name,
      cr.name as classroom_name,
      cr.capacity as classroom_capacity,
      d.name as discipline_name
    FROM schedule_events se
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms cr ON se.classroom_id = cr.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY se.start_time ASC
  `;

  const rows = await executeQuery<ScheduleEventRow[]>(query, params);
  return rows.map(mapRowToScheduleEvent);
}

// ============================================================================
// АУДИТОРИИ
// ============================================================================

/**
 * Получить все активные аудитории
 */
export async function getClassrooms(activeOnly = true): Promise<Classroom[]> {
  let query = 'SELECT * FROM classrooms';
  const params: any[] = [];

  if (activeOnly) {
    query += ' WHERE is_active = true';
  }

  query += ' ORDER BY name ASC';

  const rows = await executeQuery<ClassroomRow[]>(query, params);
  return rows.map(mapRowToClassroom);
}

/**
 * Получить аудиторию по ID
 */
export async function getClassroomById(id: string): Promise<Classroom | null> {
  const rows = await executeQuery<ClassroomRow[]>(
    'SELECT * FROM classrooms WHERE id = ? LIMIT 1',
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToClassroom(rows[0]);
}

/**
 * Создать аудиторию
 */
export async function createClassroom(data: {
  name: string;
  capacity?: number;
  description?: string;
}): Promise<Classroom> {
  const id = uuidv4();

  await executeQuery(
    `INSERT INTO classrooms (id, name, capacity, description) VALUES (?, ?, ?, ?)`,
    [id, data.name, data.capacity || 0, data.description || null]
  );

  const classroom = await getClassroomById(id);
  if (!classroom) {
    throw new Error('Failed to create classroom');
  }

  return classroom;
}

/**
 * Обновить аудиторию
 */
export async function updateClassroom(
  id: string,
  data: { name?: string; capacity?: number; description?: string | null; isActive?: boolean }
): Promise<Classroom | null> {
  const existing = await getClassroomById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.capacity !== undefined) {
    updates.push('capacity = ?');
    params.push(data.capacity);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive);
  }

  if (updates.length === 0) {
    return existing;
  }

  params.push(id);
  await executeQuery(`UPDATE classrooms SET ${updates.join(', ')} WHERE id = ?`, params);

  return getClassroomById(id);
}

/**
 * Удалить аудиторию
 */
export async function deleteClassroom(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM classrooms WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}
