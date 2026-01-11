/**
 * API endpoint для бронирования мест по заявке
 * POST /api/training-requests/:id/reserve
 * 
 * Доступ: ADMIN/MANAGER
 * 
 * Body:
 * {
 *   expiresInDays?: number  // По умолчанию 3 дня
 * }
 */

import { reserveRequest, getRequestById } from '../../../repositories/trainingRequestRepository';
import { getPermissionContext, roleHasPermission } from '../../../utils/permissions';
import { Permission } from '../../../types/permissions';
import { logActivity } from '../../../utils/activityLogger';

interface ReserveBody {
    expiresInDays?: number;
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
                message: 'Недостаточно прав для бронирования заявок',
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
        const body = await readBody<ReserveBody>(event);
        const expiresInDays = body?.expiresInDays || 3;

        // Бронируем заявку
        const request = await reserveRequest(id, context.userId, expiresInDays);

        if (!request) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Internal Server Error',
                message: 'Ошибка при бронировании заявки',
            });
        }

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'TRAINING_REQUEST',
            id,
            { status: 'pending' },
            {
                status: 'reserved',
                expiresInDays,
                groupId: request.groupId,
                employeesCount: request.employeesCount,
            }
        );

        // TODO: Уведомить представителя о бронировании

        return {
            success: true,
            message: `Места забронированы на ${expiresInDays} дней. Ожидается загрузка PDF.`,
            request,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка бронирования заявки:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Ошибка при бронировании заявки',
        });
    }
});
