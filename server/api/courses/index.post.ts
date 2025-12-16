/**
 * API endpoint для создания нового курса
 * POST /api/courses
 */

import { createCourse, courseCodeExists, type CreateCourseInput } from '../../repositories/courseRepository';
import { z } from 'zod';

// Схема валидации для дисциплины
const disciplineSchema = z.object({
  name: z.string().min(1, 'Название дисциплины обязательно'),
  description: z.string().optional(),
  hours: z.number().min(1, 'Количество часов должно быть больше 0'),
  orderIndex: z.number().optional(),
  instructorIds: z.array(z.string()).optional(),
});

// Схема валидации для курса
const courseSchema = z.object({
  name: z.string().min(1, 'Название курса обязательно'),
  shortName: z.string().min(2).max(10, 'Короткое название должно быть от 2 до 10 символов'),
  code: z.string().min(1, 'Код курса обязателен'),
  description: z.string().optional(),
  certificateTemplateId: z.string().optional(),
  isActive: z.boolean().optional(),
  disciplines: z.array(disciplineSchema).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Валидация
    const validationResult = courseSchema.safeParse(body);
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

    // Проверяем уникальность кода курса
    const codeExists = await courseCodeExists(data.code);
    if (codeExists) {
      return {
        success: false,
        message: 'Курс с таким кодом уже существует',
        field: 'code',
      };
    }

    // Создаём курс
    const course = await createCourse(data as CreateCourseInput);

    return {
      success: true,
      message: 'Курс успешно создан',
      course,
    };
  } catch (error) {
    console.error('Ошибка создания курса:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при создании курса',
    };
  }
});
