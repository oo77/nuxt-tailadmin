/**
 * API Endpoint: GET /api/certificates/my
 * 
 * Получение сертификатов текущего авторизованного пользователя (студента)
 */

import { H3Event } from 'h3'
import { requirePermission, getStudentByUserId } from '../../utils/permissions'
import { Permission } from '../../types/permissions'
import { executeQuery } from '../../utils/db'
import { logActivity } from '../../utils/activityLogger'

interface StudentCertificate {
  id: string
  courseName: string
  groupCode: string
  status: 'issued' | 'revoked'
  issuedAt: string
  expiresAt: string | null
}

export default defineEventHandler(async (event: H3Event) => {
  console.log('[API] GET /api/certificates/my - Запрос сертификатов текущего пользователя')

  // Проверяем разрешение на просмотр своих сертификатов
  const context = await requirePermission(event, Permission.CERTIFICATES_VIEW_OWN)

  // Получаем student_id текущего пользователя
  const student = await getStudentByUserId(context.userId)

  if (!student) {
    // Если пользователь не является студентом, возвращаем пустой список
    console.log(`[API] Пользователь ${context.userId} не связан со студентом`)
    return {
      success: true,
      certificates: [],
    }
  }

  console.log(`[API] Получение сертификатов для студента ${student.id} (${student.fullName})`)

  try {
    // Получаем сертификаты студента
    const [certificates] = await executeQuery<any[]>(`
      SELECT 
        c.id,
        c.status,
        c.issued_at as issuedAt,
        c.expires_at as expiresAt,
        c.certificate_number as certificateNumber,
        co.name as courseName,
        sg.code as groupCode
      FROM certificates c
      INNER JOIN study_groups sg ON c.group_id = sg.id
      INNER JOIN courses co ON sg.course_id = co.id
      WHERE c.student_id = ?
        AND c.status IN ('issued', 'revoked')
      ORDER BY c.issued_at DESC
    `, [student.id])

    const result: StudentCertificate[] = certificates.map(cert => ({
      id: cert.id,
      courseName: cert.courseName,
      groupCode: cert.groupCode,
      status: cert.status,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
    }))

    // Логируем действие
    await logActivity(
      event,
      'VIEW',
      'CERTIFICATE',
      undefined,
      undefined,
      { message: `Просмотр своих сертификатов (${result.length} шт.)` }
    )

    console.log(`[API] Найдено ${result.length} сертификатов для студента ${student.id}`)

    return {
      success: true,
      certificates: result,
    }
  } catch (error: any) {
    console.error('[API] Ошибка получения сертификатов:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Ошибка при получении сертификатов',
    })
  }
})
