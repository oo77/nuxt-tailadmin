import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Добавление роли REPRESENTATIVE в таблицу users
 * Дата: 2026-01-11
 * Описание: Расширяем ENUM role для поддержки представителей организаций.
 *   Также добавляем связь user_id в organization_representatives для веб-авторизации.
 */

export const description = 'Добавление роли REPRESENTATIVE в users и связи с organization_representatives';

// Утилита для проверки существования колонки
async function columnExists(connection: PoolConnection, table: string, column: string): Promise<boolean> {
  const [rows] = await connection.query<any[]>(`
    SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
  `, [table, column]);
  return rows[0]?.cnt > 0;
}

// Утилита для проверки существования индекса
async function indexExists(connection: PoolConnection, table: string, indexName: string): Promise<boolean> {
  const [rows] = await connection.query<any[]>(`
    SELECT COUNT(*) as cnt FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
  `, [table, indexName]);
  return rows[0]?.cnt > 0;
}

// Утилита для проверки существования FK
async function fkExists(connection: PoolConnection, table: string, fkName: string): Promise<boolean> {
  const [rows] = await connection.query<any[]>(`
    SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `, [table, fkName]);
  return rows[0]?.cnt > 0;
}

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: 045_add_representative_role');

  // Изменяем ENUM role в таблице users (безопасно - просто расширяем)
  await connection.query(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('ADMIN', 'MANAGER', 'TEACHER', 'STUDENT', 'REPRESENTATIVE') 
    NOT NULL DEFAULT 'STUDENT'
  `);
  console.log('  ✓ Modified users.role ENUM to include REPRESENTATIVE');

  // Добавляем связь с таблицей users в organization_representatives
  if (!(await columnExists(connection, 'organization_representatives', 'user_id'))) {
    await connection.query(`
      ALTER TABLE organization_representatives 
      ADD COLUMN user_id VARCHAR(191) NULL 
      COMMENT 'Связь с таблицей users для веб-авторизации'
    `);
    console.log('  ✓ Added column: organization_representatives.user_id');
  } else {
    console.log('  ℹ Column organization_representatives.user_id already exists');
  }

  // Добавляем Foreign Key
  if (!(await fkExists(connection, 'organization_representatives', 'fk_representatives_user'))) {
    await connection.query(`
      ALTER TABLE organization_representatives 
      ADD CONSTRAINT fk_representatives_user 
      FOREIGN KEY (user_id) REFERENCES users(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('  ✓ Added FK: fk_representatives_user');
  } else {
    console.log('  ℹ FK fk_representatives_user already exists');
  }

  // Добавляем индекс
  if (!(await indexExists(connection, 'organization_representatives', 'idx_representatives_user_id'))) {
    await connection.query(`
      CREATE INDEX idx_representatives_user_id ON organization_representatives(user_id)
    `);
    console.log('  ✓ Created index: idx_representatives_user_id');
  } else {
    console.log('  ℹ Index idx_representatives_user_id already exists');
  }

  // Добавляем дополнительные поля для представителей в organization_representatives
  if (!(await columnExists(connection, 'organization_representatives', 'permissions'))) {
    await connection.query(`
      ALTER TABLE organization_representatives 
      ADD COLUMN permissions JSON DEFAULT NULL 
      COMMENT 'JSON объект с разрешениями представителя'
    `);
    console.log('  ✓ Added column: organization_representatives.permissions');
  } else {
    console.log('  ℹ Column organization_representatives.permissions already exists');
  }

  if (!(await columnExists(connection, 'organization_representatives', 'can_receive_notifications'))) {
    await connection.query(`
      ALTER TABLE organization_representatives 
      ADD COLUMN can_receive_notifications BOOLEAN NOT NULL DEFAULT TRUE 
      COMMENT 'Может получать уведомления'
    `);
    console.log('  ✓ Added column: organization_representatives.can_receive_notifications');
  } else {
    console.log('  ℹ Column organization_representatives.can_receive_notifications already exists');
  }

  console.log('✅ Migration 045_add_representative_role completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: 045_add_representative_role');

  // Удаляем добавленные поля из organization_representatives
  if (await columnExists(connection, 'organization_representatives', 'can_receive_notifications')) {
    await connection.query(`
      ALTER TABLE organization_representatives DROP COLUMN can_receive_notifications
    `);
  }
  if (await columnExists(connection, 'organization_representatives', 'permissions')) {
    await connection.query(`
      ALTER TABLE organization_representatives DROP COLUMN permissions
    `);
  }
  console.log('  ✓ Dropped columns: can_receive_notifications, permissions');

  // Удаляем индекс
  if (await indexExists(connection, 'organization_representatives', 'idx_representatives_user_id')) {
    await connection.query(`DROP INDEX idx_representatives_user_id ON organization_representatives`);
  }
  console.log('  ✓ Dropped index: idx_representatives_user_id');

  // Удаляем FK
  if (await fkExists(connection, 'organization_representatives', 'fk_representatives_user')) {
    await connection.query(`
      ALTER TABLE organization_representatives DROP FOREIGN KEY fk_representatives_user
    `);
  }
  console.log('  ✓ Dropped FK: fk_representatives_user');

  // Удаляем колонку user_id
  if (await columnExists(connection, 'organization_representatives', 'user_id')) {
    await connection.query(`
      ALTER TABLE organization_representatives DROP COLUMN user_id
    `);
  }
  console.log('  ✓ Dropped column: user_id');

  // Откатываем ENUM role - удаляем REPRESENTATIVE
  // Сначала обновляем все записи с REPRESENTATIVE на STUDENT
  await connection.query(`
    UPDATE users SET role = 'STUDENT' WHERE role = 'REPRESENTATIVE'
  `);
  await connection.query(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('ADMIN', 'MANAGER', 'TEACHER', 'STUDENT') 
    NOT NULL DEFAULT 'STUDENT'
  `);
  console.log('  ✓ Reverted users.role ENUM');

  console.log('✅ Rollback 045_add_representative_role completed successfully');
};
