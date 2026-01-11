/**
 * API endpoint для получения статистики заявок
 * GET /api/training-requests/stats
 * 
 * Доступ: ADMIN/MANAGER
 */

import { getRequestsStats } from '../../repositories/trainingRequestRepository';
import { getPermissionContext, roleHasPermission } from '../../utils/permissions';
import { Permission } from '../../types/permissions';

export default defineEventHandler(async (event) => {
    try {
        // Получаем контекст разрешений
        const context = await getPermissionContext(event);

        if (!context) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message: 'Требуется авторизация',
            });
        }

        // Проверяем разрешение на просмотр заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_VIEW)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для просмотра статистики',
            });
        }

        const stats = await getRequestsStats();

        return {
            success: true,
            stats,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка получения статистики заявок:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при получении статистики',
        });
    }
});
