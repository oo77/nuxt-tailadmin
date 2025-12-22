/**
 * PUT /api/schedule/[id]
 * Обновление события расписания
 */

import { updateScheduleEvent, checkScheduleConflicts, getScheduleEventById } from '../../repositories/scheduleRepository';
import type { UpdateScheduleEventInput } from '../../repositories/scheduleRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID события обязателен',
      });
    }

    const existing = await getScheduleEventById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено',
      });
    }

    const body = await readBody<UpdateScheduleEventInput>(event);

    // Валидация времени
    const startTime = body.startTime ? new Date(body.startTime) : existing.startTime;
    const endTime = body.endTime ? new Date(body.endTime) : existing.endTime;

    if (endTime <= startTime) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Время окончания должно быть позже времени начала',
      });
    }

    // Проверка конфликтов если изменяется время или ресурсы
    const checkClassroom = body.classroomId !== undefined ? body.classroomId : existing.classroomId;
    const checkInstructor = body.instructorId !== undefined ? body.instructorId : existing.instructorId;
    const checkGroup = body.groupId !== undefined ? body.groupId : existing.groupId;

    if (checkClassroom || checkInstructor || checkGroup) {
      const conflicts = await checkScheduleConflicts(
        startTime.toISOString(),
        endTime.toISOString(),
        {
          classroomId: checkClassroom || undefined,
          instructorId: checkInstructor || undefined,
          groupId: checkGroup || undefined,
          excludeEventId: id,
        }
      );

      if (conflicts.length > 0) {
        const conflictMessages: string[] = [];
        
        for (const conflict of conflicts) {
          if (conflict.classroomId === checkClassroom && conflict.classroom) {
            conflictMessages.push(`Аудитория "${conflict.classroom.name}" занята`);
          }
          if (conflict.instructorId === checkInstructor && conflict.instructor) {
            conflictMessages.push(`Инструктор "${conflict.instructor.fullName}" занят`);
          }
          if (conflict.groupId === checkGroup && conflict.group) {
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

    const scheduleEvent = await updateScheduleEvent(id, body);

    if (!scheduleEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено',
      });
    }

    // Логирование действия
    await logActivity(
      event,
      'UPDATE',
      'SCHEDULE',
      scheduleEvent.id,
      scheduleEvent.title,
      {
        changes: body,
        previousTitle: existing.title,
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
    console.error('Error updating schedule event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при обновлении события',
    });
  }
});
