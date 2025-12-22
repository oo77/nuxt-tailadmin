/**
 * API endpoint для создания нового студента
 * POST /api/students
 */

import { createStudent, studentExistsByPinfl } from '../../repositories/studentRepository';
import { logActivity } from '../../utils/activityLogger';
import type { CreateStudentInput } from '../../types/student';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateStudentInput>(event);

    // Валидация обязательных полей
    if (!body.fullName || !body.fullName.trim()) {
      return {
        success: false,
        message: 'Ф.И.О обязательно для заполнения',
      };
    }

    if (!body.pinfl || !body.pinfl.trim()) {
      return {
        success: false,
        message: 'ПИНФЛ обязателен для заполнения',
      };
    }

    // Валидация ПИНФЛ (должен быть 14 цифр)
    if (!/^\d{14}$/.test(body.pinfl)) {
      return {
        success: false,
        message: 'ПИНФЛ должен содержать ровно 14 цифр',
      };
    }

    // Проверка уникальности ПИНФЛ
    const exists = await studentExistsByPinfl(body.pinfl);
    if (exists) {
      return {
        success: false,
        message: 'Студент с таким ПИНФЛ уже существует',
      };
    }

    if (!body.organization || !body.organization.trim()) {
      return {
        success: false,
        message: 'Организация обязательна для заполнения',
      };
    }

    if (!body.position || !body.position.trim()) {
      return {
        success: false,
        message: 'Должность обязательна для заполнения',
      };
    }

    // Создание студента
    const student = await createStudent({
      fullName: body.fullName.trim(),
      pinfl: body.pinfl.trim(),
      organization: body.organization.trim(),
      department: body.department?.trim() || undefined,
      position: body.position.trim(),
    });

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'STUDENT',
      student.id,
      student.fullName,
      { pinfl: student.pinfl, organization: student.organization }
    );

    return {
      success: true,
      student,
    };
  } catch (error) {
    console.error('Ошибка создания студента:', error);
    
    return {
      success: false,
      message: 'Ошибка при создании студента',
    };
  }
});
