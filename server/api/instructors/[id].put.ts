/**
 * API endpoint для обновления инструктора
 * PUT /api/instructors/:id
 */

import { updateInstructor, instructorEmailExists, type UpdateInstructorInput } from '../../repositories/instructorRepository';
import { z } from 'zod';

const updateInstructorSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email('Некорректный email').nullable().optional(),
  phone: z.string().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  contractInfo: z.string().nullable().optional(),
  maxHours: z.number().min(0, 'Часы не могут быть отрицательными').optional(),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID инструктора не указан',
      };
    }

    const body = await readBody(event);

    // Валидация
    const validationResult = updateInstructorSchema.safeParse(body);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Ошибка валидации данных',
        errors: validationResult.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    const data = validationResult.data;

    // Проверяем уникальность email если он изменяется
    if (data.email && data.email !== '') {
      const emailExists = await instructorEmailExists(data.email, id);
      if (emailExists) {
        return {
          success: false,
          message: 'Инструктор с таким email уже существует',
          field: 'email',
        };
      }
    }

    // Обновляем инструктора
    const instructor = await updateInstructor(id, data as UpdateInstructorInput);

    if (!instructor) {
      return {
        success: false,
        message: 'Инструктор не найден',
      };
    }

    return {
      success: true,
      message: 'Инструктор успешно обновлён',
      instructor,
    };
  } catch (error) {
    console.error('Ошибка обновления инструктора:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при обновлении инструктора',
    };
  }
});
