/**
 * GET /api/announcements/:id/requests
 * Получить все заявки по объявлению
 */

import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3';
import { getRequestsByAnnouncement } from '~/server/repositories/announcementRequestRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENT_REQUESTS_VIEW_ALL');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Announcement ID is required',
        });
    }

    const query = getQuery(event);

    const filters = {
        status: query.status as any,
        requestType: query.requestType as any,
        organizationId: query.organizationId as string,
        search: query.search as string,
    };

    return await getRequestsByAnnouncement(id, filters);
});
