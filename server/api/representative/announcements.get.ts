/**
 * GET /api/representative/announcements
 * Получить список опубликованных объявлений для представителей
 */

import { defineEventHandler } from 'h3';
import { getPublishedAnnouncements } from '~/server/repositories/announcementRepository';
import { requireRole } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка роли представителя
    await requireRole(event, 'REPRESENTATIVE');

    return await getPublishedAnnouncements();
});
