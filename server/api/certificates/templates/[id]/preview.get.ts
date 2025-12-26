/**
 * GET /api/certificates/templates/[id]/preview
 * Получить предпросмотр шаблона (первую страницу)
 */

import * as fs from 'fs';
import * as path from 'path';
import { getTemplateById } from '../../../../repositories/certificateTemplateRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID шаблона обязателен',
      });
    }

    const template = await getTemplateById(id);

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }

    if (!template.originalFileUrl) {
      throw createError({
        statusCode: 404,
        message: 'Файл шаблона не загружен',
      });
    }

    // Формируем путь к файлу
    const filePath = path.join(process.cwd(), template.originalFileUrl);

    if (!fs.existsSync(filePath)) {
      throw createError({
        statusCode: 404,
        message: 'Файл шаблона не найден на диске',
      });
    }

    // Для предпросмотра возвращаем информацию о файле
    const stats = fs.statSync(filePath);

    return {
      success: true,
      preview: {
        fileUrl: template.originalFileUrl,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        variables: template.variables || [],
        qrSettings: template.qrSettings,
      },
    };
  } catch (error: any) {
    console.error('[GET /api/certificates/templates/[id]/preview] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка получения предпросмотра',
    });
  }
});
