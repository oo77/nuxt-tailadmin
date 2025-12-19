import type { PoolConnection } from 'mysql2/promise';

export const description = 'Создание таблицы files для хранения метаданных файлов';

/**
 * Миграция вверх: создание таблицы files
 */
export async function up(connection: PoolConnection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS files (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      
      uuid CHAR(36) NOT NULL UNIQUE COMMENT 'Публичный UUID для доступа к файлу',
      filename VARCHAR(255) NOT NULL COMMENT 'Оригинальное имя файла',
      stored_name VARCHAR(255) NOT NULL COMMENT 'Имя файла на диске (с хешем)',
      
      mime_type VARCHAR(100) NOT NULL COMMENT 'MIME тип файла',
      size_bytes INT UNSIGNED NOT NULL COMMENT 'Размер файла в байтах',
      extension VARCHAR(10) NOT NULL COMMENT 'Расширение файла',
      
      storage_path VARCHAR(500) NOT NULL COMMENT 'Относительный путь к директории',
      full_path VARCHAR(1000) NOT NULL COMMENT 'Полный путь к файлу',
      
      category ENUM(
        'profile',
        'certificate_template',
        'certificate_generated',
        'course_material',
        'course_media',
        'course_cover',
        'group_gallery',
        'group_file',
        'assignment',
        'other'
      ) NOT NULL COMMENT 'Категория файла',
      
      user_id VARCHAR(36) NULL COMMENT 'UUID пользователя',
      course_id INT UNSIGNED NULL COMMENT 'Связь с курсом',
      group_id INT UNSIGNED NULL COMMENT 'Связь с группой',
      assignment_id INT UNSIGNED NULL COMMENT 'Связь с заданием',
      
      metadata JSON NULL COMMENT 'Дополнительные метаданные',
      
      is_public BOOLEAN DEFAULT FALSE COMMENT 'Публичный доступ',
      access_level ENUM('public', 'authenticated', 'owner', 'admin') DEFAULT 'authenticated',
      
      uploaded_by VARCHAR(36) NOT NULL COMMENT 'UUID пользователя кто загрузил',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_uuid (uuid),
      INDEX idx_category (category),
      INDEX idx_user_id (user_id),
      INDEX idx_course_id (course_id),
      INDEX idx_group_id (group_id),
      INDEX idx_uploaded_by (uploaded_by),
      INDEX idx_deleted_at (deleted_at),
      INDEX idx_created_at (created_at)
      
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ Таблица files создана успешно');
}

/**
 * Миграция вниз: удаление таблицы files
 */
export async function down(connection: PoolConnection): Promise<void> {
  await connection.query('DROP TABLE IF EXISTS files');
  console.log('✅ Таблица files удалена');
}
