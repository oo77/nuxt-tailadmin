/**
 * API endpoint для получения тестов студента
 * GET /api/tests/my
 */

import { getStudentAssignments } from '../../repositories/testAssignmentRepository';
import { getStudentByUserId } from '../../repositories/studentRepository';

export default defineEventHandler(async (event) => {
    try {
        // Получаем пользователя из контекста
        const userId = event.context.user?.id;

        if (!userId) {
            return {
                success: false,
                message: 'Не авторизован',
                assignments: [],
            };
        }

        // Получаем студента по user_id
        const student = await getStudentByUserId(userId);

        if (!student) {
            return {
                success: false,
                message: 'Студент не найден',
                assignments: [],
            };
        }

        const query = getQuery(event);

        // Получаем назначения для студента
        const assignments = await getStudentAssignments(student.id, {
            upcoming: query.upcoming === 'true',
        });

        return {
            success: true,
            assignments,
        };
    } catch (error) {
        console.error('Ошибка получения тестов студента:', error);

        return {
            success: false,
            message: 'Ошибка при получении тестов',
            assignments: [],
        };
    }
});
