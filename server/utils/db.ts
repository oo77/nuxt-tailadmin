import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Получить SSL конфигурацию для Aiven или других облачных провайдеров
 */
function getSslConfig(): mysql.SslOptions | undefined {
  const sslEnabled = process.env.DATABASE_SSL === 'true';

  if (!sslEnabled) {
    return undefined;
  }

  // Путь к CA сертификату
  const caCertPath = process.env.DATABASE_SSL_CA_PATH;

  if (caCertPath) {
    try {
      const ca = readFileSync(caCertPath);
      console.log('🔒 SSL enabled with custom CA certificate');
      return {
        ca,
        rejectUnauthorized: true
      };
    } catch (error) {
      console.error('⚠️ Failed to read CA certificate, falling back to default SSL:', error);
    }
  }

  // Пробуем встроенный сертификат Aiven
  try {
    const aivenCaPath = join(process.cwd(), 'server/certs/aiven-ca.pem');
    const ca = readFileSync(aivenCaPath);
    console.log('🔒 SSL enabled with Aiven CA certificate');
    return {
      ca,
      rejectUnauthorized: true
    };
  } catch {
    // Если сертификат не найден, используем базовый SSL
    console.log('🔒 SSL enabled without CA verification');
    return {
      rejectUnauthorized: false
    };
  }
}

// Конфигурация подключения к БД
const dbConfig: mysql.PoolOptions = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'atc_test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: getSslConfig(),
};

// Создание пула подключений
let pool: mysql.Pool | null = null;

/**
 * Получить пул подключений к БД
 * Создает новый пул при первом вызове и переиспользует его в дальнейшем
 */
export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('✅ MySQL connection pool created');
  }
  return pool;
}

/**
 * Выполнить SQL запрос
 * @param query - SQL запрос
 * @param params - Параметры запроса
 * @returns Результат запроса
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T;
  } finally {
    connection.release();
  }
}

/**
 * Выполнить несколько запросов в транзакции
 * @param callback - Функция с запросами
 * @returns Результат транзакции
 */
export async function executeTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Проверить подключение к БД
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getDbPool().getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
