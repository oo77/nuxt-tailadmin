/**
 * POST /api/announcements
 * Создать новое объявление
 */

import { defineEventHandler, readBody } from 'h3';
import { createAnnouncement } from '~/server/repositories/announcementRepository';
import { requirePermission, getUserFromEvent } from '~/server/utils/auth';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENTS_CREATE');

    const user = await getUserFromEvent(event);
    const body = await readBody(event);

    // Валидация
    if (!body.title || !body.announcementType || !body.groupIds || body.groupIds.length === 0) {
        throw createError({
            statusCode: 400,
            message: 'Missing required fields: title, announcementType, groupIds',
        });
    }

    const input = {
        title: body.title,
        description: body.description,
        announcementType: body.announcementType,
        groupIds: body.groupIds,
        requestDeadline: body.requestDeadline,
        requiresPdf: body.requiresPdf,
        autoApprove: body.autoApprove,
        groupCapacities: body.groupCapacities,
        createdBy: user.id,
    };

    return await createAnnouncement(input);
});
