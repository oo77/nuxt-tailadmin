/**
 * API endpoint для создания нового инструктора
 * POST /api/instructors
 */

import { createInstructor, instructorEmailExists, type CreateInstructorInput } from '../../repositories/instructorRepository';
import { z } from 'zod';

const instructorSchema = z.object({
  fullName: z.string().min(1, 'ФИО обязательно'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url('Некорректный URL фото').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Валидация
    const validationResult = instructorSchema.safeParse(body);
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

    // Проверяем уникальность email если указан
    if (data.email && data.email !== '') {
      const emailExists = await instructorEmailExists(data.email);
      if (emailExists) {
        return {
          success: false,
          message: 'Инструктор с таким email уже существует',
          field: 'email',
        };
      }
    }

    // Создаём инструктора
    const instructor = await createInstructor(data as CreateInstructorInput);

    return {
      success: true,
      message: 'Инструктор успешно создан',
      instructor,
    };
  } catch (error) {
    console.error('Ошибка создания инструктора:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при создании инструктора',
    };
  }
});
