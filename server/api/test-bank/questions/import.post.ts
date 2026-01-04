/**
 * API endpoint для импорта вопросов из Excel
 * POST /api/test-bank/questions/import
 */

import { bulkCreateQuestions } from '../../../repositories/questionRepository';
import { getQuestionBankById } from '../../../repositories/questionBankRepository';
import type { CreateQuestionDTO, SingleChoiceOptions } from '../../../types/testing';

interface ImportedQuestion {
    question: string;
    optionA: string;
    optionB: string;
    optionC?: string;
    optionD?: string;
    correct: string; // A, B, C, D
    points?: number;
    difficulty?: string;
    explanation?: string;
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<{
            bank_id: string;
            questions: ImportedQuestion[];
        }>(event);

        // Валидация
        if (!body.bank_id) {
            return {
                success: false,
                message: 'ID банка обязателен',
            };
        }

        if (!body.questions?.length) {
            return {
                success: false,
                message: 'Список вопросов пуст',
            };
        }

        // Проверяем существование банка
        const bank = await getQuestionBankById(body.bank_id);
        if (!bank) {
            return {
                success: false,
                message: 'Банк вопросов не найден',
            };
        }

        // Конвертируем вопросы в формат CreateQuestionDTO
        const questionsToCreate: CreateQuestionDTO[] = body.questions.map((q, index) => {
            const options: SingleChoiceOptions = {
                options: [
                    { id: 'a', text: q.optionA, correct: q.correct.toUpperCase() === 'A' },
                    { id: 'b', text: q.optionB, correct: q.correct.toUpperCase() === 'B' },
                ],
            };

            if (q.optionC) {
                options.options.push({ id: 'c', text: q.optionC, correct: q.correct.toUpperCase() === 'C' });
            }
            if (q.optionD) {
                options.options.push({ id: 'd', text: q.optionD, correct: q.correct.toUpperCase() === 'D' });
            }

            return {
                bank_id: body.bank_id,
                question_type: 'single' as const,
                question_text: q.question,
                options,
                points: q.points || 1,
                difficulty: (q.difficulty as any) || 'medium',
                explanation: q.explanation,
                order_index: index,
                is_active: true,
            };
        });

        // Массовое создание
        const result = await bulkCreateQuestions(questionsToCreate);

        return {
            success: true,
            message: `Импортировано ${result.created} вопросов`,
            created: result.created,
            errors: result.errors,
        };
    } catch (error) {
        console.error('Ошибка импорта вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при импорте вопросов',
        };
    }
});
