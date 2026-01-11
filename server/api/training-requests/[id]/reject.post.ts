/**
 * API endpoint для отклонения заявки
 * POST /api/training-requests/:id/reject
 * 
 * Доступ: ADMIN/MANAGER
 * 
 * Body:
 * {
 *   reason: string  // Обязательно
 * }
 */

import { rejectRequest, getRequestById } from '../../../repositories/trainingRequestRepository';
import { getPermissionContext, roleHasPermission } from '../../../utils/permissions';
import { Permission } from '../../../types/permissions';
import { logActivity } from '../../../utils/activityLogger';

interface RejectBody {
    reason: string;
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

        // Проверяем разрешение на отклонение заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_REJECT)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для отклонения заявок',
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

        // Парсим тело запроса
        const body = await readBody<RejectBody>(event);

        if (!body?.reason || body.reason.trim().length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Укажите причину отклонения',
            });
        }

        const oldStatus = existingRequest.status;

        // Отклоняем заявку
        const request = await rejectRequest(id, context.userId, body.reason.trim());

        if (!request) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Internal Server Error',
                message: 'Ошибка при отклонении заявки',
            });
        }

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'TRAINING_REQUEST',
            id,
            { status: oldStatus },
            {
                status: 'rejected',
                reason: body.reason,
                groupId: request.groupId,
            }
        );

        // TODO: Уведомить представителя об отклонении

        return {
            success: true,
            message: 'Заявка отклонена',
            request,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка отклонения заявки:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Ошибка при отклонении заявки',
        });
    }
});
