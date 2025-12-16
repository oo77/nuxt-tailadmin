/**
 * API endpoint для удаления инструктора
 * DELETE /api/instructors/:id
 */

import { deleteInstructor } from '../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID инструктора не указан',
      };
    }

    const deleted = await deleteInstructor(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Инструктор не найден',
      };
    }

    return {
      success: true,
      message: 'Инструктор успешно удалён',
    };
  } catch (error) {
    console.error('Ошибка удаления инструктора:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении инструктора',
    };
  }
});
