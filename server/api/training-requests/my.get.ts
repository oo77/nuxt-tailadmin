/**
 * API endpoint для получения своих заявок (для представителя)
 * GET /api/training-requests/my?status=pending
 * 
 * Доступ: REPRESENTATIVE
 */

import { getRepresentativeRequests } from '../../repositories/trainingRequestRepository';
import { getRepresentativeByUserId } from '../../repositories/representativeRepository';
import { getPermissionContext, roleHasPermission } from '../../utils/permissions';
import { Permission } from '../../types/permissions';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);

        // Получаем контекст разрешений
        const context = await getPermissionContext(event);

        if (!context) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message: 'Требуется авторизация',
            });
        }

        // Проверяем разрешение на просмотр своих заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_VIEW_OWN)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для просмотра заявок',
            });
        }

        // Получаем представителя по userId
        const representative = await getRepresentativeByUserId(context.userId);

        if (!representative) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Профиль представителя не найден',
            });
        }

        // Фильтр по статусу (опционально)
        const statusFilter = query.status
            ? { status: query.status as any }
            : undefined;

        // Получаем заявки представителя
        const requests = await getRepresentativeRequests(representative.id, statusFilter);

        // Логируем действие
        await logActivity(
            event,
            'VIEW',
            'TRAINING_REQUEST',
            undefined,
            undefined,
            { message: `Просмотр своих заявок (${requests.length} заявок)` }
        );

        return {
            success: true,
            requests,
            total: requests.length,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка получения заявок представителя:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при получении заявок',
        });
    }
});
