/**
 * API endpoint для закрытия группы для заявок
 * POST /api/groups/:id/close-requests
 * 
 * Доступ: ADMIN, MANAGER
 */

import { closeGroupForRequests, getGroupById } from '../../../repositories/groupRepository';
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

        // Получаем контекст разрешений
        const context = await getPermissionContext(event);

        if (!context) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message: 'Требуется авторизация',
            });
        }

        // Проверяем разрешение на управление анонсами
        if (!roleHasPermission(context.role, Permission.GROUPS_MANAGE_ANNOUNCEMENTS)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для управления группами',
            });
        }

        // Проверяем существование группы
        const existingGroup = await getGroupById(id);

        if (!existingGroup) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: 'Группа не найдена',
            });
        }

        // Закрываем группу для заявок
        await closeGroupForRequests(id);

        // Получаем обновлённую группу
        const group = await getGroupById(id);

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'GROUP',
            id,
            existingGroup.code,
            {
                oldAnnouncementStatus: existingGroup.announcementStatus,
                announcementStatus: 'closed',
                action: 'closed_for_requests',
            }
        );

        return {
            success: true,
            message: 'Группа закрыта для заявок',
            group,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка закрытия группы для заявок:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при закрытии группы',
        });
    }
});
