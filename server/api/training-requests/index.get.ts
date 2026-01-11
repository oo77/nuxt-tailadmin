/**
 * API endpoint для получения списка заявок на обучение
 * GET /api/training-requests?page=1&limit=10&status=pending&...
 * 
 * Доступ:
 * - ADMIN/MANAGER: все заявки с фильтрами
 * - REPRESENTATIVE: только свои заявки (редирект на /my)
 */

import { getRequestsPaginated, getRequestsStats, type RequestFilters } from '../../repositories/trainingRequestRepository';
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

        // Проверяем разрешение на просмотр заявок
        const canViewAll = roleHasPermission(context.role, Permission.REQUESTS_VIEW);
        const canViewOwn = roleHasPermission(context.role, Permission.REQUESTS_VIEW_OWN);

        if (!canViewAll && !canViewOwn) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для просмотра заявок',
            });
        }

        // Если пользователь может видеть только свои заявки - редирект на /api/training-requests/my
        if (canViewOwn && !canViewAll) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Используйте /api/training-requests/my для просмотра своих заявок',
            });
        }

        // Парсим фильтры
        const filters: RequestFilters = {};

        if (query.status) {
            filters.status = query.status as any;
        }

        if (query.groupId) {
            filters.groupId = query.groupId as string;
        }

        if (query.organizationId) {
            filters.organizationId = query.organizationId as string;
        }

        if (query.representativeId) {
            filters.representativeId = query.representativeId as string;
        }

        if (query.dateFrom) {
            filters.dateFrom = query.dateFrom as string;
        }

        if (query.dateTo) {
            filters.dateTo = query.dateTo as string;
        }

        if (query.search) {
            filters.search = query.search as string;
        }

        // Парсим параметры пагинации
        const page = query.page ? parseInt(query.page as string, 10) : 1;
        const limit = query.limit ? Math.min(parseInt(query.limit as string, 10), 100) : 20;

        const result = await getRequestsPaginated({ page, limit, filters });

        // Получаем статистику
        const stats = await getRequestsStats();

        // Логируем действие
        await logActivity(
            event,
            'VIEW',
            'TRAINING_REQUEST',
            undefined,
            undefined,
            { message: `Просмотр списка заявок (${result.total} результатов)` }
        );

        return {
            success: true,
            requests: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            stats,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка получения списка заявок:', error);

        return {
            success: false,
            message: 'Ошибка при получении списка заявок',
            requests: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
        };
    }
});
