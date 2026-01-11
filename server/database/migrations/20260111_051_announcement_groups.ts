import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы announcement_groups
 * 
 * Связывает объявления с учебными группами.
 * Одно объявление может включать несколько групп.
 */

export const description = 'Создание таблицы announcement_groups для связи объявлений и групп';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 051_announcement_groups');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS announcement_groups (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Связи
      announcement_id VARCHAR(191) NOT NULL COMMENT 'ID объявления',
      group_id VARCHAR(191) NOT NULL COMMENT 'ID учебной группы',
      
      -- Настройки для конкретной группы в объявлении
      max_capacity INT UNSIGNED NULL
        COMMENT 'Максимальная вместимость для этой группы',
      current_reserved INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT 'Текущее количество зарезервированных мест',
      display_order INT NOT NULL DEFAULT 0
        COMMENT 'Порядок отображения в списке',
      is_visible BOOLEAN NOT NULL DEFAULT TRUE
        COMMENT 'Видимость группы в объявлении',
      
      -- Метаданные
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_announcement_groups_announcement (announcement_id),
      INDEX idx_announcement_groups_group (group_id),
      INDEX idx_announcement_groups_visible (is_visible),
      
      -- Уникальность: одна группа не может быть дважды в одном объявлении
      UNIQUE KEY unique_announcement_group (announcement_id, group_id),
      
      -- Внешние ключи
      CONSTRAINT fk_announcement_groups_announcement 
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_groups_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: announcement_groups');

    console.log('✅ Migration 051_announcement_groups completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 051_announcement_groups');

    await connection.query(`DROP TABLE IF EXISTS announcement_groups`);
    console.log('  ✓ Dropped table: announcement_groups');

    console.log('✅ Rollback 051_announcement_groups completed successfully');
};
