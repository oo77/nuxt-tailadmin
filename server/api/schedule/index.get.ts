/**
 * GET /api/schedule
 * Получение событий расписания
 */

import { getScheduleEvents } from '../../repositories/scheduleRepository';
import type { ScheduleEventType } from '../../repositories/scheduleRepository';

/**
 * Конвертирует MySQL DATETIME (как Date объект) обратно в ISO строку
 * без конвертации часового пояса.
 * MySQL хранит "2025-12-23 10:00:00", драйвер создаёт Date с локальным временем,
 * но toISOString() конвертирует в UTC. Нам нужно сохранить время "как есть".
 */
function dateToLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    
    const filters = {
      startDate: query.startDate as string | undefined,
      endDate: query.endDate as string | undefined,
      groupId: query.groupId as string | undefined,
      instructorId: query.instructorId as string | undefined,
      classroomId: query.classroomId as string | undefined,
      eventType: query.eventType as ScheduleEventType | undefined,
    };

    const events = await getScheduleEvents(filters);

    return {
      success: true,
      events: events.map((e) => ({
        ...e,
        // Используем dateToLocalIso для сохранения времени "как есть"
        startTime: dateToLocalIso(e.startTime),
        endTime: dateToLocalIso(e.endTime),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching schedule events:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении расписания',
    });
  }
});
