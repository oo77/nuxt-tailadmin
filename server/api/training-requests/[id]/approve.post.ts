/**
 * API endpoint для одобрения заявки (финальное)
 * POST /api/training-requests/:id/approve
 * 
 * Доступ: ADMIN/MANAGER
 * Требуется: статус reserved + загруженный PDF
 * 
 * Body:
 * {
 *   adminNotes?: string
 * }
 */

import { approveRequest, getRequestById } from '../../../repositories/trainingRequestRepository';
import { getPermissionContext, roleHasPermission } from '../../../utils/permissions';
import { Permission } from '../../../types/permissions';
import { logActivity } from '../../../utils/activityLogger';

interface ApproveBody {
    adminNotes?: string;
}

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

        // Проверяем разрешение на одобрение заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_APPROVE)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для одобрения заявок',
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

        // Проверяем статус
        if (existingRequest.status !== 'reserved') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: `Нельзя одобрить заявку со статусом "${existingRequest.status}". Требуется статус "reserved"`,
            });
        }

        // Проверяем наличие PDF
        if (!existingRequest.pdfFileId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'PDF-файл заявки не загружен',
            });
        }

        // Парсим тело запроса
        const body = await readBody<ApproveBody>(event);

        // Одобряем заявку
        const request = await approveRequest(id, context.userId, body?.adminNotes);

        if (!request) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Internal Server Error',
                message: 'Ошибка при одобрении заявки',
            });
        }

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'TRAINING_REQUEST',
            id,
            { status: 'reserved' },
            {
                status: 'approved',
                groupId: request.groupId,
                employeesCount: request.employeesCount,
                adminNotes: body?.adminNotes,
            }
        );

        // TODO: Уведомить представителя об одобрении

        return {
            success: true,
            message: 'Заявка одобрена. Сотрудники зачислены в группу.',
            request,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка одобрения заявки:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Ошибка при одобрении заявки',
        });
    }
});
