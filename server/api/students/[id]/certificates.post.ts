/**
 * API endpoint для добавления сертификата студенту
 * POST /api/students/:id/certificates
 */

import { getStudentById, addCertificateToStudent } from '../../../repositories/studentRepository';
import { getFileByUuid } from '../../../repositories/fileRepository';
import { storage } from '../../../utils/storage';
import { logActivity } from '../../../utils/activityLogger';
import type { CreateCertificateInput } from '../../../types/student';

export default defineEventHandler(async (event) => {
  try {
    const studentId = getRouterParam(event, 'id');

    if (!studentId) {
      throw createError({
        statusCode: 400,
        message: 'ID студента не указан',
      });
    }

    // Проверка существования студента
    const student = await getStudentById(studentId);
    if (!student) {
      throw createError({
        statusCode: 404,
        message: 'Студент не найден',
      });
    }

    const body = await readBody<Omit<CreateCertificateInput, 'studentId'>>(event);

    // Валидация обязательных полей
    if (!body.courseName || !body.courseName.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Название курса обязательно для заполнения',
      });
    }

    if (!body.certificateNumber || !body.certificateNumber.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Номер сертификата обязателен для заполнения',
      });
    }

    if (!body.issueDate) {
      throw createError({
        statusCode: 400,
        message: 'Дата получения обязательна для заполнения',
      });
    }

    // Валидация дат
    const issueDate = new Date(body.issueDate);
    if (isNaN(issueDate.getTime())) {
      throw createError({
        statusCode: 400,
        message: 'Некорректная дата получения',
      });
    }

    if (body.expiryDate) {
      const expiryDate = new Date(body.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        throw createError({
          statusCode: 400,
          message: 'Некорректная дата срока годности',
        });
      }

      if (expiryDate <= issueDate) {
        throw createError({
          statusCode: 400,
          message: 'Срок годности должен быть позже даты получения',
        });
      }
    }

    // Обработка файла сертификата
    let fileUrl: string | null = null;

    if (body.fileUuid) {
      // Если передан UUID загруженного файла
      const fileRecord = await getFileByUuid(body.fileUuid);
      
      if (!fileRecord) {
        throw createError({
          statusCode: 404,
          message: 'Загруженный файл не найден',
        });
      }

      // Получаем публичный URL файла
      fileUrl = storage.getPublicUrl(fileRecord.uuid);
    } else if (body.fileUrl) {
      // Если передан URL
      fileUrl = body.fileUrl.trim();
    }

    // Создание сертификата
    const certificate = await addCertificateToStudent(studentId, {
      courseName: body.courseName.trim(),
      certificateNumber: body.certificateNumber.trim(),
      issueDate,
      fileUrl,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    });

    if (!certificate) {
      throw createError({
        statusCode: 500,
        message: 'Ошибка при создании сертификата',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'CERTIFICATE',
      certificate.id,
      body.courseName.trim(),
      {
        certificateNumber: body.certificateNumber.trim(),
        studentId,
        studentName: student.fullName,
      }
    );

    return {
      success: true,
      certificate,
    };
  } catch (error: any) {
    console.error('Ошибка создания сертификата:', error);
    
    // Если это уже createError, пробрасываем его
    if (error.statusCode) {
      throw error;
    }

    // Иначе возвращаем общую ошибку
    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при создании сертификата',
    });
  }
});
