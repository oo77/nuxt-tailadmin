/**
 * POST /api/representative/announcements/:id/apply
 * Подать заявку на объявление
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { createRequest, submitRequest } from '~/server/repositories/announcementRequestRepository';
import { getAnnouncementById, checkAnnouncementCapacity } from '~/server/repositories/announcementRepository';
import { requireRole, getUserFromEvent } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка роли представителя
    await requireRole(event, 'REPRESENTATIVE');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Announcement ID is required',
        });
    }

    const user = await getUserFromEvent(event);
    const body = await readBody(event);

    // Валидация
    if (!body.organizationId || !body.groupSelections || body.groupSelections.length === 0) {
        throw createError({
            statusCode: 400,
            message: 'Missing required fields: organizationId, groupSelections',
        });
    }

    // Проверить, что объявление опубликовано
    const announcement = await getAnnouncementById(id);

    if (!announcement || announcement.status !== 'published') {
        throw createError({
            statusCode: 403,
            message: 'Announcement is not available for applications',
        });
    }

    // Проверить дедлайн
    if (announcement.requestDeadline && new Date(announcement.requestDeadline) < new Date()) {
        throw createError({
            statusCode: 403,
            message: 'Application deadline has passed',
        });
    }

    // Подсчитать общее количество запрашиваемых мест
    const totalSlots = body.groupSelections.reduce(
        (sum: number, sel: any) => sum + sel.requestedSlots,
        0
    );

    // Проверить доступность мест
    const capacity = await checkAnnouncementCapacity(id, totalSlots);

    if (!capacity.available) {
        throw createError({
            statusCode: 400,
            message: `Not enough available slots. Available: ${capacity.availableSlots}, Requested: ${totalSlots}`,
        });
    }

    // Проверить наличие PDF, если требуется
    if (announcement.requiresPdf && !body.pdfFileId) {
        throw createError({
            statusCode: 400,
            message: 'PDF file is required for this announcement',
        });
    }

    const input = {
        announcementId: id,
        organizationId: body.organizationId,
        representativeId: user.id,
        requestType: body.requestType || 'with_employees',
        groupSelections: body.groupSelections,
        representativeNotes: body.representativeNotes,
        pdfFileId: body.pdfFileId,
    };

    try {
        // Создать заявку
        const request = await createRequest(input);

        // Если autoApprove, сразу подать заявку
        if (body.submit !== false) {
            return await submitRequest(request.id, user.id);
        }

        return request;
    } catch (error: any) {
        throw createError({
            statusCode: 400,
            message: error.message || 'Failed to create request',
        });
    }
});
