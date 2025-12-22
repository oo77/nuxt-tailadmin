/**
 * API endpoint для добавления слушателей в группу
 * POST /api/groups/[id]/students
 */

import { z } from 'zod';
import { 
  getGroupById,
  addStudentsToGroup,
  checkStudentConflicts 
} from '../../../../repositories/groupRepository';

const addStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Выберите хотя бы одного слушателя'),
});

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, 'id');
    
    if (!groupId) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    const body = await readBody(event);
    
    // Валидация данных
    const validationResult = addStudentsSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      
      return {
        success: false,
        message: 'Ошибка валидации данных',
        errors,
      };
    }

    const { studentIds } = validationResult.data;

    // Получаем группу для проверки дат
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        success: false,
        message: 'Группа не найдена',
      };
    }

    // Проверяем конфликты дат
    const startDate = group.startDate instanceof Date 
      ? group.startDate.toISOString().split('T')[0]
      : group.startDate.toString().split('T')[0];
    const endDate = group.endDate instanceof Date 
      ? group.endDate.toISOString().split('T')[0]
      : group.endDate.toString().split('T')[0];

    const conflicts = await checkStudentConflicts(
      studentIds,
      startDate,
      endDate,
      groupId // исключаем текущую группу
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        message: 'Некоторые слушатели уже находятся в группах с пересекающимися датами',
        conflicts,
      };
    }

    // Добавляем слушателей
    const result = await addStudentsToGroup(groupId, studentIds);

    return {
      success: true,
      message: `Добавлено слушателей: ${result.added.length}`,
      added: result.added,
      alreadyInGroup: result.alreadyInGroup,
    };
  } catch (error) {
    console.error('Ошибка добавления слушателей:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при добавлении слушателей',
    };
  }
});
