/**
 * POST /api/attendance
 * Отметить посещаемость (одиночная или массовая)
 */

import { upsertAttendance, bulkUpsertAttendance } from '../../repositories/attendanceRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.auth?.userId;
    
    // Массовая отметка
    if (body.bulk && Array.isArray(body.attendances)) {
      const count = await bulkUpsertAttendance({
        scheduleEventId: body.scheduleEventId,
        maxHours: body.maxHours,
        markedBy: userId,
        attendances: body.attendances,
      });
      
      await logActivity(
        event,
        'UPDATE',
        'ATTENDANCE',
        body.scheduleEventId,
        `Массовая отметка посещаемости`,
        { count, scheduleEventId: body.scheduleEventId }
      );
      
      return {
        success: true,
        message: `Отмечено ${count} записей`,
        count,
      };
    }
    
    // Одиночная отметка
    if (!body.studentId || !body.scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать studentId и scheduleEventId',
      });
    }
    
    if (body.hoursAttended === undefined || body.maxHours === undefined) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать hoursAttended и maxHours',
      });
    }
    
    if (body.hoursAttended < 0 || body.hoursAttended > body.maxHours) {
      throw createError({
        statusCode: 400,
        message: 'hoursAttended должно быть от 0 до maxHours',
      });
    }
    
    const attendance = await upsertAttendance({
      studentId: body.studentId,
      scheduleEventId: body.scheduleEventId,
      hoursAttended: body.hoursAttended,
      maxHours: body.maxHours,
      notes: body.notes,
      markedBy: userId,
    });
    
    await logActivity(
      event,
      'UPDATE',
      'ATTENDANCE',
      attendance.id,
      `Посещаемость: ${attendance.hoursAttended}/${attendance.maxHours} а-ч`,
      { 
        studentId: body.studentId, 
        scheduleEventId: body.scheduleEventId,
        hoursAttended: body.hoursAttended,
        maxHours: body.maxHours,
      }
    );
    
    return {
      success: true,
      attendance,
    };
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при сохранении посещаемости',
    });
  }
});
