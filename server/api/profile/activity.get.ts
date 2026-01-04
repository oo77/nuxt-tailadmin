/**
 * API endpoint для получения активности пользователя
 * GET /api/profile/activity
 */

import { defineEventHandler, getQuery } from 'h3'
import { requireAuth } from '../../utils/permissions'
import { executeQuery } from '../../utils/db'

export default defineEventHandler(async (event) => {
    // Проверяем авторизацию
    const context = await requireAuth(event)

    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 10
    const offset = parseInt(query.offset as string) || 0

    try {
        // Получаем активность текущего пользователя
        const activities = await executeQuery<any[]>(
            `
      SELECT 
        id,
        action_type,
        entity_type,
        entity_id,
        entity_name,
        details,
        ip_address,
        user_agent,
        created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
            [context.userId, limit, offset]
        )

        // Получаем общее количество записей
        const countResult = await executeQuery<any[]>(
            `
      SELECT COUNT(*) as total
      FROM activity_logs
      WHERE user_id = ?
      `,
            [context.userId]
        )

        const total = countResult[0]?.total || 0

        return {
            success: true,
            activities: activities || [],
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        }
    } catch (error: any) {
        console.error('Error fetching user activity:', error)
        throw createError({
            statusCode: 500,
            message: 'Ошибка при получении активности пользователя',
        })
    }
})
