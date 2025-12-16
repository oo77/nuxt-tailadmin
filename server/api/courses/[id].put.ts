/**
 * API endpoint для обновления курса
 * PUT /api/courses/:id
 */

import { updateCourse, courseCodeExists, type UpdateCourseInput } from '../../repositories/courseRepository';
import { z } from 'zod';

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().min(2).max(10).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  certificateTemplateId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID курса не указан',
      };
    }

    const body = await readBody(event);

    // Валидация
    const validationResult = updateCourseSchema.safeParse(body);
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

    // Проверяем уникальность кода если он изменяется
    if (data.code) {
      const codeExists = await courseCodeExists(data.code, id);
      if (codeExists) {
        return {
          success: false,
          message: 'Курс с таким кодом уже существует',
          field: 'code',
        };
      }
    }

    // Обновляем курс
    const course = await updateCourse(id, data as UpdateCourseInput);

    if (!course) {
      return {
        success: false,
        message: 'Курс не найден',
      };
    }

    return {
      success: true,
      message: 'Курс успешно обновлён',
      course,
    };
  } catch (error) {
    console.error('Ошибка обновления курса:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при обновлении курса',
    };
  }
});
