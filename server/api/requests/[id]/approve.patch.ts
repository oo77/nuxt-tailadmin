/**
 * PATCH /api/requests/:id/approve
 * Одобрить заявку
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { approveRequest } from '~/server/repositories/announcementRequestRepository';
import { requirePermission, getUserFromEvent } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENT_REQUESTS_APPROVE');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Request ID is required',
        });
    }

    const user = await getUserFromEvent(event);
    const body = await readBody(event);

    const input = {
        reviewerId: user.id,
        groupApprovals: body.groupApprovals,
    };

    try {
        const request = await approveRequest(id, input);

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
            message: error.message || 'Failed to approve request',
        });
    }
});
