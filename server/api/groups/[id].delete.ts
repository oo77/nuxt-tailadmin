/**
 * API endpoint для удаления учебной группы
 * DELETE /api/groups/[id]
 */

import { deleteGroup, getGroupById } from '../../repositories/groupRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    // Проверяем существование
    const group = await getGroupById(id);
    if (!group) {
      return {
        success: false,
        message: 'Группа не найдена',
      };
    }

    // Удаляем группу (каскадно удалятся и связи со слушателями)
    const deleted = await deleteGroup(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Не удалось удалить группу',
      };
    }

    return {
      success: true,
      message: 'Группа успешно удалена',
    };
  } catch (error) {
    console.error('Ошибка удаления группы:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении группы',
    };
  }
});
