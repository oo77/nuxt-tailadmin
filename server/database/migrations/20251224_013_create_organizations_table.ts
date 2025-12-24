import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Создание таблицы организаций
 * Дата: 2025-12-24
 * Описание: Создает таблицу organizations для управления организациями слушателей.
 * Эта таблица необходима для:
 * - Централизованного управления информацией об организациях
 * - Связи с представителями организаций (через Telegram-бот)
 * - Быстрого поиска и фильтрации слушателей по организации
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: create_organizations_table');

  // Создание таблицы organizations
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Уникальный код организации (нормализованное название)',
      name VARCHAR(255) NOT NULL COMMENT 'Полное название организации',
      short_name VARCHAR(100) COMMENT 'Краткое название',
      contact_phone VARCHAR(20) COMMENT 'Контактный телефон',
      contact_email VARCHAR(100) COMMENT 'Контактный email',
      address TEXT COMMENT 'Адрес организации',
      description TEXT COMMENT 'Описание организации',
      is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Активна ли организация',
      students_count INT NOT NULL DEFAULT 0 COMMENT 'Кэшированное количество слушателей',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_code (code),
      INDEX idx_name (name),
      INDEX idx_is_active (is_active),
      FULLTEXT INDEX ft_search (name, short_name, address)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "organizations" created successfully');

  // Добавляем поле organization_id в таблицу students
  // Сначала проверяем, существует ли уже это поле
  const [columns] = await connection.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students' 
    AND COLUMN_NAME = 'organization_id'
  `) as any[];

  if (columns.length === 0) {
    await connection.query(`
      ALTER TABLE students 
      ADD COLUMN organization_id VARCHAR(191) NULL 
      AFTER organization,
      ADD INDEX idx_organization_id (organization_id),
      ADD CONSTRAINT fk_students_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ Added organization_id column to students table');
  } else {
    console.log('ℹ️ Column organization_id already exists in students table');
  }

  // Создаем организации на основе существующих данных в таблице students
  // и связываем студентов с организациями
  console.log('🔄 Migrating existing organizations from students...');

  // Получаем уникальные организации из студентов
  const [existingOrgs] = await connection.query(`
    SELECT DISTINCT organization FROM students WHERE organization IS NOT NULL AND organization != ''
  `) as any[];

  if (existingOrgs.length > 0) {
    const { v4: uuidv4 } = await import('uuid');
    const now = new Date();

    for (const row of existingOrgs) {
      const orgName = row.organization.trim();
      // Создаем код из названия (нормализуем)
      const orgCode = orgName
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/gi, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);

      const id = uuidv4();

      // Создаем организацию
      await connection.query(
        `INSERT IGNORE INTO organizations (id, code, name, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, orgCode || id, orgName, now, now]
      );

      // Обновляем студентов этой организации
      await connection.query(
        `UPDATE students SET organization_id = ? WHERE organization = ?`,
        [id, orgName]
      );
    }

    console.log(`✅ Migrated ${existingOrgs.length} organizations from students`);

    // Обновляем счетчик студентов для каждой организации
    await connection.query(`
      UPDATE organizations o
      SET students_count = (
        SELECT COUNT(*) FROM students s WHERE s.organization_id = o.id
      )
    `);
    console.log('✅ Updated students count for all organizations');
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: create_organizations_table');

  // Сначала удаляем внешний ключ и колонку из students
  try {
    await connection.query(`
      ALTER TABLE students 
      DROP FOREIGN KEY fk_students_organization
    `);
  } catch (e) {
    console.log('ℹ️ Foreign key fk_students_organization does not exist');
  }

  try {
    await connection.query(`
      ALTER TABLE students 
      DROP COLUMN organization_id
    `);
    console.log('✅ Dropped organization_id column from students');
  } catch (e) {
    console.log('ℹ️ Column organization_id does not exist in students');
  }

  // Удаляем таблицу organizations
  await connection.query('DROP TABLE IF EXISTS organizations');
  console.log('✅ Table "organizations" dropped');
};

export const description = 'Создание таблицы organizations и связи со студентами';
