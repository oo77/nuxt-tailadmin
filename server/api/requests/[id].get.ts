/**
 * GET /api/requests/:id
 * Получить детальную информацию о заявке
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getRequestById } from '~/server/repositories/announcementRequestRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENT_REQUESTS_VIEW_ALL');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Request ID is required',
        });
    }

    const request = await getRequestById(id);

    if (!request) {
        throw createError({
            statusCode: 404,
            message: 'Request not found',
        });
    }

    return request;
});
