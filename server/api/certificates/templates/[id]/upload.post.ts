/**
 * POST /api/certificates/templates/[id]/upload
 * Загрузить DOCX-файл шаблона и извлечь переменные
 */

import { readMultipartFormData } from 'h3';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  getTemplateById, 
  updateTemplateFiles 
} from '../../../../repositories/certificateTemplateRepository';
import { parseDocxTemplate, getAvailableVariableSources } from '../../../../utils/certificateGenerator';
import { logActivity } from '../../../../utils/activityLogger';

// Директория для хранения шаблонов
const TEMPLATES_DIR = path.join(process.cwd(), 'storage', 'certificates', 'templates');

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  console.log('[UPLOAD] Starting file upload handler...');
  
  try {
    const id = getRouterParam(event, 'id');
    console.log('[UPLOAD] Template ID:', id);

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID шаблона обязателен',
      });
    }

    // Проверяем существование шаблона
    console.log('[UPLOAD] Checking template exists...');
    const template = await getTemplateById(id);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }
    console.log('[UPLOAD] Template found:', template.name);

    // Читаем multipart данные с обработкой ошибок
    console.log('[UPLOAD] Reading multipart form data...');
    let formData;
    try {
      formData = await readMultipartFormData(event);
    } catch (multipartError: any) {
      console.error('[UPLOAD] Error reading multipart data:', multipartError);
      throw createError({
        statusCode: 400,
        message: `Ошибка чтения данных формы: ${multipartError.message || 'Неизвестная ошибка'}`,
      });
    }

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Файл не предоставлен',
      });
    }
    console.log(`[UPLOAD] Form data received in ${Date.now() - startTime}ms, fields:`, formData.length);

    const fileField = formData.find(f => f.name === 'file');
    if (!fileField || !fileField.data) {
      throw createError({
        statusCode: 400,
        message: 'Поле file обязательно',
      });
    }

    // Проверяем тип файла
    const filename = fileField.filename || 'template.docx';
    const ext = path.extname(filename).toLowerCase();
    console.log('[UPLOAD] File received:', filename, 'size:', fileField.data.length);

    if (ext !== '.docx') {
      throw createError({
        statusCode: 400,
        message: 'Поддерживаются только файлы .docx',
      });
    }

    // Создаём директорию, если не существует
    if (!fs.existsSync(TEMPLATES_DIR)) {
      console.log('[UPLOAD] Creating templates directory:', TEMPLATES_DIR);
      fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const storedFilename = `${id}_${uuidv4()}${ext}`;
    const filePath = path.join(TEMPLATES_DIR, storedFilename);
    console.log('[UPLOAD] Saving file to:', filePath);

    // Сохраняем файл
    fs.writeFileSync(filePath, fileField.data);
    console.log('[UPLOAD] File saved successfully');

    // Парсим документ для извлечения переменных
    console.log('[UPLOAD] Parsing DOCX template...');
    let parsed;
    try {
      parsed = await parseDocxTemplate(filePath);
      console.log('[UPLOAD] Parsed successfully, variables found:', parsed.variables.length);
    } catch (parseError: any) {
      console.error('[UPLOAD] Parse error:', parseError);
      // Удаляем файл если парсинг не удался
      try { fs.unlinkSync(filePath); } catch {}
      throw createError({
        statusCode: 400,
        message: `Ошибка парсинга документа: ${parseError.message}`,
      });
    }

    // Формируем относительный URL
    const relativeUrl = `/storage/certificates/templates/${storedFilename}`;
    console.log('[UPLOAD] Updating template in database...');

    // Обновляем шаблон
    await updateTemplateFiles(id, relativeUrl);

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'CERTIFICATE_TEMPLATE',
      id,
      template.name,
      { 
        action: 'upload_file',
        filename,
        variablesFound: parsed.variables.length,
      }
    );

    console.log(`[UPLOAD] Complete! Template ${id} updated, found ${parsed.variables.length} variables. Total time: ${Date.now() - startTime}ms`);

    return {
      success: true,
      message: 'Файл успешно загружен',
      variables: parsed.variables,
      availableSources: getAvailableVariableSources(),
      fileUrl: relativeUrl,
    };
  } catch (error: any) {
    console.error('[UPLOAD] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка загрузки файла',
    });
  }
});
