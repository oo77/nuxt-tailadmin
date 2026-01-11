/**
 * API endpoint для отзыва заявки представителем
 * POST /api/training-requests/:id/withdraw
 * 
 * Доступ: REPRESENTATIVE (владелец заявки)
 */

import { withdrawRequest, getRequestById } from '../../../repositories/trainingRequestRepository';
import { getRepresentativeByUserId } from '../../../repositories/representativeRepository';
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

        // Проверяем разрешение на отзыв заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_WITHDRAW)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для отзыва заявок',
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
                message: 'Можно отозвать только свои заявки',
            });
        }

        const oldStatus = existingRequest.status;

        // Отзываем заявку
        const request = await withdrawRequest(id);

        if (!request) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Internal Server Error',
                message: 'Ошибка при отзыве заявки',
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
                status: 'withdrawn',
                groupId: request.groupId,
            }
        );

        return {
            success: true,
            message: 'Заявка отозвана',
            request,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка отзыва заявки:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: error.message || 'Ошибка при отзыве заявки',
        });
    }
});
