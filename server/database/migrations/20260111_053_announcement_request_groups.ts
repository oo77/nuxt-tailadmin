import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы announcement_request_groups
 * 
 * Связывает заявки с конкретными группами из объявления.
 * Одна заявка может включать несколько групп.
 */

export const description = 'Создание таблицы announcement_request_groups для групп в заявках';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 053_announcement_request_groups');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS announcement_request_groups (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Связи
      request_id VARCHAR(191) NOT NULL COMMENT 'ID заявки',
      announcement_group_id VARCHAR(191) NOT NULL
        COMMENT 'ID группы из объявления (announcement_groups)',
      
      -- Количество мест
      requested_slots INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT 'Запрошенное количество мест',
      reserved_slots INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT 'Зарезервированное количество мест (после одобрения)',
      
      -- Статус для конкретной группы
      status ENUM('pending', 'approved', 'rejected', 'waitlist')
        NOT NULL DEFAULT 'pending'
        COMMENT 'Статус: на рассмотрении, одобрено, отклонено, лист ожидания',
      
      -- Метаданные
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_announcement_request_groups_request (request_id),
      INDEX idx_announcement_request_groups_group (announcement_group_id),
      INDEX idx_announcement_request_groups_status (status),
      
      -- Уникальность: одна группа не может быть дважды в одной заявке
      UNIQUE KEY unique_request_group (request_id, announcement_group_id),
      
      -- Внешние ключи
      CONSTRAINT fk_announcement_request_groups_request 
        FOREIGN KEY (request_id) REFERENCES announcement_requests(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_request_groups_group 
        FOREIGN KEY (announcement_group_id) REFERENCES announcement_groups(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: announcement_request_groups');

    console.log('✅ Migration 053_announcement_request_groups completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 053_announcement_request_groups');

    await connection.query(`DROP TABLE IF EXISTS announcement_request_groups`);
    console.log('  ✓ Dropped table: announcement_request_groups');

    console.log('✅ Rollback 053_announcement_request_groups completed successfully');
};
