import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Таблица сотрудников в заявках (request_employees)
 * Дата: 2026-01-11
 * Описание: Связь заявок с существующими студентами организации.
 *   Сотрудники выбираются из списка students организации.
 *   Статусы зачисления:
 *   - pending: ожидает зачисления
 *   - enrolled: зачислен в группу
 *   - removed: удалён из заявки
 */

export const description = 'Создание таблицы request_employees для связи заявок со студентами';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 043_request_employees');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS request_employees (
      id VARCHAR(191) PRIMARY KEY,
      request_id VARCHAR(191) NOT NULL,
      
      -- СВЯЗЬ С СУЩЕСТВУЮЩИМ СТУДЕНТОМ (обязательная)
      student_id VARCHAR(191) NOT NULL COMMENT 'Ссылка на существующего студента',
      
      -- Статус в заявке
      enrollment_status ENUM(
        'pending',      -- Ожидает зачисления
        'enrolled',     -- Зачислен в группу
        'removed'       -- Удалён из заявки
      ) NOT NULL DEFAULT 'pending',
      
      enrolled_at DATETIME(3) NULL COMMENT 'Когда зачислен в группу',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      -- Уникальность: один студент может быть только в одной заявке на группу
      -- (проверяется через комбинацию request_id + student_id)
      UNIQUE INDEX idx_request_student (request_id, student_id),
      INDEX idx_student_id (student_id),
      INDEX idx_enrollment_status (enrollment_status),
      
      CONSTRAINT fk_employees_request 
        FOREIGN KEY (request_id) REFERENCES training_requests(id) ON DELETE CASCADE,
      CONSTRAINT fk_employees_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: request_employees');

    console.log('✅ Migration 043_request_employees completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 043_request_employees');

    await connection.query(`DROP TABLE IF EXISTS request_employees`);
    console.log('  ✓ Dropped table: request_employees');

    console.log('✅ Rollback 043_request_employees completed successfully');
};
