/**
 * API endpoint для обновления привязки теста к дисциплине
 * PUT /api/discipline-tests/:id
 */

import { updateDisciplineTest, getDisciplineTestById } from '../../repositories/disciplineTestRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID привязки не указан',
            };
        }

        // Проверяем существование
        const existingTest = await getDisciplineTestById(id);
        if (!existingTest) {
            return {
                success: false,
                message: 'Привязка не найдена',
            };
        }

        const body = await readBody<{
            is_required?: boolean;
            order_index?: number;
            notes?: string;
        }>(event);

        // Обновляем привязку
        const updated = await updateDisciplineTest(id, {
            is_required: body.is_required,
            order_index: body.order_index,
            notes: body.notes,
        });

        if (!updated) {
            return {
                success: false,
                message: 'Ошибка при обновлении привязки',
            };
        }

        return {
            success: true,
            message: 'Привязка успешно обновлена',
            disciplineTest: updated,
        };
    } catch (error) {
        console.error('Ошибка обновления привязки:', error);

        return {
            success: false,
            message: 'Ошибка при обновлении привязки',
        };
    }
});
