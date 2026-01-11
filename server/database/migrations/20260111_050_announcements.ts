import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы announcements (Объявления о наборе на обучение)
 * 
 * Объявления - это отдельная сущность для публикации информации о планируемом обучении
 * и приёма заявок от представителей организаций.
 */

export const description = 'Создание таблицы announcements для системы объявлений';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 050_announcements');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Основная информация
      title VARCHAR(500) NOT NULL COMMENT 'Название объявления',
      description TEXT NULL COMMENT 'Подробное описание',
      announcement_type ENUM('single_group', 'multiple_groups', 'program') 
        NOT NULL DEFAULT 'single_group'
        COMMENT 'Тип объявления: одна группа, несколько групп или программа',
      
      -- Статус объявления
      status ENUM('draft', 'published', 'closed', 'archived') 
        NOT NULL DEFAULT 'draft'
        COMMENT 'Статус: черновик, опубликовано, закрыто, архив',
      
      -- Даты
      published_at DATETIME(3) NULL COMMENT 'Дата публикации',
      deadline DATETIME(3) NULL COMMENT 'Срок подачи заявок',
      start_date DATE NULL COMMENT 'Дата начала обучения',
      end_date DATE NULL COMMENT 'Дата окончания обучения',
      
      -- Настройки приёма заявок
      accepts_requests BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'Принимаются ли заявки',
      requires_employee_list BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Требуется ли список сотрудников при подаче заявки',
      allows_reservation BOOLEAN NOT NULL DEFAULT TRUE
        COMMENT 'Разрешено ли бронирование мест без списка сотрудников',
      max_total_capacity INT UNSIGNED NULL
        COMMENT 'Максимальная общая вместимость по всем группам',
      
      -- Дополнительная информация
      requirements TEXT NULL COMMENT 'Требования к участникам',
      contact_info TEXT NULL COMMENT 'Контактная информация',
      
      -- Метаданные
      created_by VARCHAR(191) NULL COMMENT 'ID создателя',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_announcements_status (status),
      INDEX idx_announcements_published_at (published_at),
      INDEX idx_announcements_deadline (deadline),
      INDEX idx_announcements_created_by (created_by),
      INDEX idx_announcements_status_published (status, published_at DESC),
      
      -- Внешние ключи
      CONSTRAINT fk_announcements_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✓ Created table: announcements');

    console.log('✅ Migration 050_announcements completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 050_announcements');

    await connection.query(`DROP TABLE IF EXISTS announcements`);
    console.log('  ✓ Dropped table: announcements');

    console.log('✅ Rollback 050_announcements completed successfully');
};
