/**
 * PATCH /api/announcements/:id/publish
 * Опубликовать объявление
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { publishAnnouncement } from '~/server/repositories/announcementRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENTS_PUBLISH');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Announcement ID is required',
        });
    }

    try {
        const announcement = await publishAnnouncement(id);

        if (!announcement) {
            throw createError({
                statusCode: 404,
                message: 'Announcement not found',
            });
        }

        return announcement;
    } catch (error: any) {
        throw createError({
            statusCode: 400,
            message: error.message || 'Failed to publish announcement',
        });
    }
});
