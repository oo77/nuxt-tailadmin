import { executeQuery } from '../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Основная статистика
        const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM students WHERE created_at >= ?) as students_last_week,
        (SELECT COUNT(*) FROM instructors) as total_instructors,
        (SELECT COUNT(*) FROM study_groups WHERE end_date >= ?) as active_groups,
        (SELECT COUNT(*) FROM issued_certificates 
         WHERE DATE(issue_date) >= ? AND DATE(issue_date) < ?) as certificates_this_month,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE(?)) as today_registrations
    `;

        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const statsRows = await executeQuery<any[]>(statsQuery, [
            weekAgo,
            now,
            monthStart,
            monthEnd,
            now
        ]);

        const stats = statsRows[0] || {
            total_students: 0,
            students_last_week: 0,
            total_instructors: 0,
            active_groups: 0,
            certificates_this_month: 0,
            total_users: 0,
            today_registrations: 0
        };

        // Вычисляем тренд студентов
        const studentsTrend = stats.total_students > 0
            ? Math.round((stats.students_last_week / stats.total_students) * 100)
            : 0;

        // 2. Активные сессии (примерная оценка - пользователи с активностью за последний час)
        const activeSessionsQuery = `
      SELECT COUNT(DISTINCT user_id) as count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(?, INTERVAL 1 HOUR)
    `;

        let activeSessions = 0;
        try {
            const sessionRows = await executeQuery<any[]>(activeSessionsQuery, [now]);
            activeSessions = sessionRows[0]?.count || 0;
        } catch (e) {
            // Таблица activity_logs может не существовать
        }

        // 3. Логи за сегодня
        const todayLogsQuery = `
      SELECT COUNT(*) as count
      FROM activity_logs
      WHERE DATE(created_at) = DATE(?)
    `;

        let todayLogs = 0;
        try {
            const logsRows = await executeQuery<any[]>(todayLogsQuery, [now]);
            todayLogs = logsRows[0]?.count || 0;
        } catch (e) {
            // Таблица activity_logs может не существовать
        }

        // 4. Системные алерты
        const systemAlerts = [];

        // Проверка на ожидающих представителей
        try {
            const pendingRepsQuery = `
        SELECT COUNT(*) as count
        FROM representatives
        WHERE status = 'pending'
      `;
            const repsRows = await executeQuery<any[]>(pendingRepsQuery);
            if (repsRows[0]?.count > 0) {
                systemAlerts.push({
                    type: 'warning',
                    message: `${repsRows[0].count} представителей ожидают подтверждения`,
                    action: 'Перейти к представителям'
                });
            }
        } catch (e) { }

        // Проверка на открытые тикеты поддержки
        try {
            const openTicketsQuery = `
        SELECT COUNT(*) as count
        FROM support_tickets
        WHERE status IN ('new', 'in_progress')
      `;
            const ticketsRows = await executeQuery<any[]>(openTicketsQuery);
            if (ticketsRows[0]?.count > 0) {
                systemAlerts.push({
                    type: 'warning',
                    message: `${ticketsRows[0].count} тикетов поддержки требуют внимания`,
                    action: 'Открыть поддержку'
                });
            }
        } catch (e) { }

        // 5. Последние действия
        const recentActivitiesQuery = `
      SELECT 
        al.id,
        al.action,
        al.created_at,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `;

        let recentActivities = [];
        try {
            recentActivities = await executeQuery<any[]>(recentActivitiesQuery);
        } catch (e) {
            // Таблица activity_logs может не существовать
        }

        // 6. Активность за неделю (логины по дням)
        const weeklyActivityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as logins
      FROM activity_logs
      WHERE created_at >= ?
        AND action LIKE '%вход%'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

        let weeklyActivity = [];
        try {
            weeklyActivity = await executeQuery<any[]>(weeklyActivityQuery, [weekAgo]);

            // Заполняем пропущенные дни нулями
            const filledActivity = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const existing = weeklyActivity.find(d => {
                    const dStr = new Date(d.date).toISOString().split('T')[0];
                    return dStr === dateStr;
                });

                filledActivity.push({
                    date: dateStr,
                    logins: existing?.logins || 0
                });
            }
            weeklyActivity = filledActivity;
        } catch (e) {
            // Таблица activity_logs может не существовать - создаём пустой массив
            weeklyActivity = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                weeklyActivity.push({
                    date: date.toISOString().split('T')[0],
                    logins: 0
                });
            }
        }

        return {
            isAdmin: true,
            totalStudents: stats.total_students,
            studentsTrend,
            totalInstructors: stats.total_instructors,
            activeGroups: stats.active_groups,
            certificatesThisMonth: stats.certificates_this_month,
            totalUsers: stats.total_users,
            todayRegistrations: stats.today_registrations,
            activeSessions,
            todayLogs,
            systemAlerts,
            recentActivities,
            weeklyActivity
        };

    } catch (error: any) {
        console.error('Failed to get admin dashboard stats:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to retrieve dashboard data',
        });
    }
});
