/**
 * Сервис уведомлений для студентов
 * Обрабатывает уведомления о тестах, дедлайнах и событиях расписания
 */

import { executeQuery } from '../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

export type NotificationType =
    | 'TEST_UPCOMING'      // За 24 часа до теста
    | 'TEST_TODAY'         // В день теста
    | 'TEST_OVERDUE'       // Срок истёк
    | 'DEADLINE_WARNING'   // За 3 дня до дедлайна
    | 'DEADLINE_CRITICAL'  // За 24 часа до дедлайна
    | 'SCHEDULE_CHANGE'    // Изменение расписания
    | 'GRADE_POSTED';      // Выставлена оценка

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface StudentNotification {
    id: string;
    student_id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
    is_read: boolean;
    created_at: Date;
}

interface UpcomingDeadline {
    assignment_id: string;
    student_id: string;
    template_name: string;
    group_name: string;
    end_date: Date;
    hours_until_deadline: number;
}

/**
 * Получить предстоящие дедлайны для всех студентов
 */
export async function getUpcomingDeadlines(): Promise<UpcomingDeadline[]> {
    const query = `
    SELECT 
      ta.id as assignment_id,
      sgs.student_id,
      tt.name as template_name,
      sg.code as group_name,
      ta.end_date,
      TIMESTAMPDIFF(HOUR, NOW(), ta.end_date) as hours_until_deadline
    FROM test_assignments ta
    INNER JOIN study_groups sg ON ta.group_id = sg.id
    INNER JOIN study_group_students sgs ON sg.id = sgs.group_id
    INNER JOIN test_templates tt ON ta.test_template_id = tt.id
    WHERE ta.status = 'scheduled'
      AND ta.end_date IS NOT NULL
      AND ta.end_date > NOW()
      AND ta.end_date < DATE_ADD(NOW(), INTERVAL 3 DAY)
      AND NOT EXISTS (
        SELECT 1 FROM test_sessions ts 
        WHERE ts.assignment_id = ta.id 
          AND ts.student_id = sgs.student_id 
          AND ts.status = 'completed'
          AND ts.passed = 1
      )
  `;

    const rows = await executeQuery<RowDataPacket[]>(query);

    return rows.map((row: any) => ({
        assignment_id: row.assignment_id,
        student_id: row.student_id,
        template_name: row.template_name,
        group_name: row.group_name,
        end_date: row.end_date,
        hours_until_deadline: row.hours_until_deadline,
    }));
}

/**
 * Получить просроченные тесты
 */
export async function getOverdueTests(): Promise<UpcomingDeadline[]> {
    const query = `
    SELECT 
      ta.id as assignment_id,
      sgs.student_id,
      tt.name as template_name,
      sg.code as group_name,
      ta.end_date,
      TIMESTAMPDIFF(HOUR, ta.end_date, NOW()) as hours_until_deadline
    FROM test_assignments ta
    INNER JOIN study_groups sg ON ta.group_id = sg.id
    INNER JOIN study_group_students sgs ON sg.id = sgs.group_id
    INNER JOIN test_templates tt ON ta.test_template_id = tt.id
    WHERE ta.status = 'scheduled'
      AND ta.end_date IS NOT NULL
      AND ta.end_date < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM test_sessions ts 
        WHERE ts.assignment_id = ta.id 
          AND ts.student_id = sgs.student_id 
          AND ts.status = 'completed'
      )
  `;

    const rows = await executeQuery<RowDataPacket[]>(query);

    return rows.map((row: any) => ({
        assignment_id: row.assignment_id,
        student_id: row.student_id,
        template_name: row.template_name,
        group_name: row.group_name,
        end_date: row.end_date,
        hours_until_deadline: -row.hours_until_deadline, // Отрицательное значение для просроченных
    }));
}

/**
 * Создать уведомление для студента
 */
export async function createNotification(
    studentId: string,
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    message: string,
    link?: string,
    metadata?: any
): Promise<void> {
    // Проверяем, не создано ли уже такое уведомление недавно (за последние 24 часа)
    const existingQuery = `
    SELECT id FROM student_notifications 
    WHERE student_id = ? 
      AND type = ? 
      AND JSON_EXTRACT(metadata, '$.assignment_id') = ?
      AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    LIMIT 1
  `;

    const assignmentId = metadata?.assignment_id;
    const existing = await executeQuery<RowDataPacket[]>(
        existingQuery,
        [studentId, type, assignmentId]
    );

    if (existing.length > 0) {
        // Уведомление уже существует, не создаём дубликат
        return;
    }

    const query = `
    INSERT INTO student_notifications (
      id, student_id, type, priority, title, message, link, metadata
    ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
  `;

    await executeQuery(query, [
        studentId,
        type,
        priority,
        title,
        message,
        link || null,
        metadata ? JSON.stringify(metadata) : null,
    ]);
}

/**
 * Получить уведомления студента
 */
export async function getStudentNotifications(
    studentId: string,
    unreadOnly: boolean = false
): Promise<StudentNotification[]> {
    let query = `
    SELECT * FROM student_notifications 
    WHERE student_id = ?
  `;

    if (unreadOnly) {
        query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const rows = await executeQuery<RowDataPacket[]>(query, [studentId]);

    return rows.map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        type: row.type,
        priority: row.priority,
        title: row.title,
        message: row.message,
        link: row.link,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        is_read: Boolean(row.is_read),
        created_at: row.created_at,
    }));
}

/**
 * Отметить уведомление как прочитанное
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    await executeQuery(
        'UPDATE student_notifications SET is_read = 1 WHERE id = ?',
        [notificationId]
    );
}

/**
 * Отметить все уведомления студента как прочитанные
 */
export async function markAllNotificationsAsRead(studentId: string): Promise<void> {
    await executeQuery(
        'UPDATE student_notifications SET is_read = 1 WHERE student_id = ?',
        [studentId]
    );
}

/**
 * Обработать дедлайны и создать уведомления
 * Вызывается периодически (cron)
 */
export async function processDeadlineNotifications(): Promise<void> {
    console.log('[StudentNotifications] Обработка дедлайнов...');

    const deadlines = await getUpcomingDeadlines();
    console.log(`[StudentNotifications] Найдено дедлайнов: ${deadlines.length}`);

    for (const deadline of deadlines) {
        const hours = deadline.hours_until_deadline;

        // Критический дедлайн (< 24 часов)
        if (hours <= 24 && hours > 0) {
            await createNotification(
                deadline.student_id,
                'DEADLINE_CRITICAL',
                'high',
                'Критический дедлайн!',
                `Тест "${deadline.template_name}" (${deadline.group_name}) необходимо пройти в течение ${hours} часов`,
                `/tests/my`,
                { assignment_id: deadline.assignment_id }
            );
        }
        // Предупреждение о дедлайне (< 72 часов)
        else if (hours <= 72 && hours > 24) {
            await createNotification(
                deadline.student_id,
                'DEADLINE_WARNING',
                'medium',
                'Приближается дедлайн',
                `Тест "${deadline.template_name}" (${deadline.group_name}) необходимо пройти в течение ${Math.round(hours / 24)} дней`,
                `/tests/my`,
                { assignment_id: deadline.assignment_id }
            );
        }
    }

    // Обработка просроченных тестов
    const overdue = await getOverdueTests();
    console.log(`[StudentNotifications] Найдено просроченных: ${overdue.length}`);

    for (const test of overdue) {
        await createNotification(
            test.student_id,
            'TEST_OVERDUE',
            'critical',
            'Тест просрочен',
            `Срок сдачи теста "${test.template_name}" (${test.group_name}) истёк. Свяжитесь с преподавателем.`,
            `/tests/my`,
            { assignment_id: test.assignment_id }
        );
    }

    console.log('[StudentNotifications] Обработка завершена');
}
