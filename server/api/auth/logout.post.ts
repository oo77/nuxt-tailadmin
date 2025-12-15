/**
 * API endpoint для выхода пользователя
 * POST /api/auth/logout
 * 
 * В текущей реализации с JWT токенами, выход происходит на клиенте
 * путем удаления токена. Этот endpoint может быть использован для:
 * - Логирования выхода
 * - Инвалидации refresh токенов (если используется blacklist)
 * - Очистки сессий на сервере
 */
export default defineEventHandler(async (event) => {
  try {
    // В будущем здесь можно добавить:
    // 1. Добавление токена в blacklist
    // 2. Удаление refresh токена из БД
    // 3. Логирование события выхода

    console.log('✅ User logged out');

    return {
      success: true,
      message: 'Выход выполнен успешно',
    };
  } catch (error: any) {
    console.error('Logout error:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Logout Failed',
      data: {
        success: false,
        message: 'Ошибка при выходе из системы',
      },
    });
  }
});
