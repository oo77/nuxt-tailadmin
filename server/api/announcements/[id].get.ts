/**
 * GET /api/announcements/:id
 * Получить детальную информацию об объявлении
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getAnnouncementById } from '~/server/repositories/announcementRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENTS_VIEW');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Announcement ID is required',
        });
    }

    const announcement = await getAnnouncementById(id);

    if (!announcement) {
        throw createError({
            statusCode: 404,
            message: 'Announcement not found',
        });
    }

    return announcement;
});
