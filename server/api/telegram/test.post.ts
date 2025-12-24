/**
 * POST /api/telegram/test
 * Тестовый endpoint для симуляции сообщений Telegram
 * Позволяет тестировать бота без настройки webhook
 * 
 * ТОЛЬКО ДЛЯ РАЗРАБОТКИ! В продакшене должен быть отключен.
 */

import { defineEventHandler, readBody, createError } from 'h3';
import { handleUpdate } from '../../services/telegramBotService';

export default defineEventHandler(async (event) => {
  // Проверяем, что мы в dev режиме
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Тестовый endpoint недоступен в production',
    });
  }

  // Проверяем авторизацию через middleware
  const user = event.context.user;
  if (!user || user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ запрещён. Требуются права администратора.',
    });
  }

  try {
    const body = await readBody(event);
    const { chatId, text, command, username } = body || {};

    if (!chatId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Укажите chatId',
      });
    }

    // Определяем текст сообщения
    const messageText = command || text;
    if (!messageText) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Укажите text или command',
      });
    }

    // Формируем объект update как от Telegram
    const fakeUpdate = {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: parseInt(chatId),
          is_bot: false,
          first_name: 'Test',
          last_name: 'User',
          username: username || 'testuser',
        },
        chat: {
          id: parseInt(chatId),
          type: 'private',
          first_name: 'Test',
          last_name: 'User',
          username: username || 'testuser',
        },
        date: Math.floor(Date.now() / 1000),
        text: messageText,
      },
    };

    console.log(`[Telegram Test] Симуляция сообщения от chatId=${chatId}: ${messageText}`);

    // Обрабатываем как обычное сообщение
    await handleUpdate(fakeUpdate);

    return {
      success: true,
      message: `Сообщение обработано: ${messageText}`,
      note: 'Ответ бота отправлен в Telegram чат (если токен корректный)',
    };
    
  } catch (error: any) {
    console.error('[Telegram Test] Ошибка:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка обработки тестового сообщения',
    });
  }
});
