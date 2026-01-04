/**
 * API endpoint для создания назначения теста
 * POST /api/tests/assignments
 */

import { createTestAssignment, testAssignmentExistsForEvent } from '../../../repositories/testAssignmentRepository';
import { getTestTemplateById } from '../../../repositories/testTemplateRepository';
import type { CreateTestAssignmentDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateTestAssignmentDTO>(event);

        // Валидация
        if (!body.schedule_event_id) {
            return {
                success: false,
                message: 'ID занятия обязателен',
            };
        }

        if (!body.test_template_id) {
            return {
                success: false,
                message: 'ID шаблона теста обязателен',
            };
        }

        if (!body.group_id) {
            return {
                success: false,
                message: 'ID группы обязателен',
            };
        }

        // Проверяем, не назначен ли уже тест на это занятие
        const exists = await testAssignmentExistsForEvent(body.schedule_event_id);
        if (exists) {
            return {
                success: false,
                message: 'На это занятие уже назначен тест',
            };
        }

        // Проверяем существование шаблона
        const template = await getTestTemplateById(body.test_template_id);
        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        // Получаем пользователя
        const userId = event.context.user?.id;

        // Создаём назначение
        const assignment = await createTestAssignment({
            schedule_event_id: body.schedule_event_id,
            test_template_id: body.test_template_id,
            group_id: body.group_id,
            time_limit_override: body.time_limit_override,
            passing_score_override: body.passing_score_override,
            start_date: body.start_date,
            end_date: body.end_date,
        }, userId);

        return {
            success: true,
            message: 'Тест успешно назначен на занятие',
            assignment,
        };
    } catch (error) {
        console.error('Ошибка создания назначения:', error);

        return {
            success: false,
            message: 'Ошибка при назначении теста',
        };
    }
});
