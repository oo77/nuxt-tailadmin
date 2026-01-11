/**
 * GET /api/representative/requests
 * Получить список заявок представителя
 */

import { defineEventHandler, getQuery } from 'h3';
import { getRequestsByRepresentative } from '~/server/repositories/announcementRequestRepository';
import { requireRole, getUserFromEvent } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка роли представителя
    await requireRole(event, 'REPRESENTATIVE');

    const user = await getUserFromEvent(event);
    const query = getQuery(event);

    const filters = {
        status: query.status as any,
        announcementId: query.announcementId as string,
        search: query.search as string,
    };

    return await getRequestsByRepresentative(user.id, filters);
});
