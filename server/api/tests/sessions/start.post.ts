/**
 * API endpoint для начала теста (создание сессии)
 * POST /api/tests/sessions/start
 */

import {
    createTestSession,
    getActiveSessionForStudent,
    getStudentAttemptCount
} from '../../../repositories/testSessionRepository';
import { getTestAssignmentById } from '../../../repositories/testAssignmentRepository';
import { getTestTemplateById } from '../../../repositories/testTemplateRepository';
import { getQuestionsByBankId, getRandomQuestionsFromBank, getQuestionsByIds } from '../../../repositories/questionRepository';
import { getTemplateQuestions } from '../../../repositories/testTemplateRepository';
import { getStudentByUserId } from '../../../repositories/studentRepository';
import type { SessionQuestionOrder, TestTemplateQuestion } from '../../../types/testing';

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<{ assignment_id: string }>(event);

        if (!body.assignment_id) {
            return {
                success: false,
                message: 'ID назначения обязателен',
            };
        }

        // Получаем пользователя
        const userId = event.context.user?.id;
        if (!userId) {
            return {
                success: false,
                message: 'Не авторизован',
            };
        }

        // Получаем студента
        const student = await getStudentByUserId(userId);
        if (!student) {
            return {
                success: false,
                message: 'Студент не найден',
            };
        }

        // Получаем назначение
        const assignment = await getTestAssignmentById(body.assignment_id);
        if (!assignment) {
            return {
                success: false,
                message: 'Назначение не найдено',
            };
        }

        // Проверяем статус назначения
        if (assignment.status === 'cancelled' || assignment.status === 'completed') {
            return {
                success: false,
                message: 'Тест недоступен',
            };
        }

        // Проверяем сроки
        const now = new Date();
        if (assignment.start_date && new Date(assignment.start_date) > now) {
            return {
                success: false,
                message: 'Тест ещё не открыт',
            };
        }
        if (assignment.end_date && new Date(assignment.end_date) < now) {
            return {
                success: false,
                message: 'Срок сдачи теста истёк',
            };
        }

        // Получаем шаблон теста
        const template = await getTestTemplateById(assignment.test_template_id);
        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        // Проверяем активную сессию
        const activeSession = await getActiveSessionForStudent(body.assignment_id, student.id);
        if (activeSession) {
            // Возвращаем существующую сессию
            return {
                success: true,
                message: 'Продолжение теста',
                session: activeSession,
                resumed: true,
            };
        }

        // Проверяем попытки
        const attemptCount = await getStudentAttemptCount(body.assignment_id, student.id);
        if (attemptCount >= template.max_attempts) {
            return {
                success: false,
                message: `Использованы все попытки (${template.max_attempts})`,
            };
        }

        // Получаем вопросы в зависимости от режима
        let questions;

        switch (template.questions_mode) {
            case 'all':
                questions = await getQuestionsByBankId(template.bank_id, true);
                break;

            case 'random':
                questions = await getRandomQuestionsFromBank(
                    template.bank_id,
                    template.questions_count || 10
                );
                break;

            case 'manual':
                const templateQuestions = await getTemplateQuestions(template.id);
                const questionIds = templateQuestions.map(tq => tq.question_id);
                questions = await getQuestionsByIds(questionIds);
                break;

            default:
                questions = await getQuestionsByBankId(template.bank_id, true);
        }

        if (!questions.length) {
            return {
                success: false,
                message: 'В тесте нет вопросов',
            };
        }

        // Формируем порядок вопросов
        let orderedQuestions = [...questions];

        // Перемешиваем вопросы если нужно
        if (template.shuffle_questions) {
            orderedQuestions = shuffleArray(orderedQuestions);
        }

        // Формируем questions_order с перемешанными вариантами
        const questionsOrder: SessionQuestionOrder[] = orderedQuestions.map(q => {
            const result: SessionQuestionOrder = {
                questionId: q.id,
            };

            // Перемешиваем варианты если нужно
            if (template.shuffle_options && q.options) {
                const options = (q.options as any).options;
                if (Array.isArray(options)) {
                    result.shuffledOptions = shuffleArray(options.map((o: any) => o.id));
                }
            }

            return result;
        });

        // Получаем IP и User-Agent
        const headers = getHeaders(event);
        const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || '';
        const userAgent = headers['user-agent'] || '';

        // Создаём сессию
        const session = await createTestSession({
            assignment_id: body.assignment_id,
            student_id: student.id,
            ip_address: ipAddress.toString().split(',')[0].trim(),
            user_agent: userAgent,
        }, questionsOrder);

        return {
            success: true,
            message: 'Тест начат',
            session,
            template: {
                time_limit_minutes: assignment.time_limit_override || template.time_limit_minutes,
                passing_score: assignment.passing_score_override || template.passing_score,
                questions_per_page: template.questions_per_page,
                allow_back: template.allow_back,
                proctoring_enabled: template.proctoring_enabled,
                proctoring_settings: template.proctoring_settings,
                show_results: template.show_results,
            },
            questions_count: questionsOrder.length,
        };
    } catch (error) {
        console.error('Ошибка начала теста:', error);

        return {
            success: false,
            message: 'Ошибка при начале теста',
        };
    }
});
