/**
 * API endpoint для получения курса по ID
 * GET /api/courses/:id
 */

import { getCourseById } from '../../repositories/courseRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID курса не указан',
      };
    }

    const course = await getCourseById(id, true);

    if (!course) {
      return {
        success: false,
        message: 'Курс не найден',
      };
    }

    return {
      success: true,
      course,
    };
  } catch (error) {
    console.error('Ошибка получения курса:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении курса',
    };
  }
});
