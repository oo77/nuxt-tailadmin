import { getDbPool, testConnection } from '../utils/db';
import type { PoolConnection } from 'mysql2/promise';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Интерфейс миграции
 */
interface Migration {
  name: string;
  up: (connection: PoolConnection) => Promise<void>;
  down: (connection: PoolConnection) => Promise<void>;
  description?: string;
}

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
 * Загрузка всех файлов миграций
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(process.cwd(), 'server', 'database', 'migrations');
  
  try {
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter((file) => 
        (file.endsWith('.ts') || file.endsWith('.js')) && 
        !file.startsWith('_') && 
        !file.startsWith('example_') &&
        !file.includes('README')
      )
      .sort(); // Сортировка по имени (timestamp в начале имени)

    const migrations: Migration[] = [];

    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      // Преобразование пути в file:// URL для ESM
      const fileUrl = `file:///${migrationPath.replace(/\\/g, '/')}`;
      
      try {
        const migration = await import(fileUrl);
        
        if (!migration.up || !migration.down) {
          console.warn(`⚠️  Migration ${file} is missing up() or down() function, skipping...`);
          continue;
        }
        
        migrations.push({
          name: file.replace(/\.(ts|js)$/, ''),
          up: migration.up,
          down: migration.down,
          description: migration.description,
        });
      } catch (error) {
        console.error(`❌ Failed to load migration ${file}:`, error);
      }
    }

    return migrations;
  } catch (error) {
    console.error('❌ Failed to load migrations:', error);
    return [];
  }
}

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
      const allMigrations = await loadMigrations();
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
      const allMigrations = await loadMigrations();
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

      const allMigrations = await loadMigrations();

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
      const allMigrations = await loadMigrations();

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
