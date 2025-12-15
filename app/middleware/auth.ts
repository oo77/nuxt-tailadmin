import type { UserRole } from '~/types/auth'

/**
 * Публичные страницы, доступные без аутентификации
 */
const PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
]

/**
 * Страницы, доступные только для определенных ролей
 * Формат: { path: string, roles: UserRole[] }
 */
const ROLE_PROTECTED_PAGES: Record<string, UserRole[]> = {
  '/admin': ['ADMIN'],
  '/users': ['ADMIN', 'MANAGER'],
  '/teachers': ['ADMIN', 'MANAGER'],
  '/students': ['ADMIN', 'MANAGER', 'TEACHER'],
}

/**
 * Проверяет, является ли страница публичной
 */
function isPublicPage(path: string): boolean {
  return PUBLIC_PAGES.some(page => path.startsWith(page))
}

/**
 * Получает требуемые роли для страницы
 */
function getRequiredRoles(path: string): UserRole[] | null {
  for (const [page, roles] of Object.entries(ROLE_PROTECTED_PAGES)) {
    if (path.startsWith(page)) {
      return roles
    }
  }
  return null
}

/**
 * Проверяет, имеет ли пользователь необходимую роль
 */
function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Клиентский middleware для защиты страниц
 * 
 * Логика работы:
 * 1. Пропускает публичные страницы без проверки
 * 2. Для защищенных страниц проверяет наличие токена
 * 3. Верифицирует токен через API
 * 4. Проверяет роли пользователя для страниц с ограничениями
 * 5. Редиректит на /auth/signin если не авторизован
 * 6. Редиректит на главную если недостаточно прав
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Пропускаем публичные страницы
  if (isPublicPage(to.path)) {
    return
  }

  // Получаем токен из cookie
  const token = useCookie('auth_token')

  // Если токена нет - редирект на страницу входа
  if (!token.value) {
    return navigateTo({
      path: '/auth/signin',
      query: { redirect: to.fullPath },
    })
  }

  // Верифицируем токен через API
  try {
    const response = await $fetch('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    // Проверяем успешность верификации
    if (!response.success || !response.user) {
      throw new Error('Верификация не удалась')
    }

    const user = response.user

    // Проверяем роли для страниц с ограничениями
    const requiredRoles = getRequiredRoles(to.path)

    if (requiredRoles && !hasRequiredRole(user.role, requiredRoles)) {
      // Недостаточно прав - редирект на главную
      return navigateTo({
        path: '/',
        query: { 
          error: 'access_denied',
          message: `Требуется одна из ролей: ${requiredRoles.join(', ')}`,
        },
      })
    }

    // Все проверки пройдены, пользователь может получить доступ к странице
  } catch (error) {
    // Токен невалиден или произошла ошибка
    console.error('[Auth Middleware] Ошибка верификации:', error)

    // Удаляем невалидный токен
    token.value = null

    // Редирект на страницу входа
    return navigateTo({
      path: '/auth/signin',
      query: { 
        redirect: to.fullPath,
        error: 'session_expired',
      },
    })
  }
})
