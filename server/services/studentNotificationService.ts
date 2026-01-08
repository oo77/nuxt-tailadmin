
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../utils/db';

export type NotificationType =
    | 'TEST_UPCOMING'
    | 'TEST_TODAY'
    | 'TEST_OVERDUE'
    | 'DEADLINE_WARNING'
    | 'DEADLINE_CRITICAL'
    | 'SCHEDULE_CHANGE'
    | 'GRADE_POSTED';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface CreateNotificationDTO {
    studentId: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}

/**
 * Сервис для работы с уведомлениями студентов
 */
export const studentNotificationService = {
    /**
     * Создать уведомление для студента
     */
    async create(dto: CreateNotificationDTO) {
        const id = uuidv4();

        await executeQuery(
            `INSERT INTO student_notifications (
        id, student_id, type, priority, title, message, link, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                id,
                dto.studentId,
                dto.type,
                dto.priority,
                dto.title,
                dto.message,
                dto.link || null,
                dto.metadata ? JSON.stringify(dto.metadata) : null
            ]
        );

        return id;
    },

    /**
     * Создать массовое уведомление (для группы студентов)
     */
    async createMany(studentIds: string[], dto: Omit<CreateNotificationDTO, 'studentId'>) {
        if (studentIds.length === 0) return;

        const values: any[] = [];
        const placeholders: string[] = [];

        for (const studentId of studentIds) {
            const id = uuidv4();
            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW())');
            values.push(
                id,
                studentId,
                dto.type,
                dto.priority,
                dto.title,
                dto.message,
                dto.link || null,
                dto.metadata ? JSON.stringify(dto.metadata) : null
            );
        }

        await executeQuery(
            `INSERT INTO student_notifications (
        id, student_id, type, priority, title, message, link, metadata, created_at
      ) VALUES ${placeholders.join(', ')}`,
            values
        );
    },

    /**
     * Отметить уведомление как прочитанное
     */
    async markAsRead(id: string, studentId: string) {
        await executeQuery(
            'UPDATE student_notifications SET is_read = TRUE WHERE id = ? AND student_id = ?',
            [id, studentId]
        );
    },

    /**
     * Отметить все уведомления как прочитанные
     */
    async markAllAsRead(studentId: string) {
        await executeQuery(
            'UPDATE student_notifications SET is_read = TRUE WHERE student_id = ?',
            [studentId]
        );
    },

    /**
     * Получить непрочитанные уведомления
     */
    async getUnread(studentId: string, limit = 10) {
        return executeQuery(
            `SELECT * FROM student_notifications 
       WHERE student_id = ? AND is_read = FALSE 
       ORDER BY created_at DESC LIMIT ?`,
            [studentId, limit]
        );
    },

    /**
     * Получить все уведомления с пагинацией
     */
    async getAll(studentId: string, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const notifications = await executeQuery(
            `SELECT * FROM student_notifications 
       WHERE student_id = ? 
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [studentId, limit, offset]
        );

        const countResult = await executeQuery(
            'SELECT COUNT(*) as total FROM student_notifications WHERE student_id = ?',
            [studentId]
        );

        return {
            items: notifications,
            total: countResult[0]?.total || 0,
            page,
            limit
        };
    }
};
