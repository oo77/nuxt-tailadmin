/**
 * PATCH /api/announcements/:id/close
 * Закрыть объявление для приёма заявок
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { closeAnnouncement } from '~/server/repositories/announcementRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENTS_EDIT');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Announcement ID is required',
        });
    }

    try {
        const announcement = await closeAnnouncement(id);

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
            message: error.message || 'Failed to close announcement',
        });
    }
});
