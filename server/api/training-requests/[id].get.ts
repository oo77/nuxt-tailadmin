/**
 * API endpoint для получения детальной информации о заявке
 * GET /api/training-requests/:id
 * 
 * Доступ:
 * - ADMIN/MANAGER: любая заявка
 * - REPRESENTATIVE: только свои заявки
 */

import { getRequestById } from '../../repositories/trainingRequestRepository';
import { getRepresentativeByUserId } from '../../repositories/representativeRepository';
import { getPermissionContext, roleHasPermission } from '../../utils/permissions';
import { Permission } from '../../types/permissions';
import { logActivity } from '../../utils/activityLogger';

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

        // Проверяем разрешения
        const canViewAll = roleHasPermission(context.role, Permission.REQUESTS_VIEW);
        const canViewOwn = roleHasPermission(context.role, Permission.REQUESTS_VIEW_OWN);

        if (!canViewAll && !canViewOwn) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для просмотра заявок',
            });
        }

        // Получаем заявку
        const request = await getRequestById(id);

        if (!request) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: 'Заявка не найдена',
            });
        }

        // Если пользователь может видеть только свои заявки - проверяем владельца
        if (canViewOwn && !canViewAll) {
            const representative = await getRepresentativeByUserId(context.userId);

            if (!representative || representative.id !== request.representativeId) {
                throw createError({
                    statusCode: 403,
                    statusMessage: 'Forbidden',
                    message: 'Доступ к этой заявке запрещён',
                });
            }
        }

        // Логируем действие
        await logActivity(
            event,
            'VIEW',
            'TRAINING_REQUEST',
            id,
            undefined,
            { status: request.status }
        );

        return {
            success: true,
            request,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка получения заявки:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при получении заявки',
        });
    }
});
