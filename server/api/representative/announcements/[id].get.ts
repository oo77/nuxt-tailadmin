/**
 * GET /api/representative/announcements/:id
 * Получить детальную информацию об объявлении для представителя
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getAnnouncementById } from '~/server/repositories/announcementRepository';
import { requireRole } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка роли представителя
    await requireRole(event, 'REPRESENTATIVE');

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

    // Проверить, что объявление опубликовано
    if (announcement.status !== 'published') {
        throw createError({
            statusCode: 403,
            message: 'Announcement is not available',
        });
    }

    return announcement;
});
