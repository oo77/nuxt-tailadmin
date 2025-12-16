/**
 * API endpoint для удаления студента
 * DELETE /api/students/:id
 */

import { deleteStudent } from '../../repositories/studentRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID студента не указан',
      };
    }

    const deleted = await deleteStudent(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Студент не найден',
      };
    }

    return {
      success: true,
      message: 'Студент успешно удален',
    };
  } catch (error) {
    console.error('Ошибка удаления студента:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении студента',
    };
  }
});
