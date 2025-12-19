import { getDbPool, testConnection } from '../utils/db';
import type { PoolConnection } from 'mysql2/promise';

// ============================================================================
// СТАТИЧЕСКИЕ ИМПОРТЫ МИГРАЦИЙ
// ============================================================================
// При добавлении новой миграции:
// 1. Создайте файл миграции в ./migrations/
// 2. Добавьте import ниже
// 3. Добавьте в MIGRATIONS_REGISTRY

import * as migration001 from './migrations/20251215_001_create_users_table';
import * as migration002 from './migrations/20251215_002_seed_admin_user';
import * as migration003 from './migrations/20251216_003_create_students_tables';
import * as migration004 from './migrations/20251216_004_create_courses_tables';
import * as migration005 from './migrations/20251217_005_update_instructors_table';
import * as migration006 from './migrations/20251218_add_discipline_hours_breakdown';
import * as migration007 from './migrations/20251218_007_create_files_table';
import * as migration008 from './migrations/20251218_008_add_folders_support';
import * as migration009 from './migrations/20251219_009_create_activity_logs_table';

/**
 * ============================================================================
 * СИСТЕМА МИГРАЦИЙ СО СТАТИЧЕСКИМ РЕЕСТРОМ (Вариант C)
 * ============================================================================
 * 
 * Преимущества:
 * ✅ Никаких проблем с путями — работает на 100% ОС
 * ✅ Нет динамических import() — TypeScript видит всё
 * ✅ Максимальная производительность — импорты на этапе компиляции
 * ✅ Tree-shaking работает корректно
 * 
 * При добавлении новой миграции:
 * 1. Создайте файл миграции в ./migrations/
 * 2. Добавьте статический import выше
 * 3. Добавьте запись в MIGRATIONS_REGISTRY ниже
 * ============================================================================
 */

// ============================================================================
// ИНТЕРФЕЙС МИГРАЦИИ
// ============================================================================

interface Migration { 
  name: string;
  up: (connection: PoolConnection) => Promise<void>;
  down: (connection: PoolConnection) => Promise<void>;
  description?: string;
}

// ============================================================================
// РЕЕСТР МИГРАЦИЙ (статический)
// ============================================================================

const MIGRATIONS_REGISTRY: Migration[] = [
  {
    name: '20251215_001_create_users_table',
    up: migration001.up,
    down: migration001.down,
    description: migration001.description,
  },
  {
    name: '20251215_002_seed_admin_user',
    up: migration002.up,
    down: migration002.down,
    description: migration002.description,
  },
  {
    name: '20251216_003_create_students_tables',
    up: migration003.up,
    down: migration003.down,
    description: migration003.description,
  },
  {
    name: '20251216_004_create_courses_tables',
    up: migration004.up,
    down: migration004.down,
    description: migration004.description,
  },
  {
    name: '20251217_005_update_instructors_table',
    up: migration005.up,
    down: migration005.down,
    description: migration005.description,
  },
  {
    name: '20251218_add_discipline_hours_breakdown',
    up: migration006.up,
    down: migration006.down,
    description: migration006.description,
  },
  {
    name: '20251218_007_create_files_table',
    up: migration007.up,
    down: migration007.down,
    description: migration007.description,
  },
  {
    name: '20251218_008_add_folders_support',
    up: migration008.up,
    down: migration008.down,
    description: migration008.description,
  },
  {
    name: '20251219_009_create_activity_logs_table',
    up: migration009.up,
    down: migration009.down,
    description: migration009.description,
  },
  // Добавляйте новые миграции здесь:
  // {
  //   name: '20251220_010_your_migration',
  //   up: migration010.up,
  //   down: migration010.down,
  //   description: migration010.description,
  // },
];

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Создание таблицы для отслеживания миграций
 */
async function createMigrationsTable(connection: PoolConnection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_executed_at (executed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * Получение списка выполненных миграций
 */
async function getExecutedMigrations(connection: PoolConnection): Promise<string[]> {
  const [rows] = await connection.query<any[]>(
    'SELECT name FROM migrations ORDER BY executed_at ASC'
  );
  return rows.map((row) => row.name);
}

/**
 * Запись выполненной миграции
 */
async function recordMigration(
  connection: PoolConnection,
  name: string,
  description?: string
): Promise<void> {
  await connection.query(
    'INSERT INTO migrations (name, description) VALUES (?, ?)',
    [name, description || null]
  );
}

/**
 * Удаление записи о миграции
 */
async function removeMigrationRecord(
  connection: PoolConnection,
  name: string
): Promise<void> {
  await connection.query('DELETE FROM migrations WHERE name = ?', [name]);
}

/**
 * Загрузка всех миграций из статического реестра
 */
function loadMigrations(): Migration[] {
  console.log(`📋 Loaded ${MIGRATIONS_REGISTRY.length} migrations from static registry`);
  return MIGRATIONS_REGISTRY;
}

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ МИГРАЦИЙ
// ============================================================================

/**
 * Применение всех непримененных миграций
 */
export async function runMigrations(): Promise<void> {
  console.log('🔄 Starting database migrations...');

  try {
    // Проверка подключения
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      // Создание таблицы миграций
      await createMigrationsTable(connection);

      // Получение выполненных миграций
      const executedMigrations = await getExecutedMigrations(connection);
      console.log(`ℹ️  Found ${executedMigrations.length} executed migrations`);

      // Загрузка всех миграций
      const allMigrations = loadMigrations();
      console.log(`ℹ️  Found ${allMigrations.length} migration files`);

      // Фильтрация непримененных миграций
      const pendingMigrations = allMigrations.filter(
        (migration) => !executedMigrations.includes(migration.name)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ All migrations are up to date');
        return;
      }

      console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

      // Применение миграций
      for (const migration of pendingMigrations) {
        console.log(`\n📦 Migration: ${migration.name}`);
        if (migration.description) {
          console.log(`   ${migration.description}`);
        }

        await connection.beginTransaction();

        try {
          await migration.up(connection);
          await recordMigration(connection, migration.name, migration.description);
          await connection.commit();
          console.log(`✅ Migration ${migration.name} completed`);
        } catch (error) {
          await connection.rollback();
          console.error(`❌ Migration ${migration.name} failed:`, error);
          throw error;
        }
      }

      console.log('\n✅ All migrations completed successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    throw error;
  }
}

/**
 * Откат последней миграции
 */
export async function rollbackMigration(): Promise<void> {
  console.log('🔄 Rolling back last migration...');

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      // Получение последней выполненной миграции
      const [rows] = await connection.query<any[]>(
        'SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1'
      );

      if (!rows || rows.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      const lastMigrationName = rows[0].name;
      console.log(`📦 Rolling back: ${lastMigrationName}`);

      // Загрузка миграции
      const allMigrations = loadMigrations();
      const migration = allMigrations.find((m) => m.name === lastMigrationName);

      if (!migration) {
        throw new Error(`Migration file not found: ${lastMigrationName}`);
      }

      await connection.beginTransaction();

      try {
        await migration.down(connection);
        await removeMigrationRecord(connection, lastMigrationName);
        await connection.commit();
        console.log(`✅ Migration ${lastMigrationName} rolled back successfully`);
      } catch (error) {
        await connection.rollback();
        console.error(`❌ Rollback failed:`, error);
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Rollback process failed:', error);
    throw error;
  }
}

/**
 * Откат всех миграций
 */
export async function rollbackAllMigrations(): Promise<void> {
  console.log('⚠️  Rolling back ALL migrations...');

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const executedMigrations = await getExecutedMigrations(connection);

      if (executedMigrations.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      const allMigrations = loadMigrations();

      // Откат в обратном порядке
      for (let i = executedMigrations.length - 1; i >= 0; i--) {
        const migrationName = executedMigrations[i];
        const migration = allMigrations.find((m) => m.name === migrationName);

        if (!migration) {
          console.warn(`⚠️  Migration file not found: ${migrationName}, skipping...`);
          continue;
        }

        console.log(`\n📦 Rolling back: ${migrationName}`);

        await connection.beginTransaction();

        try {
          await migration.down(connection);
          await removeMigrationRecord(connection, migrationName);
          await connection.commit();
          console.log(`✅ Migration ${migrationName} rolled back`);
        } catch (error) {
          await connection.rollback();
          console.error(`❌ Rollback failed for ${migrationName}:`, error);
          throw error;
        }
      }

      console.log('\n✅ All migrations rolled back successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Rollback all process failed:', error);
    throw error;
  }
}

/**
 * Получение статуса миграций
 */
export async function getMigrationStatus(): Promise<void> {
  console.log('📊 Migration Status\n');

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await createMigrationsTable(connection);

      const executedMigrations = await getExecutedMigrations(connection);
      const allMigrations = loadMigrations();

      console.log(`Total migrations: ${allMigrations.length}`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${allMigrations.length - executedMigrations.length}\n`);

      if (allMigrations.length > 0) {
        console.log('Migrations:');
        for (const migration of allMigrations) {
          const status = executedMigrations.includes(migration.name) ? '✅' : '⏳';
          console.log(`${status} ${migration.name}`);
          if (migration.description) {
            console.log(`   ${migration.description}`);
          }
        }
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    throw error;
  }
}
