/**
 * PUT /api/announcements/:id
 * Обновить объявление
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { updateAnnouncement } from '~/server/repositories/announcementRepository';
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

    const body = await readBody(event);

    const input = {
        title: body.title,
        description: body.description,
        requestDeadline: body.requestDeadline,
        requiresPdf: body.requiresPdf,
        autoApprove: body.autoApprove,
    };

    const announcement = await updateAnnouncement(id, input);

    if (!announcement) {
        throw createError({
            statusCode: 404,
            message: 'Announcement not found',
        });
    }

    return announcement;
});
