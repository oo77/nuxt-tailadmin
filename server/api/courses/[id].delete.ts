/**
 * API endpoint для удаления курса
 * DELETE /api/courses/:id
 */

import { deleteCourse } from '../../repositories/courseRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID курса не указан',
      };
    }

    const deleted = await deleteCourse(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Курс не найден',
      };
    }

    return {
      success: true,
      message: 'Курс успешно удалён',
    };
  } catch (error) {
    console.error('Ошибка удаления курса:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении курса',
    };
  }
});
