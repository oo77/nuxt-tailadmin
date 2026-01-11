/**
 * PUT /api/requests/:id/employees
 * Обновить список сотрудников в заявке
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { updateRequestEmployees } from '~/server/repositories/announcementRequestRepository';
import { requirePermission } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    // Проверка прав доступа (представитель может обновлять свои заявки)
    await requirePermission(event, 'REPRESENTATIVE_REQUESTS_MANAGE');

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Request group ID is required',
        });
    }

    const body = await readBody(event);

    if (!Array.isArray(body.employeeIds)) {
        throw createError({
            statusCode: 400,
            message: 'employeeIds must be an array',
        });
    }

    try {
        await updateRequestEmployees(id, body.employeeIds);

        return { success: true, message: 'Employees updated successfully' };
    } catch (error: any) {
        throw createError({
            statusCode: 400,
            message: error.message || 'Failed to update employees',
        });
    }
});
