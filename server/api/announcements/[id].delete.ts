/**
 * DELETE /api/announcements/:id
 * Удалить объявление
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { deleteAnnouncement } from '~/server/repositories/announcementRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENTS_DELETE');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Announcement ID is required',
        });
    }

    try {
        const deleted = await deleteAnnouncement(id);

        if (!deleted) {
            throw createError({
                statusCode: 404,
                message: 'Announcement not found',
            });
        }

        return { success: true, message: 'Announcement deleted successfully' };
    } catch (error: any) {
        throw createError({
            statusCode: 400,
            message: error.message || 'Failed to delete announcement',
        });
    }
});
