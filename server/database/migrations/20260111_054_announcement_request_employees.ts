import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы announcement_request_employees
 * 
 * Список сотрудников (студентов), указанных в заявке для конкретной группы.
 */

export const description = 'Создание таблицы announcement_request_employees для сотрудников в заявках';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 054_announcement_request_employees');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS announcement_request_employees (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Связи
      request_group_id VARCHAR(191) NOT NULL
        COMMENT 'ID группы в заявке (announcement_request_groups)',
      student_id VARCHAR(191) NOT NULL COMMENT 'ID студента (сотрудника)',
      
      -- Статус сотрудника
      status ENUM('proposed', 'confirmed', 'enrolled', 'rejected')
        NOT NULL DEFAULT 'proposed'
        COMMENT 'Статус: предложен, подтверждён, зачислен, отклонён',
      
      -- Дополнительная информация
      notes TEXT NULL COMMENT 'Примечания',
      
      -- Метаданные
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_announcement_request_employees_request_group (request_group_id),
      INDEX idx_announcement_request_employees_student (student_id),
      INDEX idx_announcement_request_employees_status (status),
      
      -- Уникальность: один студент не может быть дважды в одной группе заявки
      UNIQUE KEY unique_request_student (request_group_id, student_id),
      
      -- Внешние ключи
      CONSTRAINT fk_announcement_request_employees_request_group 
        FOREIGN KEY (request_group_id) REFERENCES announcement_request_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_request_employees_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: announcement_request_employees');

    console.log('✅ Migration 054_announcement_request_employees completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 054_announcement_request_employees');

    await connection.query(`DROP TABLE IF EXISTS announcement_request_employees`);
    console.log('  ✓ Dropped table: announcement_request_employees');

    console.log('✅ Rollback 054_announcement_request_employees completed successfully');
};
