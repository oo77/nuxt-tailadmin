import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы announcement_requests
 * 
 * Заявки от представителей организаций на объявления о наборе.
 */

export const description = 'Создание таблицы announcement_requests для заявок на объявления';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 052_announcement_requests');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS announcement_requests (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Связи
      announcement_id VARCHAR(191) NOT NULL COMMENT 'ID объявления',
      organization_id VARCHAR(191) NOT NULL COMMENT 'ID организации',
      representative_id VARCHAR(191) NOT NULL COMMENT 'ID представителя',
      
      -- Статус заявки
      status ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled')
        NOT NULL DEFAULT 'draft'
        COMMENT 'Статус: черновик, на рассмотрении, одобрено, отклонено, отменено',
      
      -- Тип заявки
      request_type ENUM('with_employees', 'reservation')
        NOT NULL DEFAULT 'with_employees'
        COMMENT 'Тип: со списком сотрудников или бронирование мест',
      
      -- Общая информация
      total_requested_slots INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT 'Общее количество запрошенных мест',
      comment TEXT NULL COMMENT 'Комментарий от представителя',
      
      -- PDF документ заявки
      pdf_file_path VARCHAR(500) NULL COMMENT 'Путь к PDF файлу заявки',
      pdf_uploaded_at DATETIME(3) NULL COMMENT 'Дата загрузки PDF',
      
      -- Статусы и даты обработки
      submitted_at DATETIME(3) NULL COMMENT 'Дата подачи заявки',
      reviewed_at DATETIME(3) NULL COMMENT 'Дата рассмотрения',
      reviewed_by VARCHAR(191) NULL COMMENT 'ID рассмотревшего администратора',
      rejection_reason TEXT NULL COMMENT 'Причина отклонения',
      
      -- Метаданные
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_announcement_requests_announcement (announcement_id),
      INDEX idx_announcement_requests_organization (organization_id),
      INDEX idx_announcement_requests_representative (representative_id),
      INDEX idx_announcement_requests_status (status),
      INDEX idx_announcement_requests_submitted (submitted_at),
      INDEX idx_announcement_requests_status_submitted (status, submitted_at DESC),
      
      -- Внешние ключи
      CONSTRAINT fk_announcement_requests_announcement 
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_requests_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_requests_representative 
        FOREIGN KEY (representative_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_announcement_requests_reviewed_by 
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: announcement_requests');

    console.log('✅ Migration 052_announcement_requests completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 052_announcement_requests');

    await connection.query(`DROP TABLE IF EXISTS announcement_requests`);
    console.log('  ✓ Dropped table: announcement_requests');

    console.log('✅ Rollback 052_announcement_requests completed successfully');
};
