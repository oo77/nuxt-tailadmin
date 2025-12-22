/**
 * GET /api/schedule
 * Получение событий расписания
 */

import { getScheduleEvents } from '../../repositories/scheduleRepository';
import type { ScheduleEventType } from '../../repositories/scheduleRepository';

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
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
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
