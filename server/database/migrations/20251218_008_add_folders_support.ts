/**
 * Миграция: Добавление поддержки папок
 * Создает таблицу folders и добавляет folder_id в таблицу files
 */

import type { PoolConnection } from 'mysql2/promise';

export const description = 'Добавление поддержки папок для файлового менеджера';

export async function up(connection: PoolConnection): Promise<void> {
  // Создание таблицы folders (БЕЗ foreign keys)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS folders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(36) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      parent_id INT UNSIGNED NULL,
      path VARCHAR(1024) NOT NULL,
      user_id VARCHAR(36) NULL,
      is_system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_parent_id (parent_id),
      INDEX idx_path (path(255)),
      INDEX idx_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✓ Таблица folders создана');

  // Добавление folder_id в таблицу files
  await connection.query(`
    ALTER TABLE files
    ADD COLUMN folder_id INT UNSIGNED NULL AFTER category,
    ADD INDEX idx_folder_id (folder_id);
  `);

  console.log('✓ Колонка folder_id добавлена в таблицу files');

  // Создание корневых системных папок
  const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const systemFolders = [
    { name: 'Курсы', path: '/Курсы' },
    { name: 'Сертификаты', path: '/Сертификаты' },
    { name: 'Профили', path: '/Профили' },
    { name: 'Группы', path: '/Группы' },
    { name: 'Прочее', path: '/Прочее' },
  ];

  for (const folder of systemFolders) {
    await connection.query(
      `INSERT INTO folders (uuid, name, parent_id, path, is_system) VALUES (?, ?, NULL, ?, TRUE)`,
      [uuid(), folder.name, folder.path]
    );
  }

  console.log('✓ Системные папки созданы');
}

export async function down(connection: PoolConnection): Promise<void> {
  // Удаление колонки folder_id
  await connection.query(`
    ALTER TABLE files
    DROP COLUMN folder_id;
  `);

  console.log('✓ Колонка folder_id удалена из таблицы files');

  // Удаление таблицы folders
  await connection.query(`DROP TABLE IF EXISTS folders;`);

  console.log('✓ Таблица folders удалена');
}
