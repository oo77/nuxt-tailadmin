/**
 * GET /api/announcements
 * Получить список объявлений с пагинацией и фильтрами
 */

import { defineEventHandler, getQuery } from 'h3';
import { getAnnouncements } from '~/server/repositories/announcementRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа
    await requirePermission(event, 'ANNOUNCEMENTS_VIEW');

    const query = getQuery(event);

    const params = {
        page: query.page ? parseInt(query.page as string) : 1,
        limit: query.limit ? parseInt(query.limit as string) : 20,
        filters: {
            status: query.status as any,
            announcementType: query.announcementType as any,
            search: query.search as string,
            dateFrom: query.dateFrom as string,
            dateTo: query.dateTo as string,
            createdBy: query.createdBy as string,
        },
    };

    return await getAnnouncements(params);
});
