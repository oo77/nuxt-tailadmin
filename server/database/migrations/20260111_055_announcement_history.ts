import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы announcement_history
 * 
 * История всех изменений объявлений и заявок для аудита.
 */

export const description = 'Создание таблицы announcement_history для истории изменений';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 055_announcement_history');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS announcement_history (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Связи (опциональные, так как может быть связано либо с объявлением, либо с заявкой)
      announcement_id VARCHAR(191) NULL COMMENT 'ID объявления',
      request_id VARCHAR(191) NULL COMMENT 'ID заявки',
      
      -- Информация о действии
      action VARCHAR(100) NOT NULL
        COMMENT 'Тип действия (created, updated, published, approved, rejected и т.д.)',
      actor_id VARCHAR(191) NULL COMMENT 'ID пользователя, совершившего действие',
      details JSON NULL
        COMMENT 'Детали изменения в формате JSON',
      
      -- Метаданные
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_announcement_history_announcement (announcement_id),
      INDEX idx_announcement_history_request (request_id),
      INDEX idx_announcement_history_actor (actor_id),
      INDEX idx_announcement_history_created (created_at),
      INDEX idx_announcement_history_action (action),
      
      -- Внешние ключи
      CONSTRAINT fk_announcement_history_announcement 
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_history_request 
        FOREIGN KEY (request_id) REFERENCES announcement_requests(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_history_actor 
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: announcement_history');

    console.log('✅ Migration 055_announcement_history completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 055_announcement_history');

    await connection.query(`DROP TABLE IF EXISTS announcement_history`);
    console.log('  ✓ Dropped table: announcement_history');

    console.log('✅ Rollback 055_announcement_history completed successfully');
};
