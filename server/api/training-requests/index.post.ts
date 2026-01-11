/**
 * API endpoint для создания заявки на обучение
 * POST /api/training-requests
 * 
 * Доступ: REPRESENTATIVE (approved)
 * 
 * Body:
 * {
 *   groupId: string,
 *   studentIds: string[],
 *   representativeNotes?: string
 * }
 */

import {
    createRequest,
    canSubmitRequest,
    type CreateRequestInput
} from '../../repositories/trainingRequestRepository';
import { getRepresentativeByUserId } from '../../repositories/representativeRepository';
import { checkCapacityAvailable } from '../../repositories/groupRepository';
import { getPermissionContext, roleHasPermission } from '../../utils/permissions';
import { Permission } from '../../types/permissions';
import { logActivity } from '../../utils/activityLogger';

interface CreateRequestBody {
    groupId: string;
    studentIds: string[];
    representativeNotes?: string;
    pdfFileId?: number;
}

export default defineEventHandler(async (event) => {
    try {
        // Получаем контекст разрешений
        const context = await getPermissionContext(event);

        if (!context) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message: 'Требуется авторизация',
            });
        }

        // Проверяем разрешение на создание заявок
        if (!roleHasPermission(context.role, Permission.REQUESTS_CREATE)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Недостаточно прав для создания заявок',
            });
        }

        // Получаем представителя по userId
        const representative = await getRepresentativeByUserId(context.userId);

        if (!representative) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Профиль представителя не найден',
            });
        }

        if (representative.status !== 'approved') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                message: 'Ваш профиль представителя ещё не одобрен',
            });
        }

        // Парсим тело запроса
        const body = await readBody<CreateRequestBody>(event);

        // Валидация
        if (!body.groupId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Не указана группа обучения',
            });
        }

        if (!body.studentIds || !Array.isArray(body.studentIds) || body.studentIds.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Не выбраны сотрудники для обучения',
            });
        }

        // Проверяем возможность подачи заявки
        const canSubmit = await canSubmitRequest(representative.id, body.groupId);

        if (!canSubmit.allowed) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: canSubmit.reason || 'Подача заявки невозможна',
            });
        }

        // Проверяем доступность мест
        const capacity = await checkCapacityAvailable(body.groupId, body.studentIds.length);

        if (!capacity.available) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: `Недостаточно мест в группе. Доступно: ${capacity.remainingSlots}`,
            });
        }

        // Создаём заявку
        const requestData: CreateRequestInput = {
            groupId: body.groupId,
            organizationId: representative.organizationId,
            representativeId: representative.id,
            studentIds: body.studentIds,
            representativeNotes: body.representativeNotes,
            pdfFileId: body.pdfFileId,
        };

        const request = await createRequest(requestData);

        // Логируем действие
        await logActivity(
            event,
            'CREATE',
            'TRAINING_REQUEST',
            request.id,
            undefined,
            {
                groupId: body.groupId,
                employeesCount: body.studentIds.length,
                organizationId: representative.organizationId,
            }
        );

        // TODO: Уведомить администраторов о новой заявке

        return {
            success: true,
            message: 'Заявка успешно создана',
            request,
        };
    } catch (error: any) {
        // Пробрасываем HTTP ошибки
        if (error.statusCode) {
            throw error;
        }

        console.error('Ошибка создания заявки:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Ошибка при создании заявки',
        });
    }
});
