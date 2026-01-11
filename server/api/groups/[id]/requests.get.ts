/**
 * API endpoint для получения заявок на группу
 * GET /api/groups/:id/requests?status=pending
 * 
 * Доступ: ADMIN, MANAGER
 */

import { getRequestsByGroup } from '../../../repositories/trainingRequestRepository';
import { getGroupById } from '../../../repositories/groupRepository';
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
                message: 'ID группы не указан',
            });
        }

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

        // Проверяем разрешение на просмотр заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_VIEW)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для просмотра заявок',
            });
        }

        // Проверяем существование группы
        const group = await getGroupById(id);

        if (!group) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: 'Группа не найдена',
            });
        }

        // Фильтр по статусу (опционально)
        const status = query.status as any;

        // Получаем заявки
        const requests = await getRequestsByGroup(id, status);

        // Логируем действие
        await logActivity(
            event,
            'VIEW',
            'TRAINING_REQUEST',
            undefined,
            undefined,
            {
                message: `Просмотр заявок на группу ${group.code}`,
                groupId: id,
                requestsCount: requests.length,
            }
        );

        return {
            success: true,
            group: {
                id: group.id,
                code: group.code,
                course: group.course,
            },
            requests,
            total: requests.length,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка получения заявок на группу:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при получении заявок',
        });
    }
});
