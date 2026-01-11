/**
 * PATCH /api/requests/:id/reject
 * Отклонить заявку
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { rejectRequest } from '~/server/repositories/announcementRequestRepository';
import { requirePermission, getUserFromEvent } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENT_REQUESTS_REVIEW');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Request ID is required',
        });
    }

    const user = await getUserFromEvent(event);
    const body = await readBody(event);

    if (!body.reason) {
        throw createError({
            statusCode: 400,
            message: 'Rejection reason is required',
        });
    }

    const input = {
        reviewerId: user.id,
        reason: body.reason,
    };

    try {
        const request = await rejectRequest(id, input);

        if (!request) {
            throw createError({
                statusCode: 404,
                message: 'Request not found',
            });
        }

        return request;
    } catch (error: any) {
        throw createError({
            statusCode: 400,
            message: error.message || 'Failed to reject request',
        });
    }
});
