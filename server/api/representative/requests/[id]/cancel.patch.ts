/**
 * PATCH /api/representative/requests/:id/cancel
 * Отменить свою заявку
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { cancelRequest, getRequestById } from '~/server/repositories/announcementRequestRepository';
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

    // Проверить, что заявка принадлежит текущему представителю
    const existingRequest = await getRequestById(id);

    if (!existingRequest) {
        throw createError({
            statusCode: 404,
            message: 'Request not found',
        });
    }

    if (existingRequest.representativeId !== user.id) {
        throw createError({
            statusCode: 403,
            message: 'Access denied',
        });
    }

    try {
        const request = await cancelRequest(id, user.id);

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
            message: error.message || 'Failed to cancel request',
        });
    }
});
