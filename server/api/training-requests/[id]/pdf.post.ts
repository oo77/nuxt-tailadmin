/**
 * API endpoint для загрузки PDF файла к заявке
 * POST /api/training-requests/:id/pdf
 * 
 * Доступ: REPRESENTATIVE (владелец заявки)
 * 
 * Требуется: статус reserved
 * 
 * Body: multipart/form-data с файлом
 */

import { attachPdfToRequest, getRequestById } from '../../../repositories/trainingRequestRepository';
import { getRepresentativeByUserId } from '../../../repositories/representativeRepository';
import { createFile } from '../../../repositories/fileRepository';
import { storage, validateFile } from '../../../utils/storage';
import { getPermissionContext, roleHasPermission } from '../../../utils/permissions';
import { Permission } from '../../../types/permissions';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'ID заявки не указан',
            });
        }

        // Получаем контекст разрешений
        const context = await getPermissionContext(event);

        if (!context) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message: 'Требуется авторизация',
            });
        }

        // Проверяем разрешение на создание/обновление заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_CREATE)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для загрузки файлов',
            });
        }

        // Получаем представителя
        const representative = await getRepresentativeByUserId(context.userId);

        if (!representative) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Профиль представителя не найден',
            });
        }

        // Проверяем существование заявки
        const existingRequest = await getRequestById(id);

        if (!existingRequest) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: 'Заявка не найдена',
            });
        }

        // Проверяем владельца заявки
        if (existingRequest.representativeId !== representative.id) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Можно загрузить PDF только к своей заявке',
            });
        }

        // Проверяем статус (PDF можно загружать для reserved заявок)
        if (existingRequest.status !== 'reserved') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: `Загрузка PDF доступна только для заявок со статусом "reserved". Текущий статус: "${existingRequest.status}"`,
            });
        }

        // Читаем multipart данные
        const formData = await readMultipartFormData(event);

        if (!formData || formData.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Файл не загружен',
            });
        }

        const fileData = formData.find(f => f.name === 'file');

        if (!fileData || !fileData.data) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Файл не найден в запросе',
            });
        }

        // Проверяем тип файла
        const contentType = fileData.type || '';
        if (!contentType.includes('pdf')) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Допускаются только PDF файлы',
            });
        }

        const filename = fileData.filename || `request-${id}.pdf`;
        const mimeType = 'application/pdf';

        // Валидация файла
        try {
            validateFile(
                { size: fileData.data.length, mimeType },
                20 * 1024 * 1024 // 20MB максимум для PDF
            );
        } catch (validationError) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: validationError instanceof Error ? validationError.message : 'Ошибка валидации файла',
            });
        }

        // Сохраняем файл через storage
        const savedFile = await storage.save(
            {
                filename,
                data: fileData.data,
                mimeType,
                size: fileData.data.length,
            },
            'training_requests',
            id // relatedId - ID заявки
        );

        // Сохраняем метаданные в БД
        const fileRecord = await createFile({
            uuid: savedFile.uuid,
            filename: savedFile.filename,
            storedName: savedFile.storedName,
            mimeType: savedFile.mimeType,
            sizeBytes: savedFile.sizeBytes,
            extension: savedFile.extension,
            storagePath: savedFile.storagePath,
            fullPath: savedFile.fullPath,
            category: 'training_requests',
            uploadedBy: parseInt(context.userId) || 0,
        });

        // Привязываем файл к заявке
        await attachPdfToRequest(id, fileRecord.id, representative.id);

        // Логируем действие
        await logActivity(
            event,
            'UPLOAD',
            'TRAINING_REQUEST',
            id,
            undefined,
            {
                fileId: fileRecord.id,
                fileName: fileRecord.filename,
            }
        );

        return {
            success: true,
            message: 'PDF файл успешно загружен',
            file: {
                id: fileRecord.id,
                uuid: fileRecord.uuid,
                filename: fileRecord.filename,
                url: storage.getPublicUrl(fileRecord.uuid),
            },
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка загрузки PDF:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Ошибка при загрузке файла',
        });
    }
});
