/**
 * API endpoint для получения истории изменений заявки
 * GET /api/training-requests/:id/history
 * 
 * Доступ:
 * - ADMIN/MANAGER: любая заявка
 * - REPRESENTATIVE: только свои заявки
 */

import { getRequestHistory, getRequestById } from '../../../repositories/trainingRequestRepository';
import { getRepresentativeByUserId } from '../../../repositories/representativeRepository';
import { getPermissionContext, roleHasPermission } from '../../../utils/permissions';
import { Permission } from '../../../types/permissions';

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
                message: 'Недостаточно прав для просмотра истории',
            });
        }

        // Получаем заявку для проверки доступа
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
                    message: 'Доступ к истории этой заявки запрещён',
                });
            }
        }

        // Получаем историю
        const history = await getRequestHistory(id);

        return {
            success: true,
            history,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка получения истории заявки:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при получении истории',
        });
    }
});
