/**
 * API endpoint для завершения теста
 * POST /api/tests/sessions/:id/finish
 */

import {
    getTestSessionById,
    finishSession,
    calculateSessionResults
} from '../../repositories/testSessionRepository';
import { getTestAssignmentById } from '../../repositories/testAssignmentRepository';
import { executeQuery } from '../../utils/db';
import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID сессии не указан',
            };
        }

        // Получаем сессию
        const session = await getTestSessionById(id);
        if (!session) {
            return {
                success: false,
                message: 'Сессия не найдена',
            };
        }

        // Проверяем статус
        if (session.status !== 'in_progress') {
            // Если уже завершена, возвращаем результаты
            if (session.status === 'completed') {
                return {
                    success: true,
                    message: 'Тест уже завершён',
                    results: {
                        total_points: session.total_points,
                        max_points: session.max_points,
                        score_percent: session.score_percent,
                        passed: session.passed,
                        grade: session.grade,
                    },
                };
            }

            return {
                success: false,
                message: 'Невозможно завершить тест в текущем статусе',
            };
        }

        // Подсчитываем результаты
        const results = await calculateSessionResults(id);

        // Завершаем сессию
        await finishSession(id, {
            total_points: results.total_points,
            max_points: results.max_points,
            score_percent: results.score_percent,
            passed: results.passed,
            grade: results.grade,
            time_spent_seconds: results.time_spent_seconds,
        });

        // Записываем оценку в журнал (grades)
        try {
            const assignment = await getTestAssignmentById(session.assignment_id);
            if (assignment) {
                const gradeId = uuidv4();
                const now = new Date();

                await executeQuery(
                    `INSERT INTO grades (id, student_id, schedule_event_id, grade, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE grade = ?, updated_at = ?`,
                    [
                        gradeId,
                        session.student_id,
                        assignment.schedule_event_id,
                        results.grade,
                        now,
                        now,
                        results.grade,
                        now,
                    ]
                );
            }
        } catch (gradeError) {
            console.error('Ошибка записи оценки в журнал:', gradeError);
            // Не прерываем выполнение, тест всё равно завершён
        }

        return {
            success: true,
            message: results.passed ? 'Тест успешно сдан!' : 'Тест завершён',
            results: {
                total_points: results.total_points,
                max_points: results.max_points,
                score_percent: results.score_percent,
                passed: results.passed,
                grade: results.grade,
                answers_count: results.answers_count,
                correct_count: results.correct_count,
                time_spent_seconds: results.time_spent_seconds,
            },
        };
    } catch (error) {
        console.error('Ошибка завершения теста:', error);

        return {
            success: false,
            message: 'Ошибка при завершении теста',
        };
    }
});
