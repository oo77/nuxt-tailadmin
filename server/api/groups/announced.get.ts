/**
 * API endpoint для получения анонсированных групп (для представителей)
 * GET /api/groups/announced
 * 
 * Доступ: REPRESENTATIVE (approved), ADMIN, MANAGER
 */

import { getAnnouncedGroupsForRepresentatives } from '../../repositories/groupRepository';
import { getRepresentativeByUserId } from '../../repositories/representativeRepository';
import { getPermissionContext, roleHasPermission } from '../../utils/permissions';
import { Permission } from '../../types/permissions';
import { logActivity } from '../../utils/activityLogger';

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

        // Проверяем разрешения
        const canViewAnnounced = roleHasPermission(context.role, Permission.GROUPS_VIEW_ANNOUNCED);
        const canViewAll = roleHasPermission(context.role, Permission.GROUPS_VIEW_ALL);

        if (!canViewAnnounced && !canViewAll) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для просмотра анонсов',
            });
        }

        // Получаем организацию представителя (если это представитель)
        let organizationId: string | undefined;

        if (canViewAnnounced && !canViewAll) {
            const representative = await getRepresentativeByUserId(context.userId);

            if (!representative) {
                throw createError({
                    statusCode: 403,
                    statusMessage: 'Forbidden',
                    message: 'Профиль представителя не найден',
                });
            }

            if (representative.status !== 'approved') {
                throw createError({
                    statusCode: 403,
                    statusMessage: 'Forbidden',
                    message: 'Ваш профиль ещё не одобрен',
                });
            }

            organizationId = representative.organizationId;
        }

        // Получаем анонсированные группы
        const groups = await getAnnouncedGroupsForRepresentatives(organizationId);

        // Логируем действие
        await logActivity(
            event,
            'VIEW',
            'GROUP',
            undefined,
            undefined,
            { message: `Просмотр анонсированных групп (${groups.length} групп)` }
        );

        return {
            success: true,
            groups,
            total: groups.length,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка получения анонсированных групп:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при получении списка групп',
        });
    }
});
