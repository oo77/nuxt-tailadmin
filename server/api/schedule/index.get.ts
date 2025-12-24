/**
 * GET /api/schedule
 * Получение событий расписания
 */

import { getScheduleEvents } from '../../repositories/scheduleRepository';
import type { ScheduleEventType } from '../../repositories/scheduleRepository';
import { dateToLocalIso } from '../../utils/timeUtils';


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

    console.log('[Schedule API] Фильтры запроса:', JSON.stringify(filters));

    const events = await getScheduleEvents(filters);
    
    console.log(`[Schedule API] Найдено событий: ${events.length}`);

    // Логируем первое событие для отладки
    if (events.length > 0) {
      console.log('[Schedule API] Пример события из БД:', JSON.stringify({
        id: events[0].id,
        title: events[0].title,
        eventType: events[0].eventType,
        color: events[0].color,
      }));
    }

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
