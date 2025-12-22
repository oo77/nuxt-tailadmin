/**
 * DELETE /api/schedule/[id]
 * Удаление события расписания
 */

import { deleteScheduleEvent } from '~/server/repositories/scheduleRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID события обязателен',
      });
    }

    const deleted = await deleteScheduleEvent(id);

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено',
      });
    }

    return {
      success: true,
      message: 'Событие успешно удалено',
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error deleting schedule event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при удалении события',
    });
  }
});
