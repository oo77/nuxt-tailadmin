import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы представителей организаций
 * Дата: 2025-12-24
 * Описание: Создает таблицу для представителей организаций,
 * которые получают доступ к информации о слушателях через Telegram-бот
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_representatives_table');

  // Создание таблицы organization_representatives
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organization_representatives (
      id VARCHAR(191) PRIMARY KEY,
      organization_id VARCHAR(191) NOT NULL COMMENT 'Ссылка на организацию',
      full_name VARCHAR(255) NOT NULL COMMENT 'ФИО представителя',
      phone VARCHAR(20) NOT NULL COMMENT 'Номер телефона',
      telegram_chat_id BIGINT UNIQUE COMMENT 'Telegram Chat ID',
      telegram_username VARCHAR(100) COMMENT 'Username в Telegram',
      status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending' COMMENT 'Статус доступа',
      access_groups JSON COMMENT 'JSON массив ID групп для доступа (null = все группы организации)',
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Получать уведомления',
      last_activity_at DATETIME(3) COMMENT 'Последняя активность в боте',
      approved_by VARCHAR(191) COMMENT 'Кто одобрил заявку',
      approved_at DATETIME(3) COMMENT 'Когда одобрили',
      blocked_reason TEXT COMMENT 'Причина блокировки',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_organization_id (organization_id),
      INDEX idx_telegram_chat_id (telegram_chat_id),
      INDEX idx_status (status),
      INDEX idx_phone (phone),
      FULLTEXT INDEX ft_search (full_name, phone),
      
      CONSTRAINT fk_representatives_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_representatives_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "organization_representatives" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_representatives_table');

  await connection.query('DROP TABLE IF EXISTS organization_representatives');
  console.log('✅ Table "organization_representatives" dropped');
};

export const description = 'Создание таблицы представителей организаций для Telegram-бота';
