/**
 * API endpoint для добавления сертификата студенту
 * POST /api/students/:id/certificates
 */

import { addCertificateToStudent, getStudentById } from '../../../utils/studentStorage';
import type { CreateCertificateInput } from '../../../types/student';

export default defineEventHandler(async (event) => {
  try {
    const studentId = getRouterParam(event, 'id');

    if (!studentId) {
      return {
        success: false,
        message: 'ID студента не указан',
      };
    }

    // Проверка существования студента
    const student = getStudentById(studentId);
    if (!student) {
      return {
        success: false,
        message: 'Студент не найден',
      };
    }

    const body = await readBody<Omit<CreateCertificateInput, 'studentId'>>(event);

    // Валидация обязательных полей
    if (!body.courseName || !body.courseName.trim()) {
      return {
        success: false,
        message: 'Название курса обязательно для заполнения',
      };
    }

    if (!body.certificateNumber || !body.certificateNumber.trim()) {
      return {
        success: false,
        message: 'Номер сертификата обязателен для заполнения',
      };
    }

    if (!body.issueDate) {
      return {
        success: false,
        message: 'Дата получения обязательна для заполнения',
      };
    }

    // Валидация дат
    const issueDate = new Date(body.issueDate);
    if (isNaN(issueDate.getTime())) {
      return {
        success: false,
        message: 'Некорректная дата получения',
      };
    }

    if (body.expiryDate) {
      const expiryDate = new Date(body.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        return {
          success: false,
          message: 'Некорректная дата срока годности',
        };
      }

      if (expiryDate <= issueDate) {
        return {
          success: false,
          message: 'Срок годности должен быть позже даты получения',
        };
      }
    }

    // Создание сертификата
    const certificate = addCertificateToStudent(studentId, {
      courseName: body.courseName.trim(),
      certificateNumber: body.certificateNumber.trim(),
      issueDate,
      fileUrl: body.fileUrl?.trim() || null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    });

    if (!certificate) {
      return {
        success: false,
        message: 'Ошибка при создании сертификата',
      };
    }

    return {
      success: true,
      certificate,
    };
  } catch (error) {
    console.error('Ошибка создания сертификата:', error);
    
    return {
      success: false,
      message: 'Ошибка при создании сертификата',
    };
  }
});
