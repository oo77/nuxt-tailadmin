/**
 * GET /api/representative/requests/:id
 * Получить детальную информацию о своей заявке
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getRequestById } from '~/server/repositories/announcementRequestRepository';
import { requireRole, getUserFromEvent } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка роли представителя
    await requireRole(event, 'REPRESENTATIVE');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Request ID is required',
        });
    }

    const user = await getUserFromEvent(event);
    const request = await getRequestById(id);

    if (!request) {
        throw createError({
            statusCode: 404,
            message: 'Request not found',
        });
    }

    // Проверить, что заявка принадлежит текущему представителю
    if (request.representativeId !== user.id) {
        throw createError({
            statusCode: 403,
            message: 'Access denied',
        });
    }

    return request;
});
