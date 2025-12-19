import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы журнала действий пользователей
 * Дата: 2025-12-19
 * Описание: Создает таблицу activity_logs для хранения истории действий пользователей
 */

export const description = 'Создание таблицы activity_logs для журнала действий пользователей';

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_activity_logs_table');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL COMMENT 'ID пользователя, выполнившего действие',
      
      action_type ENUM(
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'IMPORT',
        'EXPORT'
      ) NOT NULL COMMENT 'Тип действия',
      
      entity_type ENUM(
        'USER',
        'STUDENT',
        'CERTIFICATE',
        'COURSE',
        'DISCIPLINE',
        'INSTRUCTOR',
        'FILE',
        'FOLDER',
        'SYSTEM'
      ) NOT NULL COMMENT 'Тип сущности',
      
      entity_id VARCHAR(191) NULL COMMENT 'ID сущности, над которой выполнено действие',
      entity_name VARCHAR(255) NULL COMMENT 'Название сущности для отображения',
      
      details JSON NULL COMMENT 'Дополнительные данные о действии',
      
      ip_address VARCHAR(45) NULL COMMENT 'IP адрес пользователя',
      user_agent TEXT NULL COMMENT 'User Agent браузера',
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Дата и время действия',
      
      INDEX idx_user_id (user_id),
      INDEX idx_action_type (action_type),
      INDEX idx_entity_type (entity_type),
      INDEX idx_entity_id (entity_id),
      INDEX idx_created_at (created_at),
      INDEX idx_user_created (user_id, created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "activity_logs" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_activity_logs_table');

  await connection.query('DROP TABLE IF EXISTS activity_logs');

  console.log('✅ Table "activity_logs" dropped successfully');
};
