/**
 * POST /api/schedule
 * Создание события расписания
 */

import { createScheduleEvent, checkScheduleConflicts } from '../../repositories/scheduleRepository';
import type { CreateScheduleEventInput } from '../../repositories/scheduleRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateScheduleEventInput>(event);

    // Валидация
    if (!body.title?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название события обязательно',
      });
    }

    if (!body.startTime || !body.endTime) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Время начала и окончания обязательны',
      });
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (endTime <= startTime) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Время окончания должно быть позже времени начала',
      });
    }

    // Проверка конфликтов
    if (body.classroomId || body.instructorId || body.groupId) {
      const conflicts = await checkScheduleConflicts(body.startTime, body.endTime, {
        classroomId: body.classroomId,
        instructorId: body.instructorId,
        groupId: body.groupId,
      });

      if (conflicts.length > 0) {
        const conflictMessages: string[] = [];
        
        for (const conflict of conflicts) {
          if (conflict.classroomId === body.classroomId && conflict.classroom) {
            conflictMessages.push(`Аудитория "${conflict.classroom.name}" занята`);
          }
          if (conflict.instructorId === body.instructorId && conflict.instructor) {
            conflictMessages.push(`Инструктор "${conflict.instructor.fullName}" занят`);
          }
          if (conflict.groupId === body.groupId && conflict.group) {
            conflictMessages.push(`Группа "${conflict.group.code}" занята`);
          }
        }

        if (conflictMessages.length > 0) {
          throw createError({
            statusCode: 409,
            statusMessage: `Конфликт расписания: ${[...new Set(conflictMessages)].join(', ')}`,
          });
        }
      }
    }

    const scheduleEvent = await createScheduleEvent(body);

    // Логирование действия
    await logActivity(
      event,
      'CREATE',
      'SCHEDULE',
      scheduleEvent.id,
      scheduleEvent.title,
      {
        startTime: scheduleEvent.startTime,
        endTime: scheduleEvent.endTime,
        groupId: body.groupId,
        instructorId: body.instructorId,
        classroomId: body.classroomId,
      }
    );

    return {
      success: true,
      event: {
        ...scheduleEvent,
        startTime: scheduleEvent.startTime.toISOString(),
        endTime: scheduleEvent.endTime.toISOString(),
        createdAt: scheduleEvent.createdAt.toISOString(),
        updatedAt: scheduleEvent.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error creating schedule event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при создании события',
    });
  }
});
