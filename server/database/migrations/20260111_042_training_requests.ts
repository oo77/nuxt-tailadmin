import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Таблица заявок на обучение (training_requests)
 * Дата: 2026-01-11
 * Описание: Создаём таблицу для заявок от представителей организаций.
 *   Статусы заявок:
 *   - pending: на рассмотрении
 *   - reserved: забронировано (места зарезервированы, ожидает PDF)
 *   - approved: одобрена (сотрудники зачислены)
 *   - rejected: отклонена
 *   - withdrawn: отозвана представителем
 */

export const description = 'Создание таблицы training_requests для заявок на обучение';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 042_training_requests');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS training_requests (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Связи
      group_id VARCHAR(191) NOT NULL COMMENT 'Группа обучения',
      organization_id VARCHAR(191) NOT NULL COMMENT 'Организация-заявитель',
      representative_id VARCHAR(191) NOT NULL COMMENT 'Представитель, подавший заявку',
      
      -- Статус с БРОНИРОВАНИЕМ
      status ENUM(
        'pending',     -- На рассмотрении
        'reserved',    -- ЗАБРОНИРОВАНО (места зарезервированы, ожидает PDF)
        'approved',    -- Одобрена (сотрудники зачислены)
        'rejected',    -- Отклонена
        'withdrawn'    -- Отозвана представителем
      ) NOT NULL DEFAULT 'pending',
      
      -- Количество сотрудников (рассчитывается автоматически из request_employees)
      employees_count INT NOT NULL DEFAULT 0 COMMENT 'Количество сотрудников в заявке',
      
      -- PDF-файл заявки (обязателен для финального одобрения)
      pdf_file_id INT UNSIGNED NULL COMMENT 'ID файла заявки в таблице files',
      
      -- Бронирование
      reserved_by VARCHAR(191) NULL COMMENT 'Кто забронировал места',
      reserved_at DATETIME(3) NULL COMMENT 'Когда забронировано',
      reservation_expires_at DATETIME(3) NULL COMMENT 'Срок действия брони (например, 3 дня)',
      
      -- Финальное решение
      decision_by VARCHAR(191) NULL COMMENT 'Кто принял финальное решение',
      decision_at DATETIME(3) NULL COMMENT 'Когда принято решение',
      rejection_reason TEXT NULL COMMENT 'Причина отклонения',
      
      -- Примечания
      representative_notes TEXT NULL COMMENT 'Примечания от представителя',
      admin_notes TEXT NULL COMMENT 'Внутренние заметки администратора',
      
      -- Метаданные
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_group_id (group_id),
      INDEX idx_organization_id (organization_id),
      INDEX idx_representative_id (representative_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_reservation_expires (reservation_expires_at),
      INDEX idx_status_created (status, created_at DESC),
      INDEX idx_representative_status (representative_id, status),
      
      -- Внешние ключи
      CONSTRAINT fk_requests_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE RESTRICT,
      CONSTRAINT fk_requests_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
      CONSTRAINT fk_requests_representative 
        FOREIGN KEY (representative_id) REFERENCES organization_representatives(id) ON DELETE RESTRICT,
      CONSTRAINT fk_requests_reserved_by 
        FOREIGN KEY (reserved_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_requests_decision_by 
        FOREIGN KEY (decision_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_requests_pdf_file 
        FOREIGN KEY (pdf_file_id) REFERENCES files(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: training_requests');

    console.log('✅ Migration 042_training_requests completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 042_training_requests');

    await connection.query(`DROP TABLE IF EXISTS training_requests`);
    console.log('  ✓ Dropped table: training_requests');

    console.log('✅ Rollback 042_training_requests completed successfully');
};
