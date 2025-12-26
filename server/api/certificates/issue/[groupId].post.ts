/**
 * POST /api/certificates/issue/[groupId]
 * Выдать сертификат(ы) слушателям группы
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  getTemplateById,
  checkStudentEligibility,
  generateCertificateNumber,
  createIssuedCertificate,
  updateCertificateFiles,
  getStudentCertificateInGroup,
} from '../../../repositories/certificateTemplateRepository';
import { getGroupById } from '../../../repositories/groupRepository';
import { getStudentById } from '../../../repositories/studentRepository';
import {
  generateDocx,
  convertDocxToPdf,
  prepareTemplateVariables,
} from '../../../utils/certificateGenerator';
import { logActivity } from '../../../utils/activityLogger';
import type { IssueWarning } from '../../../types/certificate';

const issueSchema = z.object({
  templateId: z.string().uuid('Некорректный ID шаблона'),
  studentIds: z.array(z.string().uuid()).min(1, 'Выберите хотя бы одного студента'),
  issueDate: z.string().optional(),
  overrideWarnings: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

// Директории для файлов
const GENERATED_DIR = path.join(process.cwd(), 'storage', 'certificates', 'generated');

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, 'groupId');

    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: 'ID группы обязателен',
      });
    }

    const body = await readBody(event);
    const validated = issueSchema.parse(body);

    // Получаем группу
    const group = await getGroupById(groupId);
    if (!group) {
      throw createError({
        statusCode: 404,
        message: 'Группа не найдена',
      });
    }

    // Получаем шаблон
    const template = await getTemplateById(validated.templateId);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }

    if (!template.originalFileUrl) {
      throw createError({
        statusCode: 400,
        message: 'Файл шаблона не загружен',
      });
    }

    if (!template.variables || template.variables.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Переменные шаблона не настроены',
      });
    }

    // Создаём директорию для генерируемых файлов
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    const issueDate = validated.issueDate ? new Date(validated.issueDate) : new Date();
    const results: {
      studentId: string;
      studentName: string;
      success: boolean;
      certificateId?: string;
      certificateNumber?: string;
      warnings?: IssueWarning[];
      error?: string;
    }[] = [];

    // Получаем ID текущего пользователя
    const userId = event.context.user?.id;

    for (const studentId of validated.studentIds) {
      try {
        // Проверяем, нет ли уже сертификата
        const existing = await getStudentCertificateInGroup(studentId, groupId);
        if (existing && existing.status === 'issued') {
          results.push({
            studentId,
            studentName: existing.student?.fullName || studentId,
            success: false,
            error: 'Сертификат уже выдан',
          });
          continue;
        }

        // Получаем студента
        const student = await getStudentById(studentId);
        if (!student) {
          results.push({
            studentId,
            studentName: studentId,
            success: false,
            error: 'Студент не найден',
          });
          continue;
        }

        // Проверяем допуск
        const eligibility = await checkStudentEligibility(studentId, groupId);
        
        // Если есть предупреждения и не указан overrideWarnings
        if (!eligibility.isEligible && !validated.overrideWarnings) {
          results.push({
            studentId,
            studentName: student.fullName,
            success: false,
            warnings: eligibility.warnings,
            error: 'Требуется подтверждение выдачи',
          });
          continue;
        }

        // Генерируем номер сертификата
        const courseCode = group.course?.code || 'UNKNOWN';
        const certificateNumber = await generateCertificateNumber(
          template.id,
          courseCode
        );

        // Подготавливаем данные для подстановки
        const context = {
          student: {
            id: student.id,
            fullName: student.fullName,
            organization: student.organization,
            position: student.position,
            department: null,
            pinfl: student.pinfl,
          },
          course: {
            id: group.course?.id || '',
            name: group.course?.name || '',
            shortName: group.course?.shortName || '',
            code: group.course?.code || '',
            totalHours: group.course?.totalHours || 0,
          },
          group: {
            id: group.id,
            code: group.code,
            startDate: group.startDate,
            endDate: group.endDate,
            classroom: group.classroom,
          },
          certificate: {
            number: certificateNumber,
            issueDate,
          },
        };

        const variablesData = prepareTemplateVariables(template.variables, context);

        // Генерируем DOCX
        const docxFilename = `${certificateNumber.replace(/\//g, '_')}.docx`;
        const docxPath = path.join(GENERATED_DIR, docxFilename);
        const templatePath = path.join(process.cwd(), template.originalFileUrl);

        await generateDocx({
          templatePath,
          outputPath: docxPath,
          variables: variablesData,
          qrSettings: template.qrSettings || undefined,
        });

        // Конвертируем в PDF
        const pdfFilename = `${certificateNumber.replace(/\//g, '_')}.pdf`;
        const pdfPath = path.join(GENERATED_DIR, pdfFilename);

        let pdfUrl: string | null = null;
        try {
          await convertDocxToPdf(docxPath, pdfPath);
          pdfUrl = `/storage/certificates/generated/${pdfFilename}`;
        } catch (pdfError: any) {
          console.error('PDF conversion error:', pdfError);
          // Продолжаем без PDF, если конвертация не удалась
        }

        // Формируем URL-ы
        const docxUrl = `/storage/certificates/generated/${docxFilename}`;

        // Создаём запись о сертификате
        const certificate = await createIssuedCertificate({
          groupId,
          studentId,
          templateId: template.id,
          certificateNumber,
          issueDate,
          variablesData,
          warnings: eligibility.warnings.length > 0 ? eligibility.warnings : undefined,
          overrideWarnings: validated.overrideWarnings,
          issuedBy: userId,
          notes: validated.notes,
        });

        // Обновляем файлы
        await updateCertificateFiles(certificate.id, docxUrl, pdfUrl || docxUrl);

        // Логируем
        await logActivity(
          event,
          'CREATE',
          'ISSUED_CERTIFICATE',
          certificate.id,
          `${certificateNumber} — ${student.fullName}`,
          {
            groupId,
            studentId,
            certificateNumber,
            hasWarnings: eligibility.warnings.length > 0,
            overrideWarnings: validated.overrideWarnings,
          }
        );

        results.push({
          studentId,
          studentName: student.fullName,
          success: true,
          certificateId: certificate.id,
          certificateNumber,
          warnings: eligibility.warnings.length > 0 ? eligibility.warnings : undefined,
        });

      } catch (studentError: any) {
        console.error(`Error issuing certificate for student ${studentId}:`, studentError);
        results.push({
          studentId,
          studentName: studentId,
          success: false,
          error: studentError.message || 'Ошибка выдачи сертификата',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[POST /api/certificates/issue/${groupId}] Выдано: ${successCount}, ошибок: ${failCount}`);

    return {
      success: true,
      message: `Выдано ${successCount} сертификатов`,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    };
  } catch (error: any) {
    console.error('[POST /api/certificates/issue/[groupId]] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Ошибка валидации',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка выдачи сертификатов',
    });
  }
});
