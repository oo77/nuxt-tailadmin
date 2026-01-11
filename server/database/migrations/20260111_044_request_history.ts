import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Таблица истории изменений заявок (request_history)
 * Дата: 2026-01-11
 * Описание: Аудит всех действий над заявками для полной прозрачности процесса.
 */

export const description = 'Создание таблицы request_history для аудита заявок';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 044_request_history');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS request_history (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      request_id VARCHAR(191) NOT NULL,
      
      action ENUM(
        'created',           -- Заявка создана
        'employees_updated', -- Изменён список сотрудников
        'reserved',          -- Места забронированы
        'pdf_uploaded',      -- PDF загружен
        'approved',          -- Заявка одобрена
        'rejected',          -- Заявка отклонена
        'withdrawn',         -- Заявка отозвана
        'expired',           -- Бронь истекла
        'note_added'         -- Добавлено примечание
      ) NOT NULL,
      
      performed_by VARCHAR(191) NULL COMMENT 'Кто выполнил действие',
      performed_by_type ENUM('admin', 'manager', 'representative', 'system') NOT NULL,
      
      old_status VARCHAR(50) NULL,
      new_status VARCHAR(50) NULL,
      
      details JSON NULL COMMENT 'Дополнительные данные (например, список добавленных сотрудников)',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_request_id (request_id),
      INDEX idx_created_at (created_at),
      INDEX idx_action (action),
      INDEX idx_request_created (request_id, created_at DESC),
      
      CONSTRAINT fk_history_request 
        FOREIGN KEY (request_id) REFERENCES training_requests(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: request_history');

    console.log('✅ Migration 044_request_history completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 044_request_history');

    await connection.query(`DROP TABLE IF EXISTS request_history`);
    console.log('  ✓ Dropped table: request_history');

    console.log('✅ Rollback 044_request_history completed successfully');
};
