import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы сессий Telegram-бота
 * Дата: 2025-12-24
 * Описание: Создает таблицу для хранения состояний диалога в Telegram-боте (FSM)
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_telegram_sessions_table');

  // Создание таблицы telegram_bot_sessions
  await connection.query(`
    CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
      id VARCHAR(191) PRIMARY KEY,
      chat_id BIGINT NOT NULL UNIQUE COMMENT 'Telegram Chat ID',
      state VARCHAR(50) NOT NULL DEFAULT 'idle' COMMENT 'Текущее состояние FSM',
      data JSON COMMENT 'Данные сессии (временные данные регистрации и т.д.)',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_chat_id (chat_id),
      INDEX idx_state (state)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "telegram_bot_sessions" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_telegram_sessions_table');

  await connection.query('DROP TABLE IF EXISTS telegram_bot_sessions');
  console.log('✅ Table "telegram_bot_sessions" dropped');
};

export const description = 'Создание таблицы сессий Telegram-бота для FSM';
